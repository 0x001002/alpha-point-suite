'use client'

import styles from './Approve.module.css'
import { useState, useEffect } from 'react'
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
    const { selectedPair } = usePair();
    const { address, isConnected } = useAppKitAccount();
    const { chainId } = useAppKitNetworkCore();
    const { walletProvider } = useAppKitProvider<Provider>("eip155");

    const [selectedTime, setSelectedTime] = useState('10')
    const [approveToken, setApproveToken] = useState(false)
    
    const AlphaBot = "0x9D435328Ca00195557a97884CBE94EBF3Aa007E7"
    const alphaTokenAddress = (selectedPair?.alphaTokenAddress ?? "0x783c3f003f172c6Ac5AC700218a357d2D66Ee2a2")

    const ERC20_ABI = [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)"
    ];
    const AlphaBot_ABI = [
        "function activeTime(uint256 _activeTimeStamp) external",
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
                    setApproveToken(allowance >= MAX_UINT256);
                } catch (error) {
                    console.error("Error checking allowance:", error);
                }
            }else{
                console.log("Not connected to a wallet.", isConnected, walletProvider, address);
            }
        };

        checkAllowance();
    }, [isConnected, walletProvider, address, chainId, selectedPair]);

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
                    window.location.reload();
                } catch (error) {
                    console.error("Error signing message:", error);
                }
            }else{
                try{
                    const AlphaBotContract = new ethers.Contract(AlphaBot, AlphaBot_ABI, signer);
                    const tx = await AlphaBotContract.activeTime(Math.floor(Date.now() / 1000)  + parseInt(selectedTime) * 60);
                    console.log(tx.hash);
                    await tx.wait();
                    console.log("Active time set.");
                    window.location.reload();
                } catch (error) {
                    console.error("Error signing message:", error);
                }
            }
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.selectContainer}>
                <select 
                    className={styles.select}
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                >
                    {[10, 20, 30, 40, 50, 60].map((minutes) => (
                        <option key={minutes} value={minutes}>
                            {minutes} mins
                        </option>
                    ))}
                </select>
                <span className={styles.selectLabel}>Set Active Time</span>
            </div>
            <button className={styles.button} onClick={handleApprove}>
                {approveToken ? "Set Active Time" : `Approve ${selectedPair?.token0Symbol} Token`}
            </button>
        </div>
    );
}