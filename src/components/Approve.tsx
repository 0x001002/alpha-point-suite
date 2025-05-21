'use client'

import styles from './Approve.module.css'
import React, { useState, useEffect } from 'react'
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
import { ethers } from "ethers";
import { usePair } from '@/context/PairContext';

export const Approve = () => {
    const { selectedPair, setLastApproveTimeUpdate, approveToken, setApproveToken } = usePair();
    const { address, isConnected } = useAppKitAccount();
    const { chainId } = useAppKitNetworkCore();
    const { walletProvider } = useAppKitProvider<Provider>("eip155");

    const [selectedTime, setSelectedTime] = useState('60')
    // const [approveTime, setApproveTime] = useState(false)
    // const [txCount, setTxCount] = useState('')
    // const [feeMap, setFeeMap] = useState<bigint>(BigInt(0))
    const AlphaBot = "0xcb4C74125CE9f3240DedAE1bf087208C549B1d39"
    const alphaTokenAddress = (selectedPair?.alphaTokenAddress ?? "0x783c3f003f172c6Ac5AC700218a357d2D66Ee2a2")

    const ERC20_ABI = [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)"
    ];
    const AlphaBot_ABI = [
        "function activeTime(uint256 _activeTimeStamp) external",
        // "function addFee() external payable",
        // "function refundFee() external",
        // "function feeMap(address) view returns (uint256)"
    ];
    const MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

    useEffect(() => {
        const checkAllowance = async () => {
            if (isConnected && walletProvider && address) {
                try {
                    const provider = new BrowserProvider(walletProvider, chainId);
                    const signer = new JsonRpcSigner(provider, address);
                    const alphaToken = new ethers.Contract(alphaTokenAddress, ERC20_ABI, signer);
                    const allowance = await alphaToken.allowance(address, AlphaBot);
                    // const AlphaBotContract = new ethers.Contract(AlphaBot, AlphaBot_ABI, signer);
                    // const fee = await AlphaBotContract.feeMap(address);
                    // setFeeMap(BigInt(fee));
                    // console.log("feeMap:",fee);
                    setApproveToken(allowance >= MAX_UINT256);
                } catch (error) {
                    console.error("Error checking allowance:", error);
                }
            }else{
                console.log("Not connected to a wallet.", isConnected, walletProvider, address);
            }
        };
        checkAllowance();
    }, [isConnected, walletProvider, address, chainId, selectedPair, approveToken]);

    // useEffect(() => {
    //     const updateFeeMap = async () => {
    //         if (isConnected && walletProvider && address) {
    //             try {
    //                 const provider = new BrowserProvider(walletProvider, chainId);
    //                 const signer = new JsonRpcSigner(provider, address);
    //                 const AlphaBotContract = new ethers.Contract(AlphaBot, AlphaBot_ABI, signer);
    //                 const fee = await AlphaBotContract.feeMap(address);
    //                 setFeeMap(BigInt(fee));
    //             } catch (error) {
    //                 console.error("Error updating feeMap:", error);
    //             }
    //         }
    //     };
    //     updateFeeMap();
    // }, [isConnected, walletProvider, address, chainId]);

    // const handleTXCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     const value = e.target.value;
    //     if (value === '' || /^[1-9]\d*$/.test(value)) {
    //         setTxCount(value);
    //     }
    // };

    // const handleDeposit = async () => {
    //     if (isConnected && walletProvider && address && txCount) {
    //         try {
    //             const provider = new BrowserProvider(walletProvider, chainId);
    //             const signer = new JsonRpcSigner(provider, address);
    //             const AlphaBotContract = new ethers.Contract(AlphaBot, AlphaBot_ABI, signer);
    //             const valueInEth = 0.001 * Number(txCount);
    //             const valueInWei = ethers.parseEther(valueInEth.toString());
    //             const tx = await AlphaBotContract.addFee({ value: valueInWei });
    //             console.log(tx.hash);
    //             await tx.wait();
    //             const newFee = BigInt(feeMap) + BigInt(Number(txCount) * 1000000000000000);
    //             setFeeMap(newFee);
    //             console.log("Deposit successful");
    //             setTxCount('');
    //         } catch (error) {
    //             console.error("Error depositing:", error);
    //         }
    //     }
    // };

    // const handleRefund = async () => {
    //     if (isConnected && walletProvider && address) {
    //         try {
    //             console.log(feeMap);
    //             const provider = new BrowserProvider(walletProvider, chainId);
    //             const signer = new JsonRpcSigner(provider, address);
    //             const AlphaBotContract = new ethers.Contract(AlphaBot, AlphaBot_ABI, signer);
    //             const tx = await AlphaBotContract.refundFee();
    //             console.log(tx.hash);
    //             await tx.wait();
    //             setFeeMap(BigInt(0));
    //             console.log("Refund successful");
    //         } catch (error) {
    //             console.error("Error refunding:", error);
    //         }
    //     }
    // };


    const handleApprove = async () => {
        if (isConnected && walletProvider && address ){
            const provider = new BrowserProvider(walletProvider, chainId);
            const signer = new JsonRpcSigner(provider, address);
            if(!approveToken){
                try {
                    const alphaToken = new ethers.Contract(alphaTokenAddress, ERC20_ABI, signer);
                    const tx = await alphaToken.approve(AlphaBot, MAX_UINT256);
                    console.log(tx.hash);
                    await tx.wait();
                    setApproveToken(true);
                    console.log("Infinite approve confirmed.");
                } catch (error) {
                    console.error("Error signing message:", error);
                }
            }else{
                try{
                    const AlphaBotContract = new ethers.Contract(AlphaBot, AlphaBot_ABI, signer);
                    let activeTime;
                    if(selectedTime === 'unlimited'){
                        activeTime = Math.floor(Date.now() / 1000) + 100 * 365 * 24 * 60 * 60; // 100年
                    }else{
                        activeTime = Math.floor(Date.now() / 1000)  + parseInt(selectedTime) * 60;
                    }
                    const tx = await AlphaBotContract.activeTime(activeTime);
                    console.log(tx.hash);
                    await tx.wait();
                    // setApproveTime(true);
                    setLastApproveTimeUpdate(Date.now());
                    console.log("Active time set.");
                } catch (error) {
                    console.error("Error signing message:", error);
                }
            }
        }
    }

    return (
        <div className={styles.container}>
            {/* <div className={styles.actionContainer}>
                <input
                    type="text"
                    value={txCount}
                    onChange={handleTXCountChange}
                    placeholder="输入交易的次数"
                    className={styles.input}
                />
                <button 
                    className={styles.smallButton}
                    onClick={handleDeposit}
                    disabled={!txCount || !isConnected}
                >
                    存款
                </button>
                <button 
                    className={styles.smallButton}
                    onClick={handleRefund}
                    disabled={!isConnected || Number(feeMap) === 0}
                >
                    全部取出
                </button>
            </div> */}
            <div className={styles.selectContainer}>
                <select 
                    className={styles.select}
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                >
                    <option value="0">0 分钟</option>
                    <option value="60">1 小时</option>
                    <option value="1440">1 天</option>
                    <option value="10080">1 周</option>
                    <option value="43200">1 月</option>
                    <option value="525600">1 年</option>
                </select>
                {/* <span className={styles.selectLabel}>设置有效期</span> */}
            </div>
            <button className={styles.button} onClick={handleApprove}>
                {approveToken ? "设置有效期" : `授权 ${selectedPair?.token0Symbol}`}
            </button>
        </div>
    );
}