import React, { useState, useEffect } from 'react';
import {
  Shield,
  Activity,
  Zap,
  Cpu,
  MemoryStick,
  Network,
  Database,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Play,
  Pause,
  Settings
} from 'lucide-react';
import './cads.css';

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature: number;
  };
  memory: {
    used: number;
    total: number;
    cache: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
  storage: {
    used: number;
    total: number;
    iops: number;
  };
  microcells: {
    active: number;
    spawned: number;
    terminated: number;
    failed: number;
  };
  security: {
    threatsBlocked: number;
    riskScore: number;
    alertsActive: number;
  };
}

interface PerformanceMetric {
  timestamp: number;
  value: number;
}

interface SystemHealthMonitorProps {
  className?: string;
}

const SystemHealthMonitor: React.FC<SystemHealthMonitorProps> = ({ className = '' }) => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [cpuHistory, setCpuHistory] = useState<PerformanceMetric[]>([]);
  const [memoryHistory, setMemoryHistory] = useState<PerformanceMetric[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(2000);
  const [loading, setLoading] = useState(false);

  // Generate mock metrics
  const generateMetrics = (): SystemMetrics => {
    const now = Date.now();
    return {
      cpu: {
        usage: Math.random() * 80 + 10, // 10-90%
        cores: 8,
        temperature: Math.random() * 20 + 45 // 45-65°C
      },
      memory: {
        used: Math.random() * 6 + 2, // 2-8 GB
        total: 16,
        cache: Math.random() * 2 + 0.5 // 0.5-2.5 GB
      },
      network: {
        bytesIn: Math.random() * 1000000 + 100000,
        bytesOut: Math.random() * 800000 + 80000,
        packetsIn: Math.random() * 5000 + 1000,
        packetsOut: Math.random() * 4000 + 800
      },
      storage: {
        used: Math.random() * 200 + 50, // 50-250 GB
        total: 500,
        iops: Math.random() * 1000 + 200
      },
      microcells: {
        active: Math.floor(Math.random() * 25 + 5),
        spawned: Math.floor(Math.random() * 100 + 50),
        terminated: Math.floor(Math.random() * 80 + 20),
        failed: Math.floor(Math.random() * 5)
      },
      security: {
        threatsBlocked: Math.floor(Math.random() * 50 + 10),
        riskScore: Math.random() * 30 + 15, // 15-45 (low risk)
        alertsActive: Math.floor(Math.random() * 3)
      }
    };
  };

  // Update metrics
  useEffect(() => {
    const updateMetrics = () => {
      setLoading(true);
      setTimeout(() => {
        const newMetrics = generateMetrics();
        setMetrics(newMetrics);
        
        // Update history for charts
        const now = Date.now();
        setCpuHistory(prev => [...prev, { timestamp: now, value: newMetrics.cpu.usage }].slice(-50));
        setMemoryHistory(prev => [...prev, { timestamp: now, value: (newMetrics.memory.used / newMetrics.memory.total) * 100 }].slice(-50));
        
        setLoading(false);
      }, 200);
    };

    updateMetrics();

    if (autoRefresh) {
      const interval = setInterval(updateMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 75) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 90) return <AlertTriangle size={16} className="text-red-500" />;
    return <CheckCircle size={16} className="text-green-500" />;
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(Math.round(num));
  };

  const renderMiniChart = (data: PerformanceMetric[], color: string) => {
    if (data.length < 2) return null;

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;

    return (
      <div className="mini-chart">
        <svg width="100%" height="40" viewBox="0 0 200 40">
          <polyline
            points={data.map((point, index) => {
              const x = (index / (data.length - 1)) * 200;
              const y = 40 - ((point.value - minValue) / range) * 40;
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke={color}
            strokeWidth="2"
          />
        </svg>
      </div>
    );
  };

  if (!metrics) {
    return (
      <div className={`system-health-monitor ${className}`}>
        <div className="health-loading">
          <RefreshCw size={32} className="animate-spin" />
          <span>Loading system metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`system-health-monitor ${className}`}>
      <div className="health-header">
        <h3 className="health-title">
          <Activity className="cads-icon" />
          System Health Monitor
        </h3>
        
        <div className="health-controls">
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="cads-select"
            disabled={!autoRefresh}
            aria-label="Refresh interval"
          >
            <option value={1000}>1s</option>
            <option value={2000}>2s</option>
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
          </select>
          
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`cads-button cads-button-sm ${autoRefresh ? 'active' : ''}`}
            title={autoRefresh ? 'Pause monitoring' : 'Resume monitoring'}
          >
            {autoRefresh ? <Pause size={16} /> : <Play size={16} />}
          </button>
          
          <button
            className="cads-button cads-button-sm"
            title="Configure thresholds"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      <div className="health-grid">
        {/* CPU Metrics */}
        <div className="health-card">
          <div className="health-card-header">
            <Cpu className="health-icon" />
            <h4>CPU</h4>
            {getStatusIcon(metrics.cpu.usage)}
          </div>
          <div className="health-card-body">
            <div className="health-primary-metric">
              <span className={`health-value ${getStatusColor(metrics.cpu.usage)}`}>
                {metrics.cpu.usage.toFixed(1)}%
              </span>
              <span className="health-label">Usage</span>
            </div>
            <div className="health-secondary-metrics">
              <div className="health-secondary-item">
                <span className="health-secondary-label">Cores:</span>
                <span className="health-secondary-value">{metrics.cpu.cores}</span>
              </div>
              <div className="health-secondary-item">
                <span className="health-secondary-label">Temp:</span>
                <span className="health-secondary-value">{metrics.cpu.temperature.toFixed(1)}°C</span>
              </div>
            </div>
            {renderMiniChart(cpuHistory, '#3b82f6')}
          </div>
        </div>

        {/* Memory Metrics */}
        <div className="health-card">
          <div className="health-card-header">
            <MemoryStick className="health-icon" />
            <h4>Memory</h4>
            {getStatusIcon((metrics.memory.used / metrics.memory.total) * 100)}
          </div>
          <div className="health-card-body">
            <div className="health-primary-metric">
              <span className={`health-value ${getStatusColor((metrics.memory.used / metrics.memory.total) * 100)}`}>
                {((metrics.memory.used / metrics.memory.total) * 100).toFixed(1)}%
              </span>
              <span className="health-label">Used</span>
            </div>
            <div className="health-secondary-metrics">
              <div className="health-secondary-item">
                <span className="health-secondary-label">Used:</span>
                <span className="health-secondary-value">{metrics.memory.used.toFixed(1)} GB</span>
              </div>
              <div className="health-secondary-item">
                <span className="health-secondary-label">Cache:</span>
                <span className="health-secondary-value">{metrics.memory.cache.toFixed(1)} GB</span>
              </div>
            </div>
            {renderMiniChart(memoryHistory, '#10b981')}
          </div>
        </div>

        {/* Network Metrics */}
        <div className="health-card">
          <div className="health-card-header">
            <Network className="health-icon" />
            <h4>Network</h4>
            <CheckCircle size={16} className="text-green-500" />
          </div>
          <div className="health-card-body">
            <div className="health-network-flow">
              <div className="health-flow-item">
                <TrendingDown className="flow-icon text-blue-500" />
                <span className="flow-value">{formatBytes(metrics.network.bytesIn)}/s</span>
                <span className="flow-label">In</span>
              </div>
              <div className="health-flow-item">
                <TrendingUp className="flow-icon text-green-500" />
                <span className="flow-value">{formatBytes(metrics.network.bytesOut)}/s</span>
                <span className="flow-label">Out</span>
              </div>
            </div>
            <div className="health-secondary-metrics">
              <div className="health-secondary-item">
                <span className="health-secondary-label">Packets In:</span>
                <span className="health-secondary-value">{formatNumber(metrics.network.packetsIn)}</span>
              </div>
              <div className="health-secondary-item">
                <span className="health-secondary-label">Packets Out:</span>
                <span className="health-secondary-value">{formatNumber(metrics.network.packetsOut)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Storage Metrics */}
        <div className="health-card">
          <div className="health-card-header">
            <Database className="health-icon" />
            <h4>Storage</h4>
            {getStatusIcon((metrics.storage.used / metrics.storage.total) * 100)}
          </div>
          <div className="health-card-body">
            <div className="health-primary-metric">
              <span className={`health-value ${getStatusColor((metrics.storage.used / metrics.storage.total) * 100)}`}>
                {((metrics.storage.used / metrics.storage.total) * 100).toFixed(1)}%
              </span>
              <span className="health-label">Used</span>
            </div>
            <div className="health-secondary-metrics">
              <div className="health-secondary-item">
                <span className="health-secondary-label">Free:</span>
                <span className="health-secondary-value">{(metrics.storage.total - metrics.storage.used).toFixed(0)} GB</span>
              </div>
              <div className="health-secondary-item">
                <span className="health-secondary-label">IOPS:</span>
                <span className="health-secondary-value">{formatNumber(metrics.storage.iops)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Microcells Metrics */}
        <div className="health-card">
          <div className="health-card-header">
            <Zap className="health-icon" />
            <h4>Micro-cells</h4>
            <CheckCircle size={16} className="text-green-500" />
          </div>
          <div className="health-card-body">
            <div className="health-primary-metric">
              <span className="health-value text-blue-500">
                {metrics.microcells.active}
              </span>
              <span className="health-label">Active</span>
            </div>
            <div className="health-secondary-metrics">
              <div className="health-secondary-item">
                <span className="health-secondary-label">Spawned:</span>
                <span className="health-secondary-value">{metrics.microcells.spawned}</span>
              </div>
              <div className="health-secondary-item">
                <span className="health-secondary-label">Failed:</span>
                <span className={`health-secondary-value ${metrics.microcells.failed > 0 ? 'text-red-500' : ''}`}>
                  {metrics.microcells.failed}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Metrics */}
        <div className="health-card">
          <div className="health-card-header">
            <Shield className="health-icon" />
            <h4>Security</h4>
            {getStatusIcon(metrics.security.riskScore)}
          </div>
          <div className="health-card-body">
            <div className="health-primary-metric">
              <span className={`health-value ${getStatusColor(metrics.security.riskScore)}`}>
                {metrics.security.riskScore.toFixed(0)}
              </span>
              <span className="health-label">Risk Score</span>
            </div>
            <div className="health-secondary-metrics">
              <div className="health-secondary-item">
                <span className="health-secondary-label">Threats Blocked:</span>
                <span className="health-secondary-value text-green-500">{metrics.security.threatsBlocked}</span>
              </div>
              <div className="health-secondary-item">
                <span className="health-secondary-label">Active Alerts:</span>
                <span className={`health-secondary-value ${metrics.security.alertsActive > 0 ? 'text-yellow-500' : ''}`}>
                  {metrics.security.alertsActive}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="health-footer">
        <div className="health-status-indicator">
          <div className={`status-dot ${loading ? 'loading' : 'connected'}`}></div>
          <span className="status-text">
            {loading ? 'Updating...' : `Last updated: ${new Date().toLocaleTimeString()}`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthMonitor;
