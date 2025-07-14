import React from 'react';
import { motion } from 'framer-motion';
import { Database, CheckCircle, Clock, Hash } from 'lucide-react';

const Ledger: React.FC = () => {
  const transactions = [
    { hash: '0xa7f3b2c1d8e9f0a1', status: 'verified', timestamp: '14:32:15', amount: '1.25 ETH' },
    { hash: '0x9e4d8f6a2b5c7e8f', status: 'verified', timestamp: '14:32:14', amount: '0.75 ETH' },
    { hash: '0x5c2b9e7f1a4d6c8b', status: 'pending', timestamp: '14:32:13', amount: '2.10 ETH' },
    { hash: '0x8f1a4d3c9e6b2f5a', status: 'verified', timestamp: '14:32:12', amount: '0.50 ETH' },
    { hash: '0x3e7b5a9d2c8f1e4b', status: 'verified', timestamp: '14:32:11', amount: '1.80 ETH' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="portal-ledger-page"
    >
      <div className="portal-page-header portal-mb-6">
        <h1 className="portal-text-3xl portal-font-bold portal-mb-2">Blockchain Ledger</h1>
        <p className="portal-text-secondary">Monitor blockchain transactions and ledger integrity</p>
      </div>

      <div className="portal-ledger-stats portal-grid portal-grid-cols-1 portal-md:portal-grid-cols-3 portal-gap-6 portal-mb-8">
        <div className="portal-stat-card portal-bg-surface portal-rounded-lg portal-p-6">
          <div className="portal-flex portal-items-center portal-gap-3 portal-mb-2">
            <Database size={24} className="portal-text-accent" />
            <h3 className="portal-text-lg portal-font-semibold">Total Blocks</h3>
          </div>
          <p className="portal-text-3xl portal-font-bold">1,247,892</p>
        </div>
        
        <div className="portal-stat-card portal-bg-surface portal-rounded-lg portal-p-6">
          <div className="portal-flex portal-items-center portal-gap-3 portal-mb-2">
            <CheckCircle size={24} className="portal-text-success" />
            <h3 className="portal-text-lg portal-font-semibold">Verified Transactions</h3>
          </div>
          <p className="portal-text-3xl portal-font-bold">98.7%</p>
        </div>
        
        <div className="portal-stat-card portal-bg-surface portal-rounded-lg portal-p-6">
          <div className="portal-flex portal-items-center portal-gap-3 portal-mb-2">
            <Clock size={24} className="portal-text-warning" />
            <h3 className="portal-text-lg portal-font-semibold">Avg Block Time</h3>
          </div>
          <p className="portal-text-3xl portal-font-bold">2.3s</p>
        </div>
      </div>

      <div className="portal-transactions-section">
        <h2 className="portal-text-2xl portal-font-semibold portal-mb-4">Recent Transactions</h2>
        <div className="portal-transactions-list portal-space-y-3">
          {transactions.map((tx, index) => (
            <motion.div
              key={tx.hash}
              className="portal-transaction-card portal-bg-surface portal-rounded-lg portal-p-4 portal-border"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              <div className="portal-flex portal-items-center portal-justify-between">
                <div className="portal-flex portal-items-center portal-gap-3">
                  <Hash size={16} className="portal-text-secondary" />
                  <code className="portal-text-sm portal-font-mono">{tx.hash}</code>
                </div>
                <div className="portal-flex portal-items-center portal-gap-4">
                  <span className="portal-font-semibold">{tx.amount}</span>
                  <span className="portal-text-sm portal-text-secondary">{tx.timestamp}</span>
                  <div className={`portal-status-indicator ${tx.status === 'verified' ? 'portal-text-success' : 'portal-text-warning'}`}>
                    {tx.status === 'verified' ? <CheckCircle size={16} /> : <Clock size={16} />}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Ledger;
