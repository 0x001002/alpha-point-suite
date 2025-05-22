'use client'

import React, { useState, useEffect } from 'react';
import {
  useAppKitAccount,
  useAppKitProvider,
  type Provider,
} from "@reown/appkit/react";
import './PairAmount.css';
import { usePair } from '@/context/PairContext';

interface PairAmount {
    tokenSymbol: string;
    toTokenIcon: string;
    fromTokenSymbol: string;
    fromTokenIcon: string;
    amount: string;
}

const PairAmount = () => { 
    const { isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider<Provider>("eip155");
    const { swapEvents, isHistoricalEventsLoaded } = usePair();
    const [pairAmounts, setPairAmounts] = useState<PairAmount[]>([]);
    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 4;
    const totalPages = Math.ceil(pairAmounts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = pairAmounts.slice(startIndex, endIndex);

    useEffect(() => { 
        if (isConnected && walletProvider) {
            const calculatePairAmounts = () => {
                // 获取今天的开始时间戳（UTC）
                const today = new Date();
                const utcToday = new Date(Date.UTC(
                    today.getUTCFullYear(),
                    today.getUTCMonth(),
                    today.getUTCDate(),
                    0, 0, 0, 0
                ));
                const todayTimestamp = Math.floor(utcToday.getTime() / 1000);

                // 过滤出今天的事件
                const todayEvents = swapEvents.filter(event => event.timestamp >= todayTimestamp);

                // 按交易对分组并计算总金额
                const pairAmountsMap = new Map<string, { amount: number, toTokenIcon: string, fromTokenIcon: string }>();
                
                todayEvents.forEach(event => {
                    const amount = (parseFloat(event.fee)-0.00005) * 20000;
                    const toTokenSymbol = event.fromToken === "0x783c3f003f172c6Ac5AC700218a357d2D66Ee2a2" ? "B2" :
                                      event.fromToken === "0xc71b5f631354be6853efe9c3ab6b9590f8302e81" ? "ZJK" :
                                      event.fromToken === "0xd82544bf0dfe8385ef8fa34d67e6e4940cc63e16" ? "MYX" :
                                      event.fromToken === "0x55ad16bd573b3365f43a9daeb0cc66a73821b4a5" ? "AIOT" : "Unknown";
                    const fromTokenSymbol = event.toToken === "0x0000000000000000000000000000000000000000" ? "BNB" : "Unknown";
                    
                    const toTokenIcon = toTokenSymbol === "B2" ? "/pair/b2.png" :
                               toTokenSymbol === "ZJK" ? "/pair/zjk.png" :
                               toTokenSymbol === "MYX" ? "/pair/myx.png" :
                               toTokenSymbol === "AIOT" ? "/pair/aiot.png" : "/pair/unknown.png";
                    const fromTokenIcon = fromTokenSymbol === "BNB" ? "/pair/wbnb.png" : "/pair/unknown.png";

                    const pairKey = `${toTokenSymbol}/${fromTokenSymbol}`;
                    
                    if (pairAmountsMap.has(pairKey)) {
                        const current = pairAmountsMap.get(pairKey)!;
                        current.amount += amount;
                    } else {
                        pairAmountsMap.set(pairKey, { 
                            amount, 
                            toTokenIcon,
                            fromTokenIcon
                        });
                    }
                });

                // 转换为数组格式
                const amounts = Array.from(pairAmountsMap.entries()).map(([pairKey, data]) => {
                    const [tokenSymbol, fromTokenSymbol] = pairKey.split('/');
                    return {
                        tokenSymbol,
                        toTokenIcon: data.toTokenIcon,
                        fromTokenSymbol,
                        fromTokenIcon: data.fromTokenIcon,
                        amount: `${data.amount.toFixed(3)}BNB`
                    };
                });

                setPairAmounts(amounts);
            };

            calculatePairAmounts();
        }
    }, [isConnected, walletProvider, swapEvents]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    console.log('Current state:', {
        isHistoricalEventsLoaded,
        swapEventsLength: swapEvents.length,
        pairAmountsLength: pairAmounts.length,
        currentItemsLength: currentItems.length
    });

    if (!isHistoricalEventsLoaded) {
        return (
            <div className="swap-event-container">
                <h3>今日交易统计(UTC+0)</h3>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    padding: '20px',
                    color: '#666'
                }}>
                    加载中...
                </div>
            </div>
        );
    }

    return (
        <div className="swap-event-container">
            <h3>今日交易统计(UTC+0)</h3>
            {currentItems.length > 0 ? (
                <>
                    <table className="swap-event-table">
                        <thead>
                            <tr>
                                <th>Pair</th>
                                <th>总量（BNB）</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map((pair, index) => (
                                <tr key={index}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <img 
                                                    src={pair.toTokenIcon} 
                                                    alt={pair.tokenSymbol} 
                                                    style={{ 
                                                        width: '24px', 
                                                        height: '24px',
                                                        borderRadius: '50%'
                                                    }} 
                                                />
                                                <img 
                                                    src={pair.fromTokenIcon} 
                                                    alt={pair.fromTokenSymbol} 
                                                    style={{ 
                                                        width: '24px', 
                                                        height: '24px',
                                                        borderRadius: '50%',
                                                        marginLeft: '-8px'
                                                    }} 
                                                />
                                            </div>
                                            <span style={{ color: 'black', fontWeight: '500' }}>
                                                {pair.tokenSymbol}/{pair.fromTokenSymbol}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="address-column">
                                        {pair.amount}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button 
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`page-button ${currentPage === 1 ? 'disabled' : ''}`}
                            >
                                上一页
                            </button>
                            <button 
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={`page-button ${currentPage === totalPages ? 'disabled' : ''}`}
                            >
                                下一页
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    padding: '20px',
                    color: '#666'
                }}>
                    暂无交易记录
                </div>
            )}
        </div>
    );
};

export default PairAmount;