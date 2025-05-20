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

        const AlphaBotContract = new ethers.Contract(AlphaBot, AlphaBot_ABI, provider);
        
        // 清除之前的事件监听器
        AlphaBotContract.removeAllListeners();
        
        // 获取历史事件 - 分批查询
        const filter = AlphaBotContract.filters.SwapTo(address);
        const batchSize = 1000; // 每批查询的区块数
        const maxBlocks = 1000; // 最大查询区块数
        let allEvents: ethers.Log[] = [];
        
        // 获取当前区块号
        const currentBlock = await provider.getBlockNumber();
        
        // 分批查询历史事件
        for (let fromBlock = currentBlock - maxBlocks; fromBlock < currentBlock; fromBlock += batchSize) {
          const toBlock = Math.min(fromBlock + batchSize - 1, currentBlock);
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries) {
            try {
              const batchEvents = await AlphaBotContract.queryFilter(filter, fromBlock, toBlock);
              allEvents = [...allEvents, ...batchEvents];
              console.log(`Queried blocks ${fromBlock} to ${toBlock}`);
              break; // 成功查询后跳出重试循环
            } catch (error) {
              retryCount++;
              console.error(`Error querying blocks ${fromBlock} to ${toBlock} (Attempt ${retryCount}/${maxRetries}):`, error);
              if (retryCount === maxRetries) {
                console.error(`Failed to query blocks ${fromBlock} to ${toBlock} after ${maxRetries} attempts`);
              }
              // 等待时间随重试次数增加
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
          }
        }
        
        // 处理历史事件
        const historicalEvents = await Promise.all(allEvents.map(async event => {
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
        
        // 按时间戳降序排序
        historicalEvents.sort((a, b) => b.timestamp - a.timestamp);
        setSwapEvents(historicalEvents);
        
        // 设置新事件的监听器
        AlphaBotContract.on("SwapTo", async (sender, fromToken, toToken, fee, event) => {
          if (sender.toLowerCase() === address.toLowerCase()) {
            const block = await provider.getBlock(event.blockNumber);
            setSwapEvents(prev => [{
              address: sender,
              fromToken,
              toToken,
              fee: ethers.formatEther(fee),
              timestamp: block?.timestamp || Math.floor(Date.now() / 1000),
              transactionHash: event.transactionHash,
            }, ...prev]);
          }
        });

        // 添加新区块监听器
        provider.on('block', async (blockNumber) => {
          console.log('New block:', blockNumber);
          try {
            const newEvents = await AlphaBotContract.queryFilter(filter, blockNumber, blockNumber);
            if (newEvents.length > 0) {
              const processedEvents = await Promise.all(newEvents.map(async event => {
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
              setSwapEvents(prev => [...processedEvents, ...prev]);
            }
          } catch (error) {
            console.error('Error processing new block events:', error);
          }
        });

        return () => {
          AlphaBotContract.removeAllListeners();
          provider.removeAllListeners();
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
            <th>交易哈希</th>
            {/* <th>From Token</th>
            <th>To Token</th> */}
            <th>费用</th>
            <th>时间</th>
            <th>交易</th>
          </tr>
        </thead>
        <tbody>
          {currentEvents.map((event, index) => (
            <tr key={index}>
              <td className="address-column">{event.transactionHash}</td>
              {/* <td>{event.fromToken}</td>
              <td>{event.toToken}</td> */}
              <td>{event.fee} BNB</td>
              <td>{new Date(event.timestamp * 1000).toLocaleString()}</td>
              <td>
                <a 
                  href={`https://bscscan.com/tx/${event.transactionHash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bscscan-link"
                >
                  查看
                </a>
              </td>
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
