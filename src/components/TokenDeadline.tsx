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
  JsonRpcSigner,
} from "ethers";
import { ethers } from 'ethers';
import { usePair } from '@/context/PairContext';
import Image from 'next/image';

const TokenDeadline = () => { 
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetworkCore();
  const { walletProvider } = useAppKitProvider<Provider>("eip155");
  const { lastApproveTimeUpdate, selectedPair, approveToken, setApproveToken } = usePair();
  const [activeTimeStamp, setActiveTimeStamp] = React.useState<number | null>(null);
  const [currentTime, setCurrentTime] = React.useState<number>(Date.now());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000); 

    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const checkAllowance = async () => {
      if (!isConnected || !walletProvider || !address || !selectedPair) return;
      
      try {
        const provider = new BrowserProvider(walletProvider, chainId);
        const signer = new JsonRpcSigner(provider, address);
        const AlphaBot = "0xcb4C74125CE9f3240DedAE1bf087208C549B1d39";
        const ERC20_ABI = [
          "function allowance(address owner, address spender) view returns (uint256)"
        ];
        const alphaToken = new ethers.Contract(selectedPair.alphaTokenAddress, ERC20_ABI, signer);
        const MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
        const allowance = await alphaToken.allowance(address, AlphaBot);
        setApproveToken(allowance >= MAX_UINT256);
      } catch (error) {
        console.error("Error checking allowance:", error);
      }
    };

    checkAllowance();
  }, [isConnected, walletProvider, address, chainId, selectedPair, lastApproveTimeUpdate]);

  React.useEffect(() => {
    const fetchActiveTimeStamp = async () => {
      if (!address || !walletProvider || !isConnected) return;
      
      const provider = new BrowserProvider(walletProvider, chainId);
      const AlphaBot = "0xcb4C74125CE9f3240DedAE1bf087208C549B1d39";
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
  }, [isConnected, address, walletProvider, chainId, lastApproveTimeUpdate]);

  const deadlineInfo = [
    { address: address, deadline: activeTimeStamp ? activeTimeStamp : null, status: activeTimeStamp ? (activeTimeStamp * 1000) > currentTime ? '激活中' : '已过期' : null },
  ];

  const handleCancel = async () => {
    if (!isConnected || !walletProvider || !address || !selectedPair) return;
    
    try {
      const provider = new BrowserProvider(walletProvider, chainId);
      const signer = new JsonRpcSigner(provider, address);
      const AlphaBot = "0xcb4C74125CE9f3240DedAE1bf087208C549B1d39";
      const ERC20_ABI = [
        "function approve(address spender, uint256 amount) external returns (bool)"
      ];
      
      const alphaToken = new ethers.Contract(selectedPair.alphaTokenAddress, ERC20_ABI, signer);
      const tx = await alphaToken.approve(AlphaBot, 0);
      await tx.wait();
      setApproveToken(false);
    } catch (error) {
      console.error("Error approving token:", error);
    }
  };

  return (
    <>
      <div className="deadline-table-container">
        <h3>代币授权状态</h3>
        <table className="deadline-table">
          <thead>
            <tr>
              <th>代币</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div className="token-info">
                  <Image
                    src={selectedPair?.token0Icon ?? "/pair/b2.png"}
                    alt={selectedPair?.token0Symbol ?? "B2"}
                    width={24}
                    height={24}
                    className="token-icon"
                  />
                  <span>{selectedPair?.token0Symbol ?? "B2"}</span>
                </div>
              </td>
              <td>
                <span className={`status-indicator ${approveToken ? 'status-active' : 'status-expired'}`}>
                  {approveToken ? '已授权' : '未授权'}
                </span>
              </td>
              <td>
                <button 
                  className={`approve-button ${!approveToken ? 'disabled' : ''}`}
                  onClick={handleCancel}
                  disabled={!approveToken}
                >
                  取消授权
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="deadline-table-container">
        <h3>有效期状态</h3>
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
                <td>
                  <span className={`status-indicator ${info.status ? (info.status === '激活中' ? 'status-active' : 'status-expired') : 'status-expired'}`}>
                    {info.status || '已过期'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default TokenDeadline;
