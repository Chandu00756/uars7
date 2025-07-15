import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Activity,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Eye,
  Lock
} from 'lucide-react';

interface OverviewMetrics {
  activeCells: number;
  genomeFitness: number;
  threatsNeutralized: number;
  avgResponseTime: number;
  systemLoad: number;
  intentTokens: number;
  timestamp: number;
}

interface ThreatTrend {
  time: string;
  threats: number;
  mitigated: number;
}

const Overview: React.FC = () => {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [threatTrends, setThreatTrends] = useState<ThreatTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        // Simulate API call with realistic data
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const now = Date.now();
        setMetrics({
          activeCells: 45 + Math.floor(Math.random() * 20),
          genomeFitness: 85 + Math.floor(Math.random() * 10),
          threatsNeutralized: Math.floor(Math.random() * 15),
          avgResponseTime: 8.5 + Math.random() * 3,
          systemLoad: 35 + Math.random() * 25,
          intentTokens: 120 + Math.floor(Math.random() * 50),
          timestamp: now
        });

        // Generate threat trend data
        const trends: ThreatTrend[] = [];
        for (let i = 23; i >= 0; i--) {
          const hour = new Date(now - i * 60 * 60 * 1000);
          trends.push({
            time: hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            threats: Math.floor(Math.random() * 25) + 5,
            mitigated: Math.floor(Math.random() * 20) + 15
          });
        }
        setThreatTrends(trends);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch overview data:', error);
        setLoading(false);
      }
    };

    fetchOverviewData();
    const interval = setInterval(fetchOverviewData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="cads-content-wrapper">
        <div className="flex items-center justify-center h-64">
          <div className="cads-loading"></div>
          <span className="ml-3 text-white/70">Loading CADS Overview...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="cads-content-wrapper cads-fade-in">
      {/* KPI Grid */}
      <div className="cads-kpi-grid">
        <motion.div 
          className="cads-kpi-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="cads-kpi-header">
            <h3 className="cads-kpi-title">Active Cells</h3>
            <div className="cads-kpi-icon">
              <Shield size={20} />
            </div>
          </div>
          <div className="cads-kpi-value">{metrics?.activeCells}</div>
          <div className="cads-kpi-trend positive">
            <TrendingUp size={16} />
            <span>+12% from last hour</span>
          </div>
        </motion.div>

        <motion.div 
          className="cads-kpi-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="cads-kpi-header">
            <h3 className="cads-kpi-title">Genome Fitness</h3>
            <div className="cads-kpi-icon">
              <Activity size={20} />
            </div>
          </div>
          <div className="cads-kpi-value">{metrics?.genomeFitness}%</div>
          <div className="cads-kpi-trend positive">
            <TrendingUp size={16} />
            <span>+3.2% improvement</span>
          </div>
        </motion.div>

        <motion.div 
          className="cads-kpi-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="cads-kpi-header">
            <h3 className="cads-kpi-title">Threats Neutralized</h3>
            <div className="cads-kpi-icon">
              <Target size={20} />
            </div>
          </div>
          <div className="cads-kpi-value">{metrics?.threatsNeutralized}</div>
          <div className="cads-kpi-trend neutral">
            <Clock size={16} />
            <span>Last 10 minutes</span>
          </div>
        </motion.div>

        <motion.div 
          className="cads-kpi-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="cads-kpi-header">
            <h3 className="cads-kpi-title">Response Time</h3>
            <div className="cads-kpi-icon">
              <Zap size={20} />
            </div>
          </div>
          <div className="cads-kpi-value">{metrics?.avgResponseTime.toFixed(1)}ms</div>
          <div className="cads-kpi-trend positive">
            <TrendingUp size={16} />
            <span>15% faster</span>
          </div>
        </motion.div>

        <motion.div 
          className="cads-kpi-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="cads-kpi-header">
            <h3 className="cads-kpi-title">System Load</h3>
            <div className="cads-kpi-icon">
              <Activity size={20} />
            </div>
          </div>
          <div className="cads-kpi-value">{metrics?.systemLoad.toFixed(1)}%</div>
          <div className="cads-kpi-trend neutral">
            <CheckCircle size={16} />
            <span>Optimal range</span>
          </div>
        </motion.div>

        <motion.div 
          className="cads-kpi-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="cads-kpi-header">
            <h3 className="cads-kpi-title">Intent Tokens</h3>
            <div className="cads-kpi-icon">
              <Lock size={20} />
            </div>
          </div>
          <div className="cads-kpi-value">{metrics?.intentTokens}</div>
          <div className="cads-kpi-trend positive">
            <TrendingUp size={16} />
            <span>Active tokens</span>
          </div>
        </motion.div>
      </div>

      {/* Threat Funnel Visualization */}
      <motion.div 
        className="cads-chart-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h3 className="cads-chart-title">Threat Funnel - Real-time Security Pipeline</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Threat Flow Diagram */}
          <div className="relative">
            <svg viewBox="0 0 300 400" className="w-full h-80">
              {/* Funnel stages */}
              <defs>
                <linearGradient id="threatGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              
              {/* Stage 1: Detection */}
              <rect x="50" y="50" width="200" height="40" rx="8" fill="rgba(239, 68, 68, 0.3)" stroke="#ef4444" strokeWidth="2" />
              <text x="150" y="75" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="600">
                Detection: 847 events
              </text>
              
              {/* Stage 2: Analysis */}
              <rect x="75" y="120" width="150" height="40" rx="8" fill="rgba(245, 158, 11, 0.3)" stroke="#f59e0b" strokeWidth="2" />
              <text x="150" y="145" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="600">
                Analysis: 423 threats
              </text>
              
              {/* Stage 3: Classification */}
              <rect x="100" y="190" width="100" height="40" rx="8" fill="rgba(59, 130, 246, 0.3)" stroke="#3b82f6" strokeWidth="2" />
              <text x="150" y="215" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="600">
                Classified: 156
              </text>
              
              {/* Stage 4: Mitigation */}
              <rect x="125" y="260" width="50" height="40" rx="8" fill="rgba(16, 185, 129, 0.3)" stroke="#10b981" strokeWidth="2" />
              <text x="150" y="285" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="600">
                Mitigated: 89
              </text>
              
              {/* Connecting lines */}
              <path d="M150 90 L150 120" stroke="#ffffff" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <path d="M150 160 L150 190" stroke="#ffffff" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <path d="M150 230 L150 260" stroke="#ffffff" strokeWidth="2" markerEnd="url(#arrowhead)" />
              
              {/* Arrow marker */}
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#ffffff" />
                </marker>
              </defs>
            </svg>
          </div>

          {/* Real-time Metrics */}
          <div className="space-y-4">
            <div className="cads-metric-item">
              <div className="cads-metric-label">Detection Rate</div>
              <div className="cads-metric-value">847/min</div>
              <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            
            <div className="cads-metric-item">
              <div className="cads-metric-label">False Positive Rate</div>
              <div className="cads-metric-value">2.3%</div>
              <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '23%' }}></div>
              </div>
            </div>
            
            <div className="cads-metric-item">
              <div className="cads-metric-label">Mitigation Success</div>
              <div className="cads-metric-value">97.2%</div>
              <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '97%' }}></div>
              </div>
            </div>
            
            <div className="cads-metric-item">
              <div className="cads-metric-label">Avg. Response Time</div>
              <div className="cads-metric-value">{metrics?.avgResponseTime.toFixed(1)}ms</div>
              <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '72%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Threat Trend Chart */}
      <motion.div 
        className="cads-chart-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <h3 className="cads-chart-title">24-Hour Threat Landscape</h3>
        <div className="relative h-64">
          <svg viewBox="0 0 800 200" className="w-full h-full">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map(i => (
              <line key={i} x1="0" y1={i * 40} x2="800" y2={i * 40} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            ))}
            
            {/* Threat line */}
            <polyline
              points={threatTrends.map((trend, index) => 
                `${(index / (threatTrends.length - 1)) * 800},${200 - (trend.threats / 30) * 160}`
              ).join(' ')}
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
              className="drop-shadow-lg"
            />
            
            {/* Mitigated line */}
            <polyline
              points={threatTrends.map((trend, index) => 
                `${(index / (threatTrends.length - 1)) * 800},${200 - (trend.mitigated / 30) * 160}`
              ).join(' ')}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              className="drop-shadow-lg"
            />
            
            {/* Data points */}
            {threatTrends.map((trend, index) => (
              <g key={index}>
                <circle
                  cx={(index / (threatTrends.length - 1)) * 800}
                  cy={200 - (trend.threats / 30) * 160}
                  r="4"
                  fill="#ef4444"
                  className="hover:r-6 transition-all duration-200 cursor-pointer"
                />
                <circle
                  cx={(index / (threatTrends.length - 1)) * 800}
                  cy={200 - (trend.mitigated / 30) * 160}
                  r="4"
                  fill="#10b981"
                  className="hover:r-6 transition-all duration-200 cursor-pointer"
                />
              </g>
            ))}
          </svg>
          
          {/* Legend */}
          <div className="absolute top-4 right-4 bg-black/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-white">Threats Detected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-white">Threats Mitigated</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <button className="cads-action-button justify-center p-4">
          <Eye size={20} />
          <span>Live Cell Monitor</span>
        </button>
        
        <button className="cads-action-button justify-center p-4">
          <AlertTriangle size={20} />
          <span>Emergency Lockdown</span>
        </button>
        
        <button className="cads-action-button justify-center p-4">
          <Target size={20} />
          <span>Threat Hunt Mode</span>
        </button>
      </motion.div>
    </div>
  );
};

export default Overview;
