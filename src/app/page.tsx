"use client";

import { Header } from "@/components/Header";
import Pair from "@/components/Pair";
import { Approve } from "@/components/Approve";
import TokenDeadline from "@/components/TokenDeadline";
import SwapEvent from "@/components/SwapEvent";
import { usePair } from "@/context/PairContext";

export default function Home() {
  const { selectedPair } = usePair();
  return (
    <div className="pages">
      <Header />
      <div style={{ height: "40px" }}></div>
      <h1 className="text-3xl font-bold sm:text-3xl text-2xl text-center sm:text-left">Alpha Point</h1>
      <div className="sm:block">
        <p className="text-lg text-gray-600 sm:text-lg text-base text-center sm:text-left">追踪BSC交易，实现零滑点交易</p>
        <p className="text-lg text-gray-600 sm:text-lg text-base text-center sm:text-left">使用此工具交易时必须取消勾选MEV保护，滑点可以调低(0.1)</p>
      </div>
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
      <SwapEvent />
    </div>
  );
}