import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Lock,
  Shield,
  Activity,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Clock,
  Settings,
  RefreshCw,
  Play,
  Pause,
  Download,
  Upload,
  Eye,
  Hash,
  Link,
  Server,
  Cpu,
  HardDrive,
  Network,
  Zap,
  Users,
  FileText,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  X
} from 'lucide-react';

interface BlockchainMetrics {
  totalBlocks: number;
  totalTransactions: number;
  blockHeight: number;
  networkHashRate: string;
  difficulty: number;
  averageBlockTime: number;
  pendingTransactions: number;
  activeNodes: number;
  consensusHealth: number;
}

interface Transaction {
  id: string;
  hash: string;
  blockNumber: number;
  timestamp: string;
  from: string;
  to: string;
  value: string;
  gasUsed: number;
  gasPrice: string;
  status: 'confirmed' | 'pending' | 'failed';
  type: 'transfer' | 'contract' | 'smart_contract';
  fee: string;
}

interface SmartContract {
  id: string;
  address: string;
  name: string;
  type: string;
  deployedAt: string;
  version: string;
  status: 'active' | 'paused' | 'deprecated';
  transactionCount: number;
  gasUsed: number;
  creator: string;
  verified: boolean;
}

interface Node {
  id: string;
  address: string;
  type: 'validator' | 'full' | 'light';
  status: 'online' | 'offline' | 'syncing';
  version: string;
  uptime: number;
  blockHeight: number;
  peers: number;
  location: string;
  stake?: number;
}

interface SecurityEvent {
  id: string;
  timestamp: string;
  type: 'consensus_failure' | 'double_spend' | 'invalid_block' | 'node_compromise' | 'smart_contract_exploit';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedNodes: string[];
  status: 'active' | 'investigating' | 'resolved';
  mitigationSteps: string[];
}

