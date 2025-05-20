'use client'

import React, { useState, useEffect } from 'react';
import {
  useAppKitAccount,
  useAppKitProvider,
  useAppKitNetworkCore,
  type Provider,
} from "@reown/appkit/react";
import {
  BrowserProvider,
  type EventLog,
} from "ethers";
import { ethers } from 'ethers';
import './SwapEvent.css';

interface SwapEvent {
  address: string;
  fromToken: string;
  toToken: string;
  fee: string;
  timestamp: number;
  transactionHash: string;
}

const SwapEvent = () => {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetworkCore();
  const { walletProvider } = useAppKitProvider<Provider>("eip155");
  const [swapEvents, setSwapEvents] = useState<SwapEvent[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 5;

  useEffect(() => {
    let isSubscribed = true;
    let contract: ethers.Contract | null = null;

    const fetchSwapEvents = async () => {
      if (!walletProvider || !chainId || !address) {
        console.log('Provider or address not ready:', { walletProvider, chainId, address });
        return;
      }

      try {
        const provider = new BrowserProvider(walletProvider, chainId);
        const AlphaBot = "0xcb4C74125CE9f3240DedAE1bf087208C549B1d39";
        const AlphaBot_ABI = [
          "event SwapTo(address indexed sender, address fromToken, address toToken, uint256 fee)",
        ];

        contract = new ethers.Contract(AlphaBot, AlphaBot_ABI, provider);
        
        // Clear any existing listeners
        if (contract) {
          contract.removeAllListeners();
        }

        // Set up new event listener with reconnection logic
        if (contract && isSubscribed) {
          const setupEventListener = () => {
            if (!isSubscribed || !contract) return;

            contract.on("SwapTo", async (sender, fromToken, toToken, fee, event) => {
              if (!isSubscribed) return;
              
              if (sender.toLowerCase() === address.toLowerCase()) {
                try {
                  const block = await provider.getBlock(event.blockNumber);
                  const newEvent = {
                    address: sender,
                    fromToken,
                    toToken,
                    fee: ethers.formatEther(fee),
                    timestamp: block?.timestamp || Math.floor(Date.now() / 1000),
                    transactionHash: event.log.transactionHash,
                  };
                  console.log('New swap event received:', newEvent);
                  setSwapEvents(prev => [newEvent, ...prev]);
                } catch (error) {
                  console.error('Error processing new swap event:', error);
                }
              }
            });

            // Handle connection errors
            contract.on("error", (error) => {
              console.error("Contract event listener error:", error);
              // Remove all listeners
              contract?.removeAllListeners();
              // Attempt to reconnect after a delay
              setTimeout(() => {
                if (isSubscribed && contract) {
                  console.log("Attempting to reconnect event listener...");
                  setupEventListener();
                }
              }, 5000); // 5 second delay before reconnecting
            });
          };

          // Initial setup
          setupEventListener();

          // Set up network status monitoring
          const handleNetworkChange = () => {
            if (isSubscribed && contract) {
              console.log("Network status changed, reconnecting event listener...");
              contract.removeAllListeners();
              setupEventListener();
            }
          };

          // Listen for network changes
          window.addEventListener('online', handleNetworkChange);
          window.addEventListener('offline', handleNetworkChange);

          // Cleanup network listeners
          return () => {
            window.removeEventListener('online', handleNetworkChange);
            window.removeEventListener('offline', handleNetworkChange);
          };
        }
        
        // Get historical events - batch query
        const filter = contract.filters.SwapTo(address);
        const batchSize = 1000;
        const maxBlocks = 50000;
        let allEvents: ethers.Log[] = [];
        
        const currentBlock = await provider.getBlockNumber();
        
        for (let toBlock = currentBlock; toBlock > currentBlock - maxBlocks; toBlock -= batchSize) {
          if (!isSubscribed) break; // Check if component is still mounted
          
          const fromBlock = Math.max(toBlock - batchSize + 1, currentBlock - maxBlocks);
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries && isSubscribed) {
            try {
              const batchEvents = await contract.queryFilter(filter, fromBlock, toBlock);
              allEvents = [...allEvents, ...batchEvents];
              console.log(`Queried blocks ${fromBlock} to ${toBlock}`);
              
              const newEvents = await Promise.all(batchEvents.map(async event => {
                const log = event as EventLog;
                const block = await provider.getBlock(event.blockNumber);
                return {
                  address: log.args[0].toString(),
                  fromToken: log.args[1].toString(),
                  toToken: log.args[2].toString(),
                  fee: ethers.formatEther(log.args[3]),
                  timestamp: block?.timestamp || Math.floor(Date.now() / 1000),
                  transactionHash: log.transactionHash,
                };
              }));
              
              if (isSubscribed) {
                setSwapEvents(prev => {
                  const combined = [...newEvents, ...prev];
                  return combined.sort((a, b) => b.timestamp - a.timestamp);
                });
              }
              
              break;
            } catch (error) {
              retryCount++;
              console.error(`Error querying blocks ${fromBlock} to ${toBlock} (Attempt ${retryCount}/${maxRetries}):`, error);
              if (retryCount === maxRetries) {
                console.error(`Failed to query blocks ${fromBlock} to ${toBlock} after ${maxRetries} attempts`);
              }
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
          }
        }
      } catch (error) {
        console.error('Error in fetchSwapEvents:', error);
      }
    };

    fetchSwapEvents();

    // Cleanup function
    return () => {
      isSubscribed = false;
      if (contract) {
        contract.removeAllListeners();
      }
    };
  }, [walletProvider, chainId, isConnected, address]);

  // Calculate pagination
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = swapEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(swapEvents.length / eventsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="swap-event-container">
      <h3>今日交易记录</h3>
      <table className="swap-event-table">
        <thead>
          <tr>
            <th>交易哈希</th>
            {/* <th>From Token</th>
            <th>To Token</th> */}
            <th>费用</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          {currentEvents.map((event, index) => (
            <tr key={index}>
              <td className="address-column">
                <a 
                  href={`https://bscscan.com/tx/${event.transactionHash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bscscan-link"
                >
                  {event.transactionHash}
                </a>
              </td>
              {/* <td>{event.fromToken}</td>
              <td>{event.toToken}</td> */}
              <td>{event.fee} BNB</td>
              <td>{new Date(event.timestamp * 1000).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="pagination">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
          <button
            key={number}
            onClick={() => handlePageChange(number)}
            className={`page-button ${currentPage === number ? 'active' : ''}`}
          >
            {number}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SwapEvent;
