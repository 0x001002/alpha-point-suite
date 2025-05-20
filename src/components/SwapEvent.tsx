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
      if (!walletProvider || !chainId || !address) {
        console.log('Provider or address not ready:', { walletProvider, chainId, address });
        return;
      }

      try {
        const provider = new BrowserProvider(walletProvider, chainId);
        const AlphaBot = "0x3ad264b758A6E1EC76b3099d644263db12BCb490";
        const AlphaBot_ABI = [
          "event SwapTo(address indexed sender, address fromToken, address toToken, uint256 fee)",
        ];

        const AlphaBotContract = new ethers.Contract(AlphaBot, AlphaBot_ABI, provider);
        
        // 清除之前的事件监听器
        AlphaBotContract.removeAllListeners();
        
        // 获取历史事件
        const filter = AlphaBotContract.filters.SwapTo(address);
        const events = await AlphaBotContract.queryFilter(filter, -10000, "latest");
        
        // 处理历史事件
        const historicalEvents = events.map(event => {
          const log = event as ethers.EventLog;
          return {
            address: log.args[0].toString(),
            fromToken: log.args[1].toString(),
            toToken: log.args[2].toString(),
            fee: ethers.formatEther(log.args[3]),
            timestamp: Math.floor(Date.now() / 1000),
          };
        });
        
        setSwapEvents(historicalEvents);
        
        // 设置新事件的监听器
        AlphaBotContract.on("SwapTo", (sender, fromToken, toToken, fee) => {
          if (sender.toLowerCase() === address.toLowerCase()) {
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
