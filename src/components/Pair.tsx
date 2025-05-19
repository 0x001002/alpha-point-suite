"use client";

import Image from 'next/image';
import { useState } from 'react';
import styles from './Pair.module.css';
import Modal from './Modal';
import { usePair } from '@/context/PairContext';
import { PAIRS } from '@/constants/pairs';

type Pair = (typeof PAIRS)[number];

interface PairProps {
  token0Symbol: Pair['token0Symbol'];
  token1Symbol: Pair['token1Symbol'];
  token0Icon: Pair['token0Icon'];
  token1Icon: Pair['token1Icon'];
  fee: Pair['fee'];
  tvl: Pair['tvl'];
}

export default function Pair(props: PairProps) {
  const [showModal, setShowModal] = useState(false);
  const { selectedPair, setSelectedPair } = usePair();

  const isSelected = selectedPair?.token0Symbol === props.token0Symbol && 
                    selectedPair?.token1Symbol === props.token1Symbol;

  const handleClick = () => {
    //todo: setShowModal(true);
  };

  return (
    <div className="relative w-full">
      <div 
        className={`flex items-center justify-between ${styles.pairContainer} ${isSelected ? styles.selected : ''}`}
        onClick={handleClick}
      >
        <div className={styles.tableRow}>
          <div className={styles.tableCell}>
            <span className={styles.tableLabel}>Pair</span>
            <div className={styles.tokenIcons}>
              <Image
                src={props.token0Icon}
                alt={props.token0Symbol}
                width={24}
                height={24}
                className={`rounded-full ${styles.tokenIcon}`}
              />
              <Image
                src={props.token1Icon}
                alt={props.token1Symbol}
                width={24}
                height={24}
                className={`rounded-full ${styles.tokenIcon}`}
              />
            </div>
          </div>
          
          <div className={styles.rightGroup}>
            <div className={styles.tableCell}>
              <span className={styles.tableLabel}>Fee</span>
              <span className={styles.tableValue}>{props.fee}%</span>
            </div>
            
            <div className={styles.tableCell}>
              <span className={styles.tableLabel}>TVL</span>
              <span className={styles.tableValue}>{props.tvl}</span>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`All Pairs`}
      >
        <div className={styles.modalContent}>
          {PAIRS.map((pair, index) => (
            <div 
              key={index} 
              className={`${styles.modalRow} cursor-pointer hover:bg-gray-100`}
              onClick={() => {
                setSelectedPair(pair);
                setShowModal(false);
              }}
            >
              <div className={styles.modalRow}> 
                <div className={styles.modalRowItem}>
                  <div className={styles.tokenIcons}>
                    <Image
                      src={pair.token0Icon}
                      alt={pair.token0Symbol}
                      width={32}
                      height={32}
                      className={`rounded-full ${styles.tokenIcon}`}
                    />
                    <Image
                      src={pair.token1Icon}
                      alt={pair.token1Symbol}
                      width={32}
                      height={32}
                      className={`rounded-full ${styles.tokenIcon}`}
                    />
                  </div>
                </div>
                <div className={styles.modalRowItem}>Fee Tier: {pair.fee}%</div>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
