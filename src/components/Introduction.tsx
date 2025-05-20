import React, { useState } from 'react';
import './Introduction.css';

const Introduction: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="introduction-container">
      <button
        onClick={toggleDropdown}
        className="introduction-button"
      >
        <span>使用说明</span>
        <span className={`arrow-icon ${isOpen ? 'open' : ''}`}>
          ▼
        </span>
      </button>
      
      {isOpen && (
        <div className="content-container">
          <div className="section">
            <h3>收费说明</h3>
            <p>本工具每笔交易仅收取两万分之一的交易手续费和0.00005bnb(0.02u)，此收费是为了收回节点/服务器成本</p>
            <p>额外收费为捆绑小费 + 交易Gas费用 (合计约为 0.02U) ，此费用为链上交互费用，不可避免</p>
          </div>
          <div className="section">
            <h3>使用步骤</h3>
            <ol>
              <li>授权代币</li>
              <li>设置有效期</li>
              <li>使用币安钱包交易</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default Introduction;
