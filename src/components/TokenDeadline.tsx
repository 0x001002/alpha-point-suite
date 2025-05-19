'use client'

import React from 'react';
import './TokenDeadline.css'
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

const TokenDeadline = () => { 
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetworkCore();
  const { walletProvider } = useAppKitProvider<Provider>("eip155");
  const { lastApproveTimeUpdate } = usePair();
  const [activeTimeStamp, setActiveTimeStamp] = React.useState<number | null>(null);
  const [currentTime, setCurrentTime] = React.useState<number>(Date.now());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000); 

    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const fetchActiveTimeStamp = async () => {
      if (!address || !walletProvider || !isConnected) return;
      
      const provider = new BrowserProvider(walletProvider, chainId);
      const AlphaBot = "0x9D746c9bc734702887eE1Ab636a242BCEaBeb6eE";
      const AlphaBot_ABI = [
        "function activeTimeStampMap(address) view returns (uint256)",
      ];
      const AlphaBotContract = new ethers.Contract(AlphaBot, AlphaBot_ABI, provider);
      
      try {
        const timestamp = await AlphaBotContract.activeTimeStampMap(address);
        setActiveTimeStamp(Number(timestamp));
        console.log('Active timestamp:', timestamp);
      } catch (error) {
        console.error('Error fetching active timestamp:', error);
      }
    };

    fetchActiveTimeStamp();
  }, [address, walletProvider, chainId, lastApproveTimeUpdate]);

  const deadlineInfo = [
    { address: address, deadline: activeTimeStamp ? activeTimeStamp : null, status: activeTimeStamp ? (activeTimeStamp * 1000) > currentTime ? 'Active' : 'Expired' : null },
  ];

    return (
      <div className="deadline-table-container">
        <h3>Token Deadlines</h3>
        <table className="deadline-table">
          <thead>
            <tr>
              <th className="address-column">地址</th>
              <th>有效期</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {deadlineInfo.map((info, index) => (
              <tr key={index}>
                <td className="address-column">{info.address}</td>
                <td>{info.deadline ? new Date(info.deadline * 1000).toLocaleString() : ''}</td>
                <td>{info.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
}

export default TokenDeadline;
