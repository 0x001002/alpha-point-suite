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
} from "ethers";
import { ethers } from 'ethers';
import { usePair } from '@/context/PairContext';
import './SwapEvent.css';

interface SwapEvent {
  address: string;
  fromToken: string;
  toToken: string;
  fee: string;
  timestamp: number;
}

const SwapEvent = () => {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetworkCore();
  const { walletProvider } = useAppKitProvider<Provider>("eip155");
  const [swapEvents, setSwapEvents] = useState<SwapEvent[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 5;

  useEffect(() => {
    const fetchSwapEvents = async () => {
      if (!walletProvider || !isConnected || !chainId) {
        console.log('Provider not ready:', { walletProvider, isConnected, chainId });
        return;
      }

      try {
        const provider = new BrowserProvider(walletProvider, chainId);
        const AlphaBot = "0x9D746c9bc734702887eE1Ab636a242BCEaBeb6eE";
        const AlphaBot_ABI = [
          "event Swap(address indexed sender, address fromToken, address toToken, uint256 fee)",
        ];

        const AlphaBotContract = new ethers.Contract(AlphaBot, AlphaBot_ABI, provider);
        
        // Set up event listener for new swaps
        AlphaBotContract.on("Swap", (sender, fromToken, toToken, amount, fee) => {
          if (sender.toLowerCase() === address?.toLowerCase()) {
            setSwapEvents(prev => [{
              address: sender,
              fromToken,
              toToken,
              fee: ethers.formatEther(fee),
              timestamp: Math.floor(Date.now() / 1000),
            }, ...prev]);
          }
        });

        return () => {
          AlphaBotContract.removeAllListeners();
        };
      } catch (error) {
        console.error('Error in fetchSwapEvents:', error);
      }
    };

    fetchSwapEvents();
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
      <h3>Swap Events</h3>
      <table className="swap-event-table">
        <thead>
          <tr>
            <th>地址</th>
            {/* <th>From Token</th>
            <th>To Token</th> */}
            <th>费用</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          {currentEvents.map((event, index) => (
            <tr key={index}>
              <td className="address-column">{event.address}</td>
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
