'use client'

import React, { useState, useEffect, useRef } from 'react';
import {
  useAppKitAccount,
  useAppKitProvider,
  useAppKitNetworkCore,
  type Provider,
} from "@reown/appkit/react";
import {
  BrowserProvider,
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
  const lastProcessedBlockRef = useRef<number>(0);
  const processedTxHashesRef = useRef<Set<string>>(new Set());
  const ALPHA_BOT_ADDRESS = "0xcb4C74125CE9f3240DedAE1bf087208C549B1d39";

  useEffect(() => {
    let isSubscribed = true;
    let pollingInterval: NodeJS.Timeout;

    const setupPolling = async () => {
      if (!walletProvider || !chainId || !address) {
        console.log('Provider or address not ready:', { walletProvider, chainId, address });
        return;
      }

      try {
        const provider = new BrowserProvider(walletProvider, chainId);
        const AlphaBot_ABI = [
          "event SwapTo(address indexed sender, address fromToken, address toToken, uint256 fee)",
        ];

        const contract = new ethers.Contract(ALPHA_BOT_ADDRESS, AlphaBot_ABI, provider);

        // Get initial block number if not set
        if (lastProcessedBlockRef.current === 0) {
          const currentBlock = await provider.getBlockNumber();
          lastProcessedBlockRef.current = currentBlock - 1000; // Start from 1000 blocks ago
        }

        // Fetch historical events first
        await fetchHistoricalEvents(provider, contract);

        // Setup polling
        const pollForNewEvents = async () => {
          if (!isSubscribed) return;

          try {
            const currentBlock = await provider.getBlockNumber();
            const fromBlock = lastProcessedBlockRef.current + 1;
            
            if (fromBlock > currentBlock) return;

            const filter = contract.filters.SwapTo(address);
            const logs = await provider.getLogs({
              address: ALPHA_BOT_ADDRESS,
              fromBlock,
              toBlock: currentBlock,
              topics: [
                ethers.id("SwapTo(address,address,address,uint256)"),  // 事件签名
                ethers.zeroPadValue(address, 32)  // 发送者地址（第一个 indexed 参数）
              ]
            });

            const newEvents = await Promise.all(
              logs.map(async (log) => {
                const event = contract.interface.parseLog(log);
                const block = await provider.getBlock(log.blockNumber);
                return {
                  address: event?.args[0].toString() || '',
                  fromToken: event?.args[1].toString() || '',
                  toToken: event?.args[2].toString() || '',
                  fee: ethers.formatEther(event?.args[3] || 0),
                  timestamp: block?.timestamp || Math.floor(Date.now() / 1000),
                  transactionHash: log.transactionHash,
                };
              })
            );

            // Filter out duplicates and add new events
            const uniqueNewEvents = newEvents.filter(event => 
              !processedTxHashesRef.current.has(event.transactionHash)
            );

            if (uniqueNewEvents.length > 0) {
              uniqueNewEvents.forEach(event => 
                processedTxHashesRef.current.add(event.transactionHash)
              );

              setSwapEvents(prev => {
                const combined = [...uniqueNewEvents, ...prev];
                return combined.sort((a, b) => b.timestamp - a.timestamp);
              });
            }

            lastProcessedBlockRef.current = currentBlock;
          } catch (error) {
            console.error('Error polling for new events:', error);
          }
        };

        // Poll every 2 seconds
        pollingInterval = setInterval(pollForNewEvents, 2000);

      } catch (error) {
        console.error('Error setting up polling:', error);
      }
    };

    const fetchHistoricalEvents = async (provider: BrowserProvider, contract: ethers.Contract) => {
      if (!isSubscribed || !address) return;

      try {
        const batchSize = 1000;
        const maxBlocks = 50000;
        
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(currentBlock - maxBlocks, 0);
        
        for (let toBlock = currentBlock; toBlock > fromBlock; toBlock -= batchSize) {
          if (!isSubscribed) break;
          
          const batchFromBlock = Math.max(toBlock - batchSize + 1, fromBlock);
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries && isSubscribed) {
            try {
              const logs = await provider.getLogs({
                address: ALPHA_BOT_ADDRESS,
                fromBlock: batchFromBlock,
                toBlock,
                topics: [
                  ethers.id("SwapTo(address,address,address,uint256)"),  // 事件签名
                  ethers.zeroPadValue(address, 32)  // 发送者地址（第一个 indexed 参数）
                ]
              });
              
              const newEvents = await Promise.all(logs.map(async log => {
                const event = contract.interface.parseLog(log);
                const block = await provider.getBlock(log.blockNumber);
                return {
                  address: event?.args[0].toString() || '',
                  fromToken: event?.args[1].toString() || '',
                  toToken: event?.args[2].toString() || '',
                  fee: ethers.formatEther(event?.args[3] || 0),
                  timestamp: block?.timestamp || Math.floor(Date.now() / 1000),
                  transactionHash: log.transactionHash,
                };
              }));

              // Filter out duplicates
              const uniqueNewEvents = newEvents.filter(event => 
                !processedTxHashesRef.current.has(event.transactionHash)
              );

              if (uniqueNewEvents.length > 0) {
                uniqueNewEvents.forEach(event => 
                  processedTxHashesRef.current.add(event.transactionHash)
                );

                setSwapEvents(prev => {
                  const combined = [...uniqueNewEvents, ...prev];
                  return combined.sort((a, b) => b.timestamp - a.timestamp);
                });
              }
              
              break;
            } catch (error) {
              retryCount++;
              console.error(`Error querying blocks ${batchFromBlock} to ${toBlock} (Attempt ${retryCount}/${maxRetries}):`, error);
              if (retryCount === maxRetries) {
                console.error(`Failed to query blocks ${batchFromBlock} to ${toBlock} after ${maxRetries} attempts`);
              }
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching historical events:', error);
      }
    };

    setupPolling();

    // Cleanup function
    return () => {
      isSubscribed = false;
      if (pollingInterval) {
        clearInterval(pollingInterval);
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
        {(() => {
          const pages = [];
          if (totalPages <= 5) {
            // 如果总页数小于等于5，显示所有页码
            for (let i = 1; i <= totalPages; i++) {
              pages.push(
                <button
                  key={i}
                  onClick={() => handlePageChange(i)}
                  className={`page-button ${currentPage === i ? 'active' : ''}`}
                >
                  {i}
                </button>
              );
            }
          } else {
            // 如果总页数大于5，显示前3页、省略号和最后一页
            // 前3页
            for (let i = 1; i <= 3; i++) {
              pages.push(
                <button
                  key={i}
                  onClick={() => handlePageChange(i)}
                  className={`page-button ${currentPage === i ? 'active' : ''}`}
                >
                  {i}
                </button>
              );
            }
            
            // 省略号
            pages.push(
              <span key="ellipsis" className="page-ellipsis">
                ...
              </span>
            );
            
            // 最后一页
            pages.push(
              <button
                key={totalPages}
                onClick={() => handlePageChange(totalPages)}
                className={`page-button ${currentPage === totalPages ? 'active' : ''}`}
              >
                {totalPages}
              </button>
            );
          }
          return pages;
        })()}
      </div>
    </div>
  );
};

export default SwapEvent;
