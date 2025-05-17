"use client";

import { Header } from "@/components/Header";
import Pair from "@/components/Pair";
import { Approve } from "@/components/Approve";
import TokenDeadline from "@/components/TokenDeadline";
import { usePair } from "@/context/PairContext";

export default function Home() {
  const { selectedPair } = usePair();
  return (
    <div className="pages">
      <Header />
      <div style={{ height: "40px" }}></div>
      <h1 className="text-3xl font-bold">Alpha Point Suite</h1>
      <p className="text-lg text-gray-600">Track BSC Swaps for Zero Slippage Execution</p>
      <div>
        <Pair
          token0Symbol={selectedPair?.token0Symbol ?? "B2"}
          token1Symbol={selectedPair?.token1Symbol ?? "USDT"}
          token0Icon={selectedPair?.token0Icon ?? "/pair/b2.png"}
          token1Icon={selectedPair?.token1Icon ?? "/pair/usdt.png"}
          fee={selectedPair?.fee ?? "0.01"}
          tvl={selectedPair?.tvl ?? "$212.16K"}
        ></Pair>
      </div>
      <Approve />
      <TokenDeadline />
    </div>
  );
}