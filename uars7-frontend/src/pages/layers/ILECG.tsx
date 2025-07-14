import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Activity, 
  Clock, 
  Database, 
  TrendingUp, 
  Filter,
  Search,
  Download,
  Eye,
  BarChart3,
  Network,
  Cpu,
  Shield
} from 'lucide-react';

// Define TypeScript interfaces
interface CorrelationEvent {
  id: string;
  pattern: string;
  confidence: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  events: number;
  sources: string[];
  timestamp: string;
  description: string;
  riskScore: number;
}

interface RealTimeEvent {
  id: number;
  time: string;
  source: string;
  event: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface PerformanceMetric {
  name: string;
  value: number;
  change: string;
  trend: 'up' | 'down';
}

interface SourceSystem {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  events: number;
  latency: string;
}

const ILECG: React.FC = () => {
  const [correlationData, setCorrelationData] = useState<CorrelationEvent[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('24h');
  const [realTimeEvents, setRealTimeEvents] = useState<RealTimeEvent[]>([]);

  // Simulated correlation events
  const correlationEvents: CorrelationEvent[] = [
    {
      id: 'CORR-001',
      pattern: 'Multi-Vector Attack Pattern',
      confidence: 94,
      severity: 'critical',
      events: 47,
      sources: ['Firewall', 'IDS', 'SIEM', 'EDR'],
      timestamp: '2025-01-11 14:32:15',
      description: 'Coordinated attack detected across multiple entry points',
      riskScore: 950
    },
    {
      id: 'CORR-002',
      pattern: 'Privilege Escalation Chain',
      confidence: 87,
      severity: 'high',
      events: 23,
      sources: ['AD', 'Windows Events', 'Process Monitor'],
      timestamp: '2025-01-11 14:28:42',
      description: 'Sequential privilege escalation attempts detected',
      riskScore: 780
    },
    {
      id: 'CORR-003',
      pattern: 'Data Exfiltration Sequence',
      confidence: 91,
      severity: 'critical',
      events: 156,
      sources: ['DLP', 'Network Monitor', 'File System'],
      timestamp: '2025-01-11 14:25:18',
      description: 'Large-scale data movement pattern identified',
      riskScore: 890
    },
    {
      id: 'CORR-004',
      pattern: 'Lateral Movement Pattern',
      confidence: 76,
      severity: 'medium',
      events: 34,
      sources: ['Network', 'Authentication', 'Process'],
      timestamp: '2025-01-11 14:22:55',
      description: 'Suspicious network traversal behavior',
      riskScore: 650
    },
    {
      id: 'CORR-005',
      pattern: 'Reconnaissance Activity',
      confidence: 82,
      severity: 'medium',
      events: 89,
      sources: ['Network Scanner', 'DNS', 'Port Monitor'],
      timestamp: '2025-01-11 14:19:33',
      description: 'Systematic network discovery attempts',
      riskScore: 580
    }
  ];

  // Real-time event stream template
  const eventStreamTemplates = [
    { time: '14:32:45', source: 'Firewall', event: 'Blocked connection from 203.0.113.5', severity: 'medium' as const },
    { time: '14:32:43', source: 'IDS', event: 'Signature match: SQL injection attempt', severity: 'high' as const },
    { time: '14:32:41', source: 'SIEM', event: 'Correlation rule triggered: Multi-stage attack', severity: 'critical' as const },
    { time: '14:32:39', source: 'EDR', event: 'Suspicious process execution detected', severity: 'high' as const },
    { time: '14:32:37', source: 'DLP', event: 'Data classification policy violation', severity: 'medium' as const },
    { time: '14:32:35', source: 'Network', event: 'Anomalous traffic pattern detected', severity: 'medium' as const },
    { time: '14:32:33', source: 'Auth', event: 'Multiple failed login attempts', severity: 'low' as const },
    { time: '14:32:31', source: 'DNS', event: 'Suspicious domain resolution', severity: 'medium' as const }
  ];

  // Performance metrics
  const performanceMetrics: PerformanceMetric[] = [
    { name: 'Events/Sec', value: 12847, change: '+5.2%', trend: 'up' },
    { name: 'Correlation Rate', value: 94.7, change: '+2.1%', trend: 'up' },
    { name: 'False Positives', value: 2.3, change: '-0.8%', trend: 'down' },
    { name: 'Response Time', value: 1.2, change: '-0.3s', trend: 'down' }
  ];

  // Source systems health
  const sourceSystems: SourceSystem[] = [
    { name: 'SIEM Platform', status: 'healthy', events: 45672, latency: '0.8s' },
    { name: 'Firewall Logs', status: 'healthy', events: 23891, latency: '0.5s' },
    { name: 'IDS/IPS', status: 'warning', events: 12456, latency: '1.2s' },
    { name: 'EDR Agents', status: 'healthy', events: 34567, latency: '0.9s' },
    { name: 'Network Flow', status: 'healthy', events: 78923, latency: '0.6s' },
    { name: 'DNS Logs', status: 'healthy', events: 56789, latency: '0.4s' }
  ];

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newEvent = eventStreamTemplates[Math.floor(Math.random() * eventStreamTemplates.length)];
      setRealTimeEvents(prev => [
        { ...newEvent, id: Date.now(), time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 9)
      ]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'portal-text-error';
      case 'high': return 'portal-text-warning';
      case 'medium': return 'portal-text-accent';
      case 'low': return 'portal-text-success';
      default: return 'portal-text-secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'portal-text-success';
      case 'warning': return 'portal-text-warning';
      case 'error': return 'portal-text-error';
      default: return 'portal-text-secondary';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="portal-ilecg-page"
    >
      {/* Header */}
      <div className="portal-page-header portal-mb-6">
        <h1 className="portal-text-3xl portal-font-bold portal-mb-2">
          <Zap className="portal-inline portal-mr-2" size={32} />
          Intelligent Log Event Correlation Gateway (ILECG)
        </h1>
        <p className="portal-text-secondary">
          Advanced correlation engine for multi-source security event analysis and pattern detection
        </p>
      </div>

      {/* Performance Metrics */}
      <div className="portal-metrics-grid portal-grid portal-grid-cols-1 portal-md:portal-grid-cols-2 portal-lg:portal-grid-cols-4 portal-gap-6 portal-mb-8">
        {performanceMetrics.map((metric, index) => (
          <motion.div
            key={metric.name}
            className="portal-metric-card portal-bg-surface portal-rounded-lg portal-p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
          >
            <div className="portal-flex portal-items-center portal-justify-between portal-mb-2">
              <h3 className="portal-text-sm portal-font-medium portal-text-secondary">{metric.name}</h3>
              <TrendingUp 
                size={16} 
                className={metric.trend === 'up' ? 'portal-text-success' : 'portal-text-error'} 
              />
            </div>
            <div className="portal-text-2xl portal-font-bold portal-mb-1">
              {typeof metric.value === 'number' && metric.value > 100 
                ? metric.value.toLocaleString() 
                : metric.value}
              {metric.name.includes('Rate') || metric.name.includes('Positives') ? '%' : ''}
              {metric.name.includes('Time') ? 's' : ''}
            </div>
            <div className={`portal-text-sm ${
              metric.trend === 'up' ? 'portal-text-success' : 'portal-text-error'
            }`}>
              {metric.change}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="portal-grid portal-grid-cols-1 portal-lg:portal-grid-cols-3 portal-gap-6 portal-mb-8">
        
        {/* Correlation Events */}
        <div className="portal-lg:portal-col-span-2">
          <div className="portal-bg-surface portal-rounded-lg portal-p-6">
            <div className="portal-flex portal-justify-between portal-items-center portal-mb-6">
              <h2 className="portal-text-xl portal-font-semibold">Active Correlations</h2>
              <div className="portal-flex portal-gap-2">
                <select 
                  value={activeFilter} 
                  onChange={(e) => setActiveFilter(e.target.value)}
                  className="portal-px-3 portal-py-1 portal-rounded portal-border portal-text-sm"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                </select>
                <button className="portal-btn portal-btn-secondary portal-btn-sm">
                  <Download size={14} />
                  Export
                </button>
              </div>
            </div>

            <div className="portal-space-y-4">
              {correlationEvents.map((correlation, index) => (
                <motion.div
                  key={correlation.id}
                  className="portal-correlation-card portal-border portal-rounded-lg portal-p-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                >
                  <div className="portal-flex portal-justify-between portal-items-start portal-mb-3">
                    <div className="portal-flex portal-items-center portal-gap-3">
                      <div className={`portal-severity-indicator ${correlation.severity}`}>
                        <AlertTriangle size={16} />
                      </div>
                      <div>
                        <h3 className="portal-font-semibold">{correlation.pattern}</h3>
                        <p className="portal-text-sm portal-text-secondary">{correlation.id}</p>
                      </div>
                    </div>
                    <div className="portal-text-right">
                      <div className="portal-text-sm portal-font-medium">
                        Confidence: {correlation.confidence}%
                      </div>
                      <div className="portal-text-xs portal-text-secondary">
                        Risk: {correlation.riskScore}
                      </div>
                    </div>
                  </div>

                  <p className="portal-text-sm portal-text-secondary portal-mb-3">
                    {correlation.description}
                  </p>

                  <div className="portal-flex portal-justify-between portal-items-center">
                    <div className="portal-flex portal-items-center portal-gap-4 portal-text-sm">
                      <span className="portal-flex portal-items-center portal-gap-1">
                        <Database size={14} />
                        {correlation.events} events
                      </span>
                      <span className="portal-flex portal-items-center portal-gap-1">
                        <Clock size={14} />
                        {correlation.timestamp}
                      </span>
                    </div>
                    
                    <div className="portal-flex portal-gap-2">
                      <button className="portal-btn portal-btn-secondary portal-btn-sm">
                        <Eye size={14} />
                        Investigate
                      </button>
                      <button className="portal-btn portal-btn-primary portal-btn-sm">
                        <Shield size={14} />
                        Respond
                      </button>
                    </div>
                  </div>

                  <div className="portal-mt-3 portal-pt-3 portal-border-t">
                    <div className="portal-text-xs portal-text-secondary portal-mb-2">Sources:</div>
                    <div className="portal-flex portal-gap-2">
                      {correlation.sources.map(source => (
                        <span key={source} className="portal-source-tag">
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time Event Stream */}
        <div>
          <div className="portal-bg-surface portal-rounded-lg portal-p-6 portal-mb-6">
            <div className="portal-flex portal-items-center portal-justify-between portal-mb-4">
              <h3 className="portal-text-lg portal-font-semibold">Live Event Stream</h3>
              <div className="portal-flex portal-items-center portal-gap-2">
                <div className="portal-w-2 portal-h-2 portal-bg-success portal-rounded-full portal-pulse"></div>
                <span className="portal-text-sm portal-text-success">Live</span>
              </div>
            </div>

            <div className="portal-event-stream portal-space-y-2 portal-max-h-96 portal-overflow-y-auto">
              {realTimeEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  className="portal-event-item portal-p-3 portal-bg-primary portal-bg-opacity-5 portal-rounded portal-border-l-2"
                  style={{ borderLeftColor: event.severity === 'critical' ? '#dc2626' : 
                                            event.severity === 'high' ? '#d97706' : 
                                            event.severity === 'medium' ? '#2563eb' : '#059669' }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="portal-flex portal-justify-between portal-items-start portal-mb-1">
                    <span className="portal-text-xs portal-font-mono portal-text-secondary">
                      {event.time}
                    </span>
                    <span className={`portal-text-xs portal-font-medium ${getSeverityColor(event.severity)}`}>
                      {event.severity.toUpperCase()}
                    </span>
                  </div>
                  <div className="portal-text-sm portal-font-medium portal-mb-1">
                    {event.source}
                  </div>
                  <div className="portal-text-xs portal-text-secondary">
                    {event.event}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Correlation Engine Status */}
          <div className="portal-bg-surface portal-rounded-lg portal-p-6">
            <h3 className="portal-text-lg portal-font-semibold portal-mb-4">Engine Status</h3>
            
            <div className="portal-space-y-3">
              <div className="portal-flex portal-justify-between portal-items-center">
                <span className="portal-text-sm">Processing Queue</span>
                <span className="portal-text-sm portal-font-mono">247 events</span>
              </div>
              
              <div className="portal-flex portal-justify-between portal-items-center">
                <span className="portal-text-sm">Active Rules</span>
                <span className="portal-text-sm portal-font-mono">156 rules</span>
              </div>
              
              <div className="portal-flex portal-justify-between portal-items-center">
                <span className="portal-text-sm">Memory Usage</span>
                <span className="portal-text-sm portal-font-mono">68.4%</span>
              </div>
              
              <div className="portal-flex portal-justify-between portal-items-center">
                <span className="portal-text-sm">CPU Usage</span>
                <span className="portal-text-sm portal-font-mono">42.1%</span>
              </div>
            </div>

            <div className="portal-mt-4 portal-pt-4 portal-border-t">
              <div className="portal-flex portal-items-center portal-gap-2 portal-mb-2">
                <CheckCircle size={16} className="portal-text-success" />
                <span className="portal-text-sm portal-font-medium">Engine Healthy</span>
              </div>
              <div className="portal-text-xs portal-text-secondary">
                Last restart: 2 days ago
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Source Systems Health */}
      <div className="portal-bg-surface portal-rounded-lg portal-p-6">
        <h2 className="portal-text-xl portal-font-semibold portal-mb-6">Source Systems Health</h2>
        
        <div className="portal-grid portal-grid-cols-1 portal-md:portal-grid-cols-2 portal-lg:portal-grid-cols-3 portal-gap-6">
          {sourceSystems.map((system, index) => (
            <motion.div
              key={system.name}
              className="portal-source-card portal-border portal-rounded-lg portal-p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              <div className="portal-flex portal-justify-between portal-items-start portal-mb-3">
                <h3 className="portal-font-medium">{system.name}</h3>
                <div className={`portal-status-indicator ${system.status}`}>
                  <div className={`portal-w-2 portal-h-2 portal-rounded-full ${getStatusColor(system.status).replace('text', 'bg')}`}></div>
                </div>
              </div>
              
              <div className="portal-space-y-2 portal-text-sm">
                <div className="portal-flex portal-justify-between">
                  <span className="portal-text-secondary">Events/hour:</span>
                  <span className="portal-font-mono">{system.events.toLocaleString()}</span>
                </div>
                <div className="portal-flex portal-justify-between">
                  <span className="portal-text-secondary">Latency:</span>
                  <span className="portal-font-mono">{system.latency}</span>
                </div>
                <div className="portal-flex portal-justify-between">
                  <span className="portal-text-secondary">Status:</span>
                  <span className={`portal-font-medium ${getStatusColor(system.status)}`}>
                    {system.status.charAt(0).toUpperCase() + system.status.slice(1)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ILECG;
