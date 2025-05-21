'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PAIRS } from '@/constants/pairs';

type Pair = (typeof PAIRS)[number];

interface PairContextType {
  selectedPair: Pair | null;
  setSelectedPair: React.Dispatch<React.SetStateAction<Pair | null>>;
  lastApproveTimeUpdate: number;
  setLastApproveTimeUpdate: React.Dispatch<React.SetStateAction<number>>;
  approveToken: boolean;
  setApproveToken: React.Dispatch<React.SetStateAction<boolean>>;
  swapEvents: SwapEvent[];
  setSwapEvents: React.Dispatch<React.SetStateAction<SwapEvent[]>>;
  isHistoricalEventsLoaded: boolean;
  setIsHistoricalEventsLoaded: React.Dispatch<React.SetStateAction<boolean>>;
}

interface SwapEvent {
  address: string;
  fromToken: string;
  toToken: string;
  fee: string;
  timestamp: number;
  transactionHash: string;
}

const PairContext = createContext<PairContextType | undefined>(undefined);

export function PairProvider({ children }: { children: ReactNode }) {
  const [selectedPair, setSelectedPair] = useState<Pair | null>(PAIRS[0]);
  const [lastApproveTimeUpdate, setLastApproveTimeUpdate] = useState<number>(Date.now());
  const [approveToken, setApproveToken] = useState<boolean>(false);
  const [swapEvents, setSwapEvents] = useState<SwapEvent[]>([]);
  const [isHistoricalEventsLoaded, setIsHistoricalEventsLoaded] = useState<boolean>(false);

  return (
    <PairContext.Provider value={{ 
      selectedPair, 
      setSelectedPair, 
      lastApproveTimeUpdate, 
      setLastApproveTimeUpdate,
      approveToken,
      setApproveToken,
      swapEvents,
      setSwapEvents,
      isHistoricalEventsLoaded,
      setIsHistoricalEventsLoaded
    }}>
      {children}
    </PairContext.Provider>
  );
}

export function usePair() {
  const context = useContext(PairContext);
  if (context === undefined) {
    throw new Error('usePair must be used within a PairProvider');
  }
  return context;
} 