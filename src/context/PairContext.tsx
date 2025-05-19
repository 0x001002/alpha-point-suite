'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PAIRS } from '@/constants/pairs';

type Pair = (typeof PAIRS)[number];

interface PairContextType {
  selectedPair: Pair | null;
  setSelectedPair: React.Dispatch<React.SetStateAction<Pair | null>>;
  lastApproveTimeUpdate: number;
  setLastApproveTimeUpdate: React.Dispatch<React.SetStateAction<number>>;
}

const PairContext = createContext<PairContextType | undefined>(undefined);

export function PairProvider({ children }: { children: ReactNode }) {
  const [selectedPair, setSelectedPair] = useState<Pair | null>(PAIRS[0]);
  const [lastApproveTimeUpdate, setLastApproveTimeUpdate] = useState<number>(Date.now());

  return (
    <PairContext.Provider value={{ selectedPair, setSelectedPair, lastApproveTimeUpdate, setLastApproveTimeUpdate }}>
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