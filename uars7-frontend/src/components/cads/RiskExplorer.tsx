import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Activity,
  Users,
  Clock,
  Target,
  Eye,
  Zap,
  AlertTriangle,
  X
} from 'lucide-react';

interface RiskMetrics {
  totalCells: number;
  highRiskCells: number;
  averageRisk: number;
  riskTrend: 'up' | 'down' | 'stable';
  categories: {
    authentication: number;
    authorization: number;
    dataAccess: number;
    networkTraffic: number;
    systemResources: number;
  };
  topRisks: Array<{
    cellId: string;
    riskScore: number;
    category: string;
    description: string;
    timeDetected: Date;
  }>;
}

interface RiskExplorerProps {
  isOpen: boolean;
  onClose: () => void;
  cellId?: string;
}

const RiskExplorer: React.FC<RiskExplorerProps> = ({ isOpen, onClose, cellId }) => {
  const [metrics, setMetrics] = useState<RiskMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      loadRiskMetrics();
    }
  }, [isOpen, timeRange]);

  const loadRiskMetrics = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockMetrics: RiskMetrics = {
        totalCells: 847,
        highRiskCells: 23,
        averageRisk: 34.7,
        riskTrend: 'down',
        categories: {
          authentication: 45.2,
          authorization: 12.8,
          dataAccess: 23.6,
          networkTraffic: 8.9,
          systemResources: 15.7
        },
        topRisks: [
          {
            cellId: 'cell_789abc',
            riskScore: 87.3,
            category: 'authentication',
            description: 'Multiple failed authentication attempts from suspicious IP',
            timeDetected: new Date(Date.now() - 300000)
          },
          {
            cellId: 'cell_456def',
            riskScore: 72.1,
            category: 'dataAccess',
            description: 'Unusual data access pattern detected',
            timeDetected: new Date(Date.now() - 600000)
          },
          {
            cellId: 'cell_123ghi',
            riskScore: 68.9,
            category: 'authorization',
            description: 'Privilege escalation attempt detected',
            timeDetected: new Date(Date.now() - 900000)
          },
          {
            cellId: 'cell_987jkl',
            riskScore: 65.4,
            category: 'networkTraffic',
            description: 'Anomalous network communication pattern',
            timeDetected: new Date(Date.now() - 1200000)
          },
          {
            cellId: 'cell_654mno',
            riskScore: 61.7,
            category: 'systemResources',
            description: 'Excessive resource consumption detected',
            timeDetected: new Date(Date.now() - 1500000)
          }
        ]
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to load risk metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-400';
    if (score >= 60) return 'text-orange-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getRiskBgColor = (score: number) => {
    if (score >= 80) return 'bg-red-400/20 border-red-400/50';
    if (score >= 60) return 'bg-orange-400/20 border-orange-400/50';
    if (score >= 40) return 'bg-yellow-400/20 border-yellow-400/50';
    return 'bg-green-400/20 border-green-400/50';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'authentication': return <Users size={16} />;
      case 'authorization': return <Eye size={16} />;
      case 'dataAccess': return <Target size={16} />;
      case 'networkTraffic': return <Activity size={16} />;
      case 'systemResources': return <Zap size={16} />;
      default: return <AlertTriangle size={16} />;
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gray-900/95 backdrop-blur border border-white/20 rounded-lg w-full max-w-6xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="cads-kpi-icon bg-red-500/20">
              <TrendingUp size={24} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Risk Explorer</h2>
              <p className="text-white/60 text-sm">
                {cellId ? `Analyzing risk for: ${cellId}` : 'System-wide risk analysis'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="cads-form-select"
              aria-label="Time Range"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>
            <button
              onClick={onClose}
              className="cads-action-button"
              aria-label="Close Risk Explorer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="cads-loading"></div>
            <span className="ml-3 text-white/70">Loading risk analysis...</span>
          </div>
        ) : metrics ? (
          <div className="flex-1 overflow-auto p-6 space-y-6">
            {/* Risk Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="cads-kpi-card">
                <div className="cads-kpi-icon bg-blue-500/20">
                  <Activity size={24} className="text-blue-400" />
                </div>
                <div className="cads-kpi-content">
                  <div className="cads-kpi-value">{metrics.totalCells}</div>
                  <div className="cads-kpi-label">Total Cells</div>
                </div>
              </div>

              <div className="cads-kpi-card">
                <div className="cads-kpi-icon bg-red-500/20">
                  <AlertTriangle size={24} className="text-red-400" />
                </div>
                <div className="cads-kpi-content">
                  <div className="cads-kpi-value">{metrics.highRiskCells}</div>
                  <div className="cads-kpi-label">High Risk</div>
                </div>
              </div>

              <div className="cads-kpi-card">
                <div className="cads-kpi-icon bg-yellow-500/20">
                  <TrendingUp size={24} className="text-yellow-400" />
                </div>
                <div className="cads-kpi-content">
                  <div className={`cads-kpi-value ${getRiskColor(metrics.averageRisk)}`}>
                    {metrics.averageRisk.toFixed(1)}
                  </div>
                  <div className="cads-kpi-label">Avg Risk Score</div>
                </div>
              </div>

              <div className="cads-kpi-card">
                <div className="cads-kpi-icon bg-green-500/20">
                  {metrics.riskTrend === 'up' ? (
                    <ArrowUpRight size={24} className="text-red-400" />
                  ) : metrics.riskTrend === 'down' ? (
                    <ArrowDownRight size={24} className="text-green-400" />
                  ) : (
                    <TrendingUp size={24} className="text-yellow-400" />
                  )}
                </div>
                <div className="cads-kpi-content">
                  <div className={`cads-kpi-value ${
                    metrics.riskTrend === 'up' ? 'text-red-400' :
                    metrics.riskTrend === 'down' ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {metrics.riskTrend.toUpperCase()}
                  </div>
                  <div className="cads-kpi-label">Risk Trend</div>
                </div>
              </div>
            </div>

            {/* Risk Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="cads-chart-container">
                <h4 className="cads-chart-title flex items-center gap-2">
                  <PieChart size={16} />
                  Risk by Category
                </h4>
                <div className="space-y-3">
                  {Object.entries(metrics.categories).map(([category, percentage]) => (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(category)}
                          <span className="capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}</span>
                        </div>
                        <span className="font-semibold">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-cyan-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="cads-chart-container">
                <h4 className="cads-chart-title flex items-center gap-2">
                  <BarChart3 size={16} />
                  Risk Trend (24h)
                </h4>
                <div className="h-48 flex items-end justify-center">
                  <div className="text-white/60">Risk trend chart visualization would go here</div>
                </div>
              </div>
            </div>

            {/* Top Risk Cells */}
            <div className="cads-chart-container">
              <div className="flex items-center justify-between mb-4">
                <h4 className="cads-chart-title flex items-center gap-2">
                  <AlertTriangle size={16} />
                  Highest Risk Cells
                </h4>
                <div className="flex items-center gap-2">
                  <label htmlFor="categoryFilter" className="text-sm">Filter:</label>
                  <select
                    id="categoryFilter"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="cads-form-select text-sm"
                  >
                    <option value="all">All Categories</option>
                    <option value="authentication">Authentication</option>
                    <option value="authorization">Authorization</option>
                    <option value="dataAccess">Data Access</option>
                    <option value="networkTraffic">Network Traffic</option>
                    <option value="systemResources">System Resources</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {metrics.topRisks
                  .filter(risk => selectedCategory === 'all' || risk.category === selectedCategory)
                  .map((risk, index) => (
                    <motion.div
                      key={risk.cellId}
                      className="cads-kpi-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-mono text-sm bg-black/20 px-2 py-1 rounded">
                              {risk.cellId}
                            </span>
                            <span className={`cads-status-badge text-xs ${getRiskBgColor(risk.riskScore)}`}>
                              <span className={getRiskColor(risk.riskScore)}>
                                {risk.riskScore.toFixed(1)}
                              </span>
                            </span>
                            <span className="flex items-center gap-1 text-sm text-white/60">
                              {getCategoryIcon(risk.category)}
                              {risk.category}
                            </span>
                          </div>
                          <p className="text-white/80 mb-2">{risk.description}</p>
                          <div className="flex items-center gap-4 text-sm text-white/60">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {risk.timeDetected.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          <button
                            className="cads-action-button text-sm"
                            onClick={() => console.log('Inspect cell:', risk.cellId)}
                          >
                            <Eye size={14} />
                            Inspect
                          </button>
                          <button
                            className="cads-action-button text-sm"
                            onClick={() => console.log('Mitigate risk:', risk.cellId)}
                          >
                            <Target size={14} />
                            Mitigate
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>

            {/* Risk Mitigation Actions */}
            <div className="cads-chart-container">
              <h4 className="cads-chart-title">Recommended Actions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} className="text-yellow-400" />
                    <span className="font-semibold">Review High Risk Cells</span>
                  </div>
                  <p className="text-sm text-white/80">
                    {metrics.highRiskCells} cells require immediate attention
                  </p>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={16} className="text-blue-400" />
                    <span className="font-semibold">Update Policies</span>
                  </div>
                  <p className="text-sm text-white/80">
                    Consider tightening authentication policies
                  </p>
                </div>

                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity size={16} className="text-green-400" />
                    <span className="font-semibold">Monitor Trends</span>
                  </div>
                  <p className="text-sm text-white/80">
                    Risk trend is improving, continue monitoring
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-white/60">
              <TrendingUp size={48} className="mx-auto mb-4" />
              <p>Failed to load risk analysis</p>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default RiskExplorer;
