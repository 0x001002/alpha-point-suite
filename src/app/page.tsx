"use client";

import { Header } from "@/components/Header";
import Pair from "@/components/Pair";
import { Approve } from "@/components/Approve";
import TokenDeadline from "@/components/TokenDeadline";
import SwapEvent from "@/components/SwapEvent";
import Introduction from "@/components/Introduction";
import { usePair } from "@/context/PairContext";

export default function Home() {
  const { selectedPair } = usePair();
  return (
    <div className="pages w-full max-w-full px-4 sm:px-6">
      <Header />
      <div style={{ height: "40px" }}></div>
      <h1 className="text-3xl font-bold sm:text-3xl text-2xl text-center sm:text-left">Alpha Point</h1>
      <div className="w-full flex justify-center">
        <div className="max-w-[90%] sm:max-w-full">
          <p className="text-base text-gray-600 text-center sm:text-left mb-2">追踪BSC交易，实现零滑点交易</p>
          <p className="text-base text-gray-600 text-center sm:text-left break-words">使用此工具交易时必须取消勾选MEV保护，滑点可以调低到0.1，目前仅支持PancakeSwap的交易</p>
        </div>
      </div>
      <Introduction /> 
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