const SHEL: React.FC = () => {
  const [metrics, setMetrics] = useState<BlockchainMetrics>({
    totalBlocks: 2847392,
    totalTransactions: 15847293,
    blockHeight: 2847392,
    networkHashRate: '245.7 TH/s',
    difficulty: 28472839,
    averageBlockTime: 2.3,
    pendingTransactions: 1247,
    activeNodes: 156,
    consensusHealth: 98.7
  });

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      hash: '0xa7f3b2c1d8e9f0a1b2c3d4e5f6789012345678901234567890abcdef123456789',
      blockNumber: 2847392,
      timestamp: '2024-01-15T14:32:15Z',
      from: '0x742d35Cc6634C0532925a3b8D4e4F7c8E6F8b9c0',
      to: '0x8ba1f109551bD432803012645Hac136c9c1e9a8b',
      value: '1.25 ETH',
      gasUsed: 21000,
      gasPrice: '20 Gwei',
      status: 'confirmed',
      type: 'transfer',
      fee: '0.00042 ETH'
    },
    {
      id: '2',
      hash: '0xb8e4c3d2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4',
      blockNumber: 2847391,
      timestamp: '2024-01-15T14:31:42Z',
      from: '0x123456789abcdef0123456789abcdef0123456789',
      to: '0x987654321fedcba0987654321fedcba0987654321',
      value: '0.75 ETH',
      gasUsed: 45000,
      gasPrice: '22 Gwei',
      status: 'confirmed',
      type: 'contract',
      fee: '0.00099 ETH'
    },
    {
      id: '3',
      hash: '0xc9f5d4e3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5',
      blockNumber: 2847390,
      timestamp: '2024-01-15T14:30:18Z',
      from: '0xabcdef0123456789abcdef0123456789abcdef01',
      to: '0xfedcba9876543210fedcba9876543210fedcba98',
      value: '2.10 ETH',
      gasUsed: 65000,
      gasPrice: '18 Gwei',
      status: 'pending',
      type: 'smart_contract',
      fee: '0.00117 ETH'
    }
  ]);

  const [smartContracts, setSmartContracts] = useState<SmartContract[]>([
    {
      id: '1',
      address: '0x1234567890abcdef1234567890abcdef12345678',
      name: 'SecurityToken',
      type: 'ERC-20',
      deployedAt: '2024-01-10T10:30:00Z',
      version: '1.2.0',
      status: 'active',
      transactionCount: 15847,
      gasUsed: 2847392,
      creator: '0x742d35Cc6634C0532925a3b8D4e4F7c8E6F8b9c0',
      verified: true
    },
    {
      id: '2',
      address: '0x9876543210fedcba9876543210fedcba98765432',
      name: 'AccessControl',
      type: 'Custom',
      deployedAt: '2024-01-08T15:45:00Z',
      version: '2.1.0',
      status: 'active',
      transactionCount: 8923,
      gasUsed: 1847293,
      creator: '0x8ba1f109551bD432803012645Hac136c9c1e9a8b',
      verified: true
    },
    {
      id: '3',
      address: '0xabcdef1234567890abcdef1234567890abcdef12',
      name: 'MultiSigWallet',
      type: 'Wallet',
      deployedAt: '2024-01-05T09:15:00Z',
      version: '1.0.0',
      status: 'paused',
      transactionCount: 3421,
      gasUsed: 847293,
      creator: '0x123456789abcdef0123456789abcdef0123456789',
      verified: false
    }
  ]);

  const [nodes, setNodes] = useState<Node[]>([
    {
      id: '1',
      address: '192.168.1.100:8545',
      type: 'validator',
      status: 'online',
      version: '1.10.26',
      uptime: 99.8,
      blockHeight: 2847392,
      peers: 45,
      location: 'US-East',
      stake: 32000
    },
    {
      id: '2',
      address: '192.168.1.101:8545',
      type: 'full',
      status: 'online',
      version: '1.10.26',
      uptime: 98.5,
      blockHeight: 2847391,
      peers: 38,
      location: 'EU-West'
    },
    {
      id: '3',
      address: '192.168.1.102:8545',
      type: 'validator',
      status: 'syncing',
      version: '1.10.25',
      uptime: 97.2,
      blockHeight: 2847380,
      peers: 42,
      location: 'Asia-Pacific',
      stake: 32000
    }
  ]);

  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([
    {
      id: '1',
      timestamp: '2024-01-15T14:25:00Z',
      type: 'consensus_failure',
      severity: 'high',
      description: 'Temporary consensus failure detected between validator nodes',
      affectedNodes: ['192.168.1.100:8545', '192.168.1.102:8545'],
      status: 'resolved',
      mitigationSteps: ['Node restart', 'Consensus re-sync', 'Network stability check']
    },
    {
      id: '2',
      timestamp: '2024-01-15T13:45:00Z',
      type: 'invalid_block',
      severity: 'medium',
      description: 'Invalid block proposal rejected by network',
      affectedNodes: ['192.168.1.103:8545'],
      status: 'investigating',
      mitigationSteps: ['Block validation review', 'Node audit']
    }
  ]);

  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'contracts' | 'nodes' | 'security'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedContract, setSelectedContract] = useState<SmartContract | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        // Simulate real-time updates
        setMetrics(prev => ({
          ...prev,
          totalTransactions: prev.totalTransactions + Math.floor(Math.random() * 10),
          pendingTransactions: Math.max(0, prev.pendingTransactions + Math.floor(Math.random() * 20) - 10),
          consensusHealth: Math.min(100, Math.max(95, prev.consensusHealth + (Math.random() - 0.5) * 2))
        }));
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const refreshData = () => {
    // Simulate data refresh
    console.log('Refreshing SHEL data...');
  };

  const exportData = () => {
    const data = {
      metrics,
      transactions: transactions.slice(0, 100),
      smartContracts,
      nodes,
      securityEvents,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shel-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="portal-shel-dashboard portal-space-y-6"
    >
      {/* Header */}
      <div className="portal-flex portal-justify-between portal-items-center">
        <div>
          <h1 className="portal-text-3xl portal-font-bold portal-flex portal-items-center portal-gap-3">
            <Database className="portal-text-accent" size={32} />
            Secure Hyperledger (SHEL)
          </h1>
          <p className="portal-text-secondary portal-mt-2">
            Blockchain infrastructure monitoring, transaction analysis, and smart contract security
          </p>
        </div>
        
        <div className="portal-flex portal-items-center portal-gap-4">
          <div className="portal-flex portal-items-center portal-gap-2">
            <div className="portal-w-3 portal-h-3 portal-rounded-full portal-bg-success portal-animate-pulse"></div>
            <span className="portal-text-sm portal-text-secondary">
              {nodes.filter(n => n.status === 'online').length} nodes online
            </span>
          </div>
          
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`portal-btn portal-btn-sm ${autoRefresh ? 'portal-btn-primary' : 'portal-btn-secondary'}`}
          >
            {autoRefresh ? <Pause size={16} /> : <Play size={16} />}
            {autoRefresh ? 'Live' : 'Paused'}
          </button>
          
          <button
            onClick={refreshData}
            className="portal-btn portal-btn-secondary portal-btn-sm"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          
          <button
            onClick={exportData}
            className="portal-btn portal-btn-secondary portal-btn-sm"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Blockchain Metrics */}
      <div className="portal-grid portal-grid-cols-1 portal-md:portal-grid-cols-2 portal-lg:portal-grid-cols-4 portal-gap-6">
        <motion.div
          className="portal-bg-surface portal-rounded-xl portal-p-6 portal-border portal-border-accent/20"
          whileHover={{ scale: 1.02 }}
        >
          <div className="portal-flex portal-items-center portal-justify-between portal-mb-4">
            <div className="portal-p-3 portal-bg-accent/10 portal-rounded-lg">
              <Database className="portal-text-accent" size={24} />
            </div>
            <span className="portal-text-2xl portal-font-bold portal-text-accent">
              {metrics.totalBlocks.toLocaleString()}
            </span>
          </div>
          <h3 className="portal-font-semibold portal-mb-2">Total Blocks</h3>
          <p className="portal-text-sm portal-text-secondary">Current block height: {metrics.blockHeight.toLocaleString()}</p>
        </motion.div>

        <motion.div
          className="portal-bg-surface portal-rounded-xl portal-p-6 portal-border portal-border-success/20"
          whileHover={{ scale: 1.02 }}
        >
          <div className="portal-flex portal-items-center portal-justify-between portal-mb-4">
            <div className="portal-p-3 portal-bg-success/10 portal-rounded-lg">
              <Activity className="portal-text-success" size={24} />
            </div>
            <span className="portal-text-2xl portal-font-bold portal-text-success">
              {metrics.totalTransactions.toLocaleString()}
            </span>
          </div>
          <h3 className="portal-font-semibold portal-mb-2">Total Transactions</h3>
          <p className="portal-text-sm portal-text-secondary">{metrics.pendingTransactions} pending</p>
        </motion.div>

        <motion.div
          className="portal-bg-surface portal-rounded-xl portal-p-6 portal-border portal-border-info/20"
          whileHover={{ scale: 1.02 }}
        >
          <div className="portal-flex portal-items-center portal-justify-between portal-mb-4">
            <div className="portal-p-3 portal-bg-info/10 portal-rounded-lg">
              <Server className="portal-text-info" size={24} />
            </div>
            <span className="portal-text-2xl portal-font-bold portal-text-info">
              {metrics.activeNodes}
            </span>
          </div>
          <h3 className="portal-font-semibold portal-mb-2">Active Nodes</h3>
          <p className="portal-text-sm portal-text-secondary">Network hash rate: {metrics.networkHashRate}</p>
        </motion.div>

        <motion.div
          className="portal-bg-surface portal-rounded-xl portal-p-6 portal-border portal-border-warning/20"
          whileHover={{ scale: 1.02 }}
        >
          <div className="portal-flex portal-items-center portal-justify-between portal-mb-4">
            <div className="portal-p-3 portal-bg-warning/10 portal-rounded-lg">
              <Shield className="portal-text-warning" size={24} />
            </div>
            <span className="portal-text-2xl portal-font-bold portal-text-warning">
              {metrics.consensusHealth}%
            </span>
          </div>
          <h3 className="portal-font-semibold portal-mb-2">Consensus Health</h3>
          <p className="portal-text-sm portal-text-secondary">Avg block time: {metrics.averageBlockTime}s</p>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <div className="portal-border-b portal-border-secondary">
        <nav className="portal-flex portal-space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'transactions', label: 'Transactions', icon: Hash },
            { id: 'contracts', label: 'Smart Contracts', icon: FileText },
            { id: 'nodes', label: 'Network Nodes', icon: Server },
            { id: 'security', label: 'Security Events', icon: Shield }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`portal-flex portal-items-center portal-gap-2 portal-py-4 portal-px-1 portal-border-b-2 portal-font-medium portal-text-sm ${
                activeTab === tab.id
                  ? 'portal-border-accent portal-text-accent'
                  : 'portal-border-transparent portal-text-secondary hover:portal-text-primary'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="portal-space-y-6">
              {/* Network Overview */}
              <div className="portal-grid portal-grid-cols-1 portal-lg:portal-grid-cols-2 portal-gap-6">
                <div className="portal-bg-surface portal-rounded-xl portal-p-6">
                  <h3 className="portal-text-xl portal-font-semibold portal-mb-6">Network Performance</h3>
                  <div className="portal-space-y-4">
                    <div className="portal-flex portal-justify-between portal-items-center">
                      <span className="portal-text-sm portal-font-medium">Block Production Rate</span>
                      <span className="portal-text-sm portal-font-bold">{metrics.averageBlockTime}s avg</span>
                    </div>
                    <div className="portal-w-full portal-bg-secondary/20 portal-rounded-full portal-h-2">
                      <div className="portal-bg-success portal-h-2 portal-rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    
                    <div className="portal-flex portal-justify-between portal-items-center">
                      <span className="portal-text-sm portal-font-medium">Network Hash Rate</span>
                      <span className="portal-text-sm portal-font-bold">{metrics.networkHashRate}</span>
                    </div>
                    <div className="portal-w-full portal-bg-secondary/20 portal-rounded-full portal-h-2">
                      <div className="portal-bg-accent portal-h-2 portal-rounded-full" style={{ width: '92%' }}></div>
                    </div>
                    
                    <div className="portal-flex portal-justify-between portal-items-center">
                      <span className="portal-text-sm portal-font-medium">Consensus Participation</span>
                      <span className="portal-text-sm portal-font-bold">{metrics.consensusHealth}%</span>
                    </div>
                    <div className="portal-w-full portal-bg-secondary/20 portal-rounded-full portal-h-2">
                      <div className="portal-bg-warning portal-h-2 portal-rounded-full" style={{ width: `${metrics.consensusHealth}%` }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="portal-bg-surface portal-rounded-xl portal-p-6">
                  <h3 className="portal-text-xl portal-font-semibold portal-mb-6">Recent Activity</h3>
                  <div className="portal-space-y-4">
                    {transactions.slice(0, 5).map(tx => (
                      <div key={tx.id} className="portal-flex portal-items-center portal-justify-between portal-p-3 portal-bg-secondary/10 portal-rounded">
                        <div className="portal-flex portal-items-center portal-gap-3">
                          <div className={`portal-w-2 portal-h-2 portal-rounded-full ${
                            tx.status === 'confirmed' ? 'portal-bg-success' :
                            tx.status === 'pending' ? 'portal-bg-warning' :
                            'portal-bg-error'
                          }`}></div>
                          <div>
                            <div className="portal-text-sm portal-font-medium">Block #{tx.blockNumber}</div>
                            <div className="portal-text-xs portal-text-secondary">{tx.type}</div>
                          </div>
                        </div>
                        <div className="portal-text-right">
                          <div className="portal-text-sm portal-font-bold">{tx.value}</div>
                          <div className="portal-text-xs portal-text-secondary">
                            {new Date(tx.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Smart Contract Activity */}
              <div className="portal-bg-surface portal-rounded-xl portal-p-6">
                <h3 className="portal-text-xl portal-font-semibold portal-mb-6">Smart Contract Activity</h3>
                <div className="portal-grid portal-grid-cols-1 portal-md:portal-grid-cols-3 portal-gap-6">
                  {smartContracts.slice(0, 3).map(contract => (
                    <div key={contract.id} className="portal-border portal-rounded-lg portal-p-4">
                      <div className="portal-flex portal-items-center portal-justify-between portal-mb-3">
                        <h4 className="portal-font-semibold">{contract.name}</h4>
                        <span className={`portal-px-2 portal-py-1 portal-rounded portal-text-xs ${
                          contract.status === 'active' ? 'portal-bg-success/20 portal-text-success' :
                          contract.status === 'paused' ? 'portal-bg-warning/20 portal-text-warning' :
                          'portal-bg-error/20 portal-text-error'
                        }`}>
                          {contract.status}
                        </span>
                      </div>
                      <div className="portal-space-y-2 portal-text-sm">
                        <div className="portal-flex portal-justify-between">
                          <span className="portal-text-secondary">Type:</span>
                          <span>{contract.type}</span>
                        </div>
                        <div className="portal-flex portal-justify-between">
                          <span className="portal-text-secondary">Transactions:</span>
                          <span>{contract.transactionCount.toLocaleString()}</span>
                        </div>
                        <div className="portal-flex portal-justify-between">
                          <span className="portal-text-secondary">Verified:</span>
                          <span className={contract.verified ? 'portal-text-success' : 'portal-text-warning'}>
                            {contract.verified ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="portal-space-y-6">
              {/* Transaction Filters */}
              <div className="portal-bg-surface portal-rounded-xl portal-p-6">
                <div className="portal-flex portal-justify-between portal-items-center portal-mb-6">
                  <h3 className="portal-text-xl portal-font-semibold">Transaction History</h3>
                  <div className="portal-flex portal-gap-4">
                    <div className="portal-relative">
                      <Search className="portal-absolute portal-left-3 portal-top-1/2 portal-transform portal--translate-y-1/2 portal-text-secondary" size={16} />
                      <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="portal-pl-10 portal-pr-4 portal-py-2 portal-border portal-rounded portal-bg-surface"
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="portal-px-3 portal-py-2 portal-border portal-rounded portal-bg-surface"
                    >
                      <option value="all">All Status</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>
                
                <div className="portal-space-y-3">
                  {transactions
                    .filter(tx => 
                      (filterStatus === 'all' || tx.status === filterStatus) &&
                      (searchQuery === '' || 
                       tx.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       tx.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       tx.to.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map(tx => (
                      <motion.div
                        key={tx.id}
                        className="portal-border portal-rounded-lg portal-p-4 hover:portal-bg-secondary/10 portal-cursor-pointer"
                        onClick={() => setSelectedTransaction(tx)}
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="portal-flex portal-items-center portal-justify-between portal-mb-3">
                          <div className="portal-flex portal-items-center portal-gap-3">
                            <div className={`portal-p-2 portal-rounded ${
                              tx.status === 'confirmed' ? 'portal-bg-success/20 portal-text-success' :
                              tx.status === 'pending' ? 'portal-bg-warning/20 portal-text-warning' :
                              'portal-bg-error/20 portal-text-error'
                            }`}>
                              <Hash size={16} />
                            </div>
                            <div>
                              <div className="portal-font-medium">Block #{tx.blockNumber}</div>
                              <div className="portal-text-sm portal-text-secondary">{tx.type}</div>
                            </div>
                          </div>
                          <div className="portal-text-right">
                            <div className="portal-font-bold">{tx.value}</div>
                            <div className="portal-text-sm portal-text-secondary">Fee: {tx.fee}</div>
                          </div>
                        </div>
                        
                        <div className="portal-grid portal-grid-cols-2 portal-gap-4 portal-text-sm">
                          <div>
                            <span className="portal-text-secondary">From: </span>
                            <code className="portal-text-xs">{tx.from.slice(0, 10)}...{tx.from.slice(-8)}</code>
                          </div>
                          <div>
                            <span className="portal-text-secondary">To: </span>
                            <code className="portal-text-xs">{tx.to.slice(0, 10)}...{tx.to.slice(-8)}</code>
                          </div>
                        </div>
                        
                        <div className="portal-flex portal-justify-between portal-items-center portal-mt-3 portal-text-xs portal-text-secondary">
                          <span>Hash: {tx.hash.slice(0, 16)}...{tx.hash.slice(-16)}</span>
                          <span>{new Date(tx.timestamp).toLocaleString()}</span>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contracts' && (
            <div className="portal-space-y-6">
              {/* Smart Contracts */}
              <div className="portal-bg-surface portal-rounded-xl portal-p-6">
                <div className="portal-flex portal-justify-between portal-items-center portal-mb-6">
                  <h3 className="portal-text-xl portal-font-semibold">Smart Contracts</h3>
                  <button className="portal-btn portal-btn-primary">
                    <Plus size={16} />
                    Deploy Contract
                  </button>
                </div>
                
                <div className="portal-space-y-4">
                  {smartContracts.map(contract => (
                    <motion.div
                      key={contract.id}
                      className="portal-border portal-rounded-lg portal-p-4 hover:portal-bg-secondary/10 portal-cursor-pointer"
                      onClick={() => setSelectedContract(contract)}
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="portal-flex portal-items-center portal-justify-between portal-mb-4">
                        <div className="portal-flex portal-items-center portal-gap-3">
                          <div className="portal-p-3 portal-bg-accent/10 portal-rounded-lg">
                            <FileText className="portal-text-accent" size={20} />
                          </div>
                          <div>
                            <h4 className="portal-font-semibold portal-text-lg">{contract.name}</h4>
                            <p className="portal-text-sm portal-text-secondary">{contract.type} • Version {contract.version}</p>
                          </div>
                        </div>
                        
                        <div className="portal-flex portal-items-center portal-gap-4">
                          <span className={`portal-px-3 portal-py-1 portal-rounded portal-text-sm ${
                            contract.status === 'active' ? 'portal-bg-success/20 portal-text-success' :
                            contract.status === 'paused' ? 'portal-bg-warning/20 portal-text-warning' :
                            'portal-bg-error/20 portal-text-error'
                          }`}>
                            {contract.status}
                          </span>
                          
                          {contract.verified && (
                            <div className="portal-flex portal-items-center portal-gap-1 portal-text-success">
                              <CheckCircle size={16} />
                              <span className="portal-text-sm">Verified</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="portal-grid portal-grid-cols-2 portal-md:portal-grid-cols-4 portal-gap-4 portal-text-sm">
                        <div>
                          <span className="portal-text-secondary">Address:</span>
                          <div className="portal-font-mono portal-text-xs portal-mt-1">
                            {contract.address.slice(0, 10)}...{contract.address.slice(-8)}
                          </div>
                        </div>
                        <div>
                          <span className="portal-text-secondary">Transactions:</span>
                          <div className="portal-font-bold portal-mt-1">{contract.transactionCount.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="portal-text-secondary">Gas Used:</span>
                          <div className="portal-font-bold portal-mt-1">{contract.gasUsed.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="portal-text-secondary">Deployed:</span>
                          <div className="portal-mt-1">{new Date(contract.deployedAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      
                      <div className="portal-flex portal-gap-2 portal-mt-4">
                        <button className="portal-btn portal-btn-sm portal-btn-secondary">
                          <Eye size={14} />
                          View Details
                        </button>
                        <button className="portal-btn portal-btn-sm portal-btn-secondary">
                          <Edit size={14} />
                          Interact
                        </button>
                        <button className="portal-btn portal-btn-sm portal-btn-secondary">
                          <Copy size={14} />
                          Copy Address
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'nodes' && (
            <div className="portal-space-y-6">
              {/* Network Nodes */}
              <div className="portal-bg-surface portal-rounded-xl portal-p-6">
                <h3 className="portal-text-xl portal-font-semibold portal-mb-6">Network Nodes</h3>
                
                <div className="portal-grid portal-grid-cols-1 portal-md:portal-grid-cols-2 portal-lg:portal-grid-cols-3 portal-gap-6">
                  {nodes.map(node => (
                    <motion.div
                      key={node.id}
                      className="portal-border portal-rounded-lg portal-p-4"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="portal-flex portal-items-center portal-justify-between portal-mb-4">
                        <div className="portal-flex portal-items-center portal-gap-3">
                          <div className={`portal-p-2 portal-rounded ${
                            node.status === 'online' ? 'portal-bg-success/20 portal-text-success' :
                            node.status === 'syncing' ? 'portal-bg-warning/20 portal-text-warning' :
                            'portal-bg-error/20 portal-text-error'
                          }`}>
                            <Server size={16} />
                          </div>
                          <div>
                            <h4 className="portal-font-semibold">{node.type}</h4>
                            <p className="portal-text-xs portal-text-secondary">{node.location}</p>
                          </div>
                        </div>
                        
                        <span className={`portal-px-2 portal-py-1 portal-rounded portal-text-xs ${
                          node.status === 'online' ? 'portal-bg-success/20 portal-text-success' :
                          node.status === 'syncing' ? 'portal-bg-warning/20 portal-text-warning' :
                          'portal-bg-error/20 portal-text-error'
                        }`}>
                          {node.status}
                        </span>
                      </div>
                      
                      <div className="portal-space-y-3 portal-text-sm">
                        <div className="portal-flex portal-justify-between">
                          <span className="portal-text-secondary">Address:</span>
                          <code className="portal-text-xs">{node.address}</code>
                        </div>
                        <div className="portal-flex portal-justify-between">
                          <span className="portal-text-secondary">Version:</span>
                          <span>{node.version}</span>
                        </div>
                        <div className="portal-flex portal-justify-between">
                          <span className="portal-text-secondary">Uptime:</span>
                          <span>{node.uptime}%</span>
                        </div>
                        <div className="portal-flex portal-justify-between">
                          <span className="portal-text-secondary">Block Height:</span>
                          <span>{node.blockHeight.toLocaleString()}</span>
                        </div>
                        <div className="portal-flex portal-justify-between">
                          <span className="portal-text-secondary">Peers:</span>
                          <span>{node.peers}</span>
                        </div>
                        {node.stake && (
                          <div className="portal-flex portal-justify-between">
                            <span className="portal-text-secondary">Stake:</span>
                            <span>{node.stake.toLocaleString()} ETH</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="portal-flex portal-gap-2 portal-mt-4">
                        <button className="portal-btn portal-btn-sm portal-btn-secondary portal-flex-1">
                          <Activity size={14} />
                          Monitor
                        </button>
                        <button className="portal-btn portal-btn-sm portal-btn-secondary">
                          <Settings size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="portal-space-y-6">
              {/* Security Events */}
              <div className="portal-bg-surface portal-rounded-xl portal-p-6">
                <h3 className="portal-text-xl portal-font-semibold portal-mb-6">Security Events</h3>
                
                <div className="portal-space-y-4">
                  {securityEvents.map(event => (
                    <motion.div
                      key={event.id}
                      className="portal-border portal-rounded-lg portal-p-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="portal-flex portal-items-center portal-justify-between portal-mb-4">
                        <div className="portal-flex portal-items-center portal-gap-3">
                          <div className={`portal-p-2 portal-rounded ${
                            event.severity === 'critical' ? 'portal-bg-error/20 portal-text-error' :
                            event.severity === 'high' ? 'portal-bg-warning/20 portal-text-warning' :
                            event.severity === 'medium' ? 'portal-bg-info/20 portal-text-info' :
                            'portal-bg-success/20 portal-text-success'
                          }`}>
                            <AlertTriangle size={16} />
                          </div>
                          <div>
                            <h4 className="portal-font-semibold portal-capitalize">{event.type.replace('_', ' ')}</h4>
                            <p className="portal-text-sm portal-text-secondary">
                              {new Date(event.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        <span className={`portal-px-3 portal-py-1 portal-rounded portal-text-sm ${
                          event.status === 'resolved' ? 'portal-bg-success/20 portal-text-success' :
                          event.status === 'investigating' ? 'portal-bg-warning/20 portal-text-warning' :
                          'portal-bg-error/20 portal-text-error'
                        }`}>
                          {event.status}
                        </span>
                      </div>
                      
                      <p className="portal-mb-4">{event.description}</p>
                      
                      <div className="portal-mb-4">
                        <h5 className="portal-font-medium portal-mb-2">Affected Nodes:</h5>
                        <div className="portal-flex portal-flex-wrap portal-gap-2">
                          {event.affectedNodes.map(node => (
                            <code key={node} className="portal-px-2 portal-py-1 portal-bg-secondary/20 portal-rounded portal-text-xs">
                              {node}
                            </code>
                          ))}
                        </div>
                      </div>
                      
                      <div className="portal-mb-4">
                        <h5 className="portal-font-medium portal-mb-2">Mitigation Steps:</h5>
                        <ul className="portal-list-disc portal-list-inside portal-space-y-1 portal-text-sm">
                          {event.mitigationSteps.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="portal-flex portal-gap-2">
                        <button className="portal-btn portal-btn-sm portal-btn-primary">
                          <Eye size={14} />
                          Investigate
                        </button>
                        <button className="portal-btn portal-btn-sm portal-btn-secondary">
                          <CheckCircle size={14} />
                          Mark Resolved
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Transaction Detail Modal */}
      <AnimatePresence>
        {selectedTransaction && (
          <motion.div
            className="portal-fixed portal-inset-0 portal-bg-black/50 portal-backdrop-blur-sm portal-z-50 portal-flex portal-items-center portal-justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTransaction(null)}
          >
            <motion.div
              className="portal-bg-surface portal-rounded-xl portal-p-6 portal-max-w-2xl portal-w-full portal-mx-4 portal-max-h-[80vh] portal-overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="portal-flex portal-justify-between portal-items-start portal-mb-6">
                <h3 className="portal-text-xl portal-font-semibold">Transaction Details</h3>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="portal-text-secondary hover:portal-text-primary"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="portal-space-y-4">
                <div className="portal-grid portal-grid-cols-2 portal-gap-4">
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Transaction Hash</label>
                    <p className="portal-font-mono portal-text-sm portal-break-all">{selectedTransaction.hash}</p>
                  </div>
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Status</label>
                    <p className={`portal-font-semibold portal-capitalize ${
                      selectedTransaction.status === 'confirmed' ? 'portal-text-success' :
                      selectedTransaction.status === 'pending' ? 'portal-text-warning' :
                      'portal-text-error'
                    }`}>
                      {selectedTransaction.status}
                    </p>
                  </div>
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Block Number</label>
                    <p className="portal-font-semibold">{selectedTransaction.blockNumber}</p>
                  </div>
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Timestamp</label>
                    <p className="portal-font-semibold">{new Date(selectedTransaction.timestamp).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">From</label>
                    <p className="portal-font-mono portal-text-sm portal-break-all">{selectedTransaction.from}</p>
                  </div>
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">To</label>
                    <p className="portal-font-mono portal-text-sm portal-break-all">{selectedTransaction.to}</p>
                  </div>
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Value</label>
                    <p className="portal-font-semibold">{selectedTransaction.value}</p>
                  </div>
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Gas Used</label>
                    <p className="portal-font-semibold">{selectedTransaction.gasUsed.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Gas Price</label>
                    <p className="portal-font-semibold">{selectedTransaction.gasPrice}</p>
                  </div>
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Transaction Fee</label>
                    <p className="portal-font-semibold">{selectedTransaction.fee}</p>
                  </div>
                </div>
                
                <div className="portal-flex portal-gap-3 portal-pt-4">
                  <button className="portal-btn portal-btn-secondary">
                    <Copy size={16} />
                    Copy Hash
                  </button>
                  <button className="portal-btn portal-btn-secondary">
                    <ExternalLink size={16} />
                    View on Explorer
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart Contract Detail Modal */}
      <AnimatePresence>
        {selectedContract && (
          <motion.div
            className="portal-fixed portal-inset-0 portal-bg-black/50 portal-backdrop-blur-sm portal-z-50 portal-flex portal-items-center portal-justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedContract(null)}
          >
            <motion.div
              className="portal-bg-surface portal-rounded-xl portal-p-6 portal-max-w-3xl portal-w-full portal-mx-4 portal-max-h-[80vh] portal-overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="portal-flex portal-justify-between portal-items-start portal-mb-6">
                <h3 className="portal-text-xl portal-font-semibold">Smart Contract Details</h3>
                <button
                  onClick={() => setSelectedContract(null)}
                  className="portal-text-secondary hover:portal-text-primary"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="portal-space-y-6">
                <div className="portal-grid portal-grid-cols-2 portal-gap-4">
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Contract Name</label>
                    <p className="portal-font-semibold portal-text-lg">{selectedContract.name}</p>
                  </div>
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Type</label>
                    <p className="portal-font-semibold">{selectedContract.type}</p>
                  </div>
                  <div className="portal-col-span-2">
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Contract Address</label>
                    <p className="portal-font-mono portal-text-sm portal-break-all">{selectedContract.address}</p>
                  </div>
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Version</label>
                    <p className="portal-font-semibold">{selectedContract.version}</p>
                  </div>
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Status</label>
                    <p className={`portal-font-semibold portal-capitalize ${
                      selectedContract.status === 'active' ? 'portal-text-success' :
                      selectedContract.status === 'paused' ? 'portal-text-warning' :
                      'portal-text-error'
                    }`}>
                      {selectedContract.status}
                    </p>
                  </div>
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Deployed At</label>
                    <p className="portal-font-semibold">{new Date(selectedContract.deployedAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Transaction Count</label>
                    <p className="portal-font-semibold">{selectedContract.transactionCount.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Gas Used</label>
                    <p className="portal-font-semibold">{selectedContract.gasUsed.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Verified</label>
                    <p className={`portal-font-semibold ${selectedContract.verified ? 'portal-text-success' : 'portal-text-warning'}`}>
                      {selectedContract.verified ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div className="portal-col-span-2">
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Creator</label>
                    <p className="portal-font-mono portal-text-sm portal-break-all">{selectedContract.creator}</p>
                  </div>
                </div>
                
                <div className="portal-flex portal-gap-3 portal-pt-4">
                  <button className="portal-btn portal-btn-primary">
                    <Eye size={16} />
                    View Source Code
                  </button>
                  <button className="portal-btn portal-btn-secondary">
                    <Edit size={16} />
                    Interact
                  </button>
                  <button className="portal-btn portal-btn-secondary">
                    <Copy size={16} />
                    Copy Address
                  </button>
                  <button className="portal-btn portal-btn-secondary">
                    <ExternalLink size={16} />
                    View on Explorer
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SHEL;
