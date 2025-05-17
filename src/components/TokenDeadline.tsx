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
const TokenDeadline = () => { 
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetworkCore();
  const { walletProvider } = useAppKitProvider<Provider>("eip155");
  const [activeTimeStamp, setActiveTimeStamp] = React.useState<number | null>(null);

  React.useEffect(() => {
    const fetchActiveTimeStamp = async () => {
      if (!address || !walletProvider || !isConnected) return;
      
      const provider = new BrowserProvider(walletProvider, chainId);
      const AlphaBot = "0xEB4386a28aE5797eecF8eB6d29c4873E0405BB62";
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
  }, [address, walletProvider, chainId]);

  const deadlineInfo = [
    { address: address, deadline: activeTimeStamp ? activeTimeStamp : null, status: activeTimeStamp ? (activeTimeStamp * 1000) > Date.now() ? 'Active' : 'Expired' : null },
  ];

    return (
      <div className="deadline-table-container">
        <h3>Token Deadlines</h3>
        <table className="deadline-table">
          <thead>
            <tr>
              <th>Address</th>
              <th>Deadline</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {deadlineInfo.map((info, index) => (
              <tr key={index}>
                <td>{info.address}</td>
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
