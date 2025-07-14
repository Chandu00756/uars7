import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  Target,
  Activity,
  TrendingUp,
  Settings,
  Play,
  Pause,
  RefreshCw,
  Filter,
  Download,
  Upload,
  Eye,
  Lock,
  Unlock,
  Zap,
  Globe,
  Server,
  Database,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Plus
} from 'lucide-react';

// Fixed type definitions
interface ThreatDetails {
  type: string;
  sourceIP: string;
  confidence: number;
  sector: string;
  attackVector: string;
  riskScore: number;
  timestamp?: number;
}

interface ThreatEvent {
  id: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  source: string;
  target: string;
  description: string;
  status: 'active' | 'mitigated' | 'investigating' | 'resolved';
  confidence: number;
  riskScore: number;
  metadata: Record<string, any>;
}

interface SecurityRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
  createdAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
}

interface RuleCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'regex';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

interface RuleAction {
  type: 'block' | 'alert' | 'log' | 'quarantine' | 'notify';
  parameters: Record<string, any>;
}

interface AttackVector {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  count: number;
}

interface ThreatIntelligence {
  id: string;
  source: string;
  description: string;
  reliability: 'low' | 'medium' | 'high';
  lastUpdated: Date;
  indicators: number;
}

interface CADSData {
  attacksBlocked: number;
  activeThreats: ThreatEvent[];
  defenseRules: SecurityRule[];
  threatIntelligence: ThreatIntelligence[];
  attackVectors: AttackVector[];
  mitigationStrategies: any[];
}

const CADS: React.FC = () => {
  const [data, setData] = useState<CADSData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'threats' | 'rules' | 'intelligence' | 'analytics'>('overview');
  const [selectedThreat, setSelectedThreat] = useState<ThreatEvent | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [isConnected, setIsConnected] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    const mockData: CADSData = {
      attacksBlocked: 1247,
      activeThreats: [
        {
          id: 'threat-001',
          timestamp: new Date(),
          severity: 'high',
          type: 'SQL Injection',
          source: '192.168.1.100',
          target: 'web-server-01',
          description: 'Attempted SQL injection attack detected',
          status: 'active',
          confidence: 95,
          riskScore: 85,
          metadata: { userAgent: 'malicious-bot', attempts: 5 }
        },
        {
          id: 'threat-002',
          timestamp: new Date(),
          severity: 'critical',
          type: 'DDoS Attack',
          source: 'multiple',
          target: 'load-balancer',
          description: 'Distributed denial of service attack in progress',
          status: 'investigating',
          confidence: 98,
          riskScore: 95,
          metadata: { requestsPerSecond: 10000, sources: 150 }
        }
      ],
      defenseRules: [
        {
          id: 'rule-001',
          name: 'SQL Injection Prevention',
          description: 'Blocks common SQL injection patterns',
          enabled: true,
          priority: 1,
          conditions: [
            { field: 'request.body', operator: 'contains', value: 'UNION SELECT' },
            { field: 'request.body', operator: 'contains', value: 'DROP TABLE' }
          ],
          actions: [
            { type: 'block', parameters: { response: '403 Forbidden' } }
          ],
          createdAt: new Date(),
          triggerCount: 156
        }
      ],
      threatIntelligence: [
        {
          id: 'intel-001',
          source: 'MISP Feed',
          description: 'Malware indicators from global threat intelligence',
          reliability: 'high',
          lastUpdated: new Date(),
          indicators: 1250
        }
      ],
      attackVectors: [
        {
          id: 'vector-001',
          name: 'Web Application Attacks',
          description: 'Attacks targeting web applications',
          severity: 'high',
          count: 245
        },
        {
          id: 'vector-002',
          name: 'Network Intrusion',
          description: 'Network-based intrusion attempts',
          severity: 'medium',
          count: 89
        }
      ],
      mitigationStrategies: []
    };

    setData(mockData);
    setLoading(false);
  }, []);

  const loadCADSData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoading(false);
    } catch (error) {
      console.error('Failed to load CADS data:', error);
      setLoading(false);
    }
  };

  const handleThreatAction = async (threatId: string, action: 'block' | 'investigate' | 'dismiss') => {
    try {
      console.log(`Handling threat ${threatId} with action: ${action}`);
      await loadCADSData();
    } catch (error) {
      console.error('Failed to handle threat:', error);
    }
  };

  const handleRuleToggle = async (ruleId: string, enabled: boolean) => {
    try {
      console.log(`Toggling rule ${ruleId} to ${enabled}`);
      await loadCADSData();
    } catch (error) {
      console.error('Failed to update rule:', error);
    }
  };

  const exportThreatData = async () => {
    try {
      const dataStr = JSON.stringify(data?.activeThreats || [], null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cads-threats-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  if (loading) {
    return (
      <div className="portal-flex portal-items-center portal-justify-center portal-h-96">
        <div className="portal-animate-spin portal-rounded-full portal-h-32 portal-w-32 portal-border-b-2 portal-border-accent"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="portal-cads-dashboard portal-space-y-6"
    >
      {/* Header */}
      <div className="portal-flex portal-justify-between portal-items-center">
        <div>
          <h1 className="portal-text-3xl portal-font-bold portal-flex portal-items-center portal-gap-3">
            <Shield className="portal-text-accent" size={32} />
            Cyber Attack Defense System
          </h1>
          <p className="portal-text-secondary portal-mt-2">
            Real-time threat detection, analysis, and automated defense mechanisms
          </p>
        </div>
        
        <div className="portal-flex portal-items-center portal-gap-4">
          <div className="portal-flex portal-items-center portal-gap-2">
            <div className={`portal-w-3 portal-h-3 portal-rounded-full ${isConnected ? 'portal-bg-success' : 'portal-bg-error'} portal-animate-pulse`}></div>
            <span className="portal-text-sm portal-text-secondary">
              {isConnected ? 'Connected' : 'Disconnected'}
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
            onClick={loadCADSData}
            className="portal-btn portal-btn-secondary portal-btn-sm"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          
          <button
            onClick={exportThreatData}
            className="portal-btn portal-btn-secondary portal-btn-sm"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="portal-grid portal-grid-cols-1 portal-md:portal-grid-cols-2 portal-lg:portal-grid-cols-4 portal-gap-6">
        <motion.div
          className="portal-bg-surface portal-rounded-xl portal-p-6 portal-border portal-border-success/20"
          whileHover={{ scale: 1.02 }}
        >
          <div className="portal-flex portal-items-center portal-justify-between portal-mb-4">
            <div className="portal-p-3 portal-bg-success/10 portal-rounded-lg">
              <Shield className="portal-text-success" size={24} />
            </div>
            <span className="portal-text-2xl portal-font-bold portal-text-success">
              {data?.attacksBlocked.toLocaleString() || 0}
            </span>
          </div>
          <h3 className="portal-font-semibold portal-mb-2">Attacks Blocked</h3>
          <p className="portal-text-sm portal-text-secondary">Last 24 hours</p>
        </motion.div>

        <motion.div
          className="portal-bg-surface portal-rounded-xl portal-p-6 portal-border portal-border-warning/20"
          whileHover={{ scale: 1.02 }}
        >
          <div className="portal-flex portal-items-center portal-justify-between portal-mb-4">
            <div className="portal-p-3 portal-bg-warning/10 portal-rounded-lg">
              <AlertTriangle className="portal-text-warning" size={24} />
            </div>
            <span className="portal-text-2xl portal-font-bold portal-text-warning">
              {data?.activeThreats.filter(t => t.status === 'active').length || 0}
            </span>
          </div>
          <h3 className="portal-font-semibold portal-mb-2">Active Threats</h3>
          <p className="portal-text-sm portal-text-secondary">Requiring attention</p>
        </motion.div>

        <motion.div
          className="portal-bg-surface portal-rounded-xl portal-p-6 portal-border portal-border-accent/20"
          whileHover={{ scale: 1.02 }}
        >
          <div className="portal-flex portal-items-center portal-justify-between portal-mb-4">
            <div className="portal-p-3 portal-bg-accent/10 portal-rounded-lg">
              <Settings className="portal-text-accent" size={24} />
            </div>
            <span className="portal-text-2xl portal-font-bold portal-text-accent">
              {data?.defenseRules.filter(r => r.enabled).length || 0}
            </span>
          </div>
          <h3 className="portal-font-semibold portal-mb-2">Active Rules</h3>
          <p className="portal-text-sm portal-text-secondary">Defense policies</p>
        </motion.div>

        <motion.div
          className="portal-bg-surface portal-rounded-xl portal-p-6 portal-border portal-border-info/20"
          whileHover={{ scale: 1.02 }}
        >
          <div className="portal-flex portal-items-center portal-justify-between portal-mb-4">
            <div className="portal-p-3 portal-bg-info/10 portal-rounded-lg">
              <Activity className="portal-text-info" size={24} />
            </div>
            <span className="portal-text-2xl portal-font-bold portal-text-info">98.7%</span>
          </div>
          <h3 className="portal-font-semibold portal-mb-2">System Health</h3>
          <p className="portal-text-sm portal-text-secondary">All systems operational</p>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <div className="portal-border-b portal-border-secondary">
        <nav className="portal-flex portal-space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'threats', label: 'Threat Analysis', icon: AlertTriangle },
            { id: 'rules', label: 'Defense Rules', icon: Settings },
            { id: 'intelligence', label: 'Threat Intel', icon: Eye },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
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
              {/* Attack Vector Analysis */}
              <div className="portal-bg-surface portal-rounded-xl portal-p-6">
                <h3 className="portal-text-xl portal-font-semibold portal-mb-6">Attack Vector Analysis</h3>
                <div className="portal-grid portal-grid-cols-1 portal-lg:portal-grid-cols-2 portal-gap-6">
                  <div className="portal-space-y-4">
                    {data?.attackVectors.map((vector, index) => (
                      <div key={vector.id} className="portal-flex portal-items-center portal-justify-between portal-p-4 portal-bg-secondary/20 portal-rounded-lg">
                        <div className="portal-flex portal-items-center portal-gap-3">
                          <div className={`portal-w-3 portal-h-3 portal-rounded-full ${
                            vector.severity === 'high' ? 'portal-bg-error' :
                            vector.severity === 'medium' ? 'portal-bg-warning' :
                            'portal-bg-success'
                          }`}></div>
                          <div>
                            <h4 className="portal-font-medium">{vector.name}</h4>
                            <p className="portal-text-sm portal-text-secondary">{vector.description}</p>
                          </div>
                        </div>
                        <div className="portal-text-right">
                          <div className="portal-text-lg portal-font-bold">{vector.count}</div>
                          <div className="portal-text-sm portal-text-secondary">attempts</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="portal-bg-secondary/10 portal-rounded-lg portal-p-4">
                    <h4 className="portal-font-semibold portal-mb-4">Real-time Attack Map</h4>
                    <div className="portal-h-64 portal-bg-secondary/20 portal-rounded portal-flex portal-items-center portal-justify-center">
                      <Globe size={48} className="portal-text-secondary" />
                      <span className="portal-ml-4 portal-text-secondary">Interactive attack visualization</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Threats */}
              <div className="portal-bg-surface portal-rounded-xl portal-p-6">
                <div className="portal-flex portal-justify-between portal-items-center portal-mb-6">
                  <h3 className="portal-text-xl portal-font-semibold">Recent Threats</h3>
                  <div className="portal-flex portal-gap-2">
                    <select
                      value={filterSeverity}
                      onChange={(e) => setFilterSeverity(e.target.value)}
                      className="portal-px-3 portal-py-1 portal-rounded portal-border portal-bg-surface"
                    >
                      <option value="all">All Severities</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
                
                <div className="portal-space-y-3">
                  {data?.activeThreats
                    .filter(threat => filterSeverity === 'all' || threat.severity === filterSeverity)
                    .slice(0, 10)
                    .map(threat => (
                      <motion.div
                        key={threat.id}
                        className="portal-flex portal-items-center portal-justify-between portal-p-4 portal-border portal-rounded-lg hover:portal-bg-secondary/10 portal-cursor-pointer"
                        onClick={() => setSelectedThreat(threat)}
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="portal-flex portal-items-center portal-gap-4">
                          <div className={`portal-p-2 portal-rounded ${
                            threat.severity === 'critical' ? 'portal-bg-error/20 portal-text-error' :
                            threat.severity === 'high' ? 'portal-bg-warning/20 portal-text-warning' :
                            threat.severity === 'medium' ? 'portal-bg-info/20 portal-text-info' :
                            'portal-bg-success/20 portal-text-success'
                          }`}>
                            <AlertTriangle size={16} />
                          </div>
                          <div>
                            <h4 className="portal-font-medium">{threat.type}</h4>
                            <p className="portal-text-sm portal-text-secondary">
                              {threat.source} → {threat.target}
                            </p>
                          </div>
                        </div>
                        
                        <div className="portal-flex portal-items-center portal-gap-4">
                          <div className="portal-text-right">
                            <div className="portal-text-sm portal-font-medium">Risk: {threat.riskScore}/100</div>
                            <div className="portal-text-xs portal-text-secondary">
                              {new Date(threat.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                          
                          <div className="portal-flex portal-gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleThreatAction(threat.id, 'block');
                              }}
                              className="portal-btn portal-btn-sm portal-btn-error"
                            >
                              <Lock size={14} />
                              Block
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleThreatAction(threat.id, 'investigate');
                              }}
                              className="portal-btn portal-btn-sm portal-btn-secondary"
                            >
                              <Eye size={14} />
                              Investigate
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="portal-space-y-6">
              {/* Defense Rules Management */}
              <div className="portal-bg-surface portal-rounded-xl portal-p-6">
                <div className="portal-flex portal-justify-between portal-items-center portal-mb-6">
                  <h3 className="portal-text-xl portal-font-semibold">Defense Rules</h3>
                  <button className="portal-btn portal-btn-primary">
                    <Plus size={16} />
                    Create Rule
                  </button>
                </div>
                
                <div className="portal-space-y-4">
                  {data?.defenseRules.map(rule => (
                    <div key={rule.id} className="portal-border portal-rounded-lg portal-p-4">
                      <div className="portal-flex portal-items-center portal-justify-between portal-mb-3">
                        <div className="portal-flex portal-items-center portal-gap-3">
                          <button
                            onClick={() => handleRuleToggle(rule.id, !rule.enabled)}
                            className={`portal-w-10 portal-h-6 portal-rounded-full portal-relative portal-transition-colors ${
                              rule.enabled ? 'portal-bg-success' : 'portal-bg-secondary'
                            }`}
                          >
                            <div className={`portal-w-4 portal-h-4 portal-bg-white portal-rounded-full portal-absolute portal-top-1 portal-transition-transform ${
                              rule.enabled ? 'portal-translate-x-5' : 'portal-translate-x-1'
                            }`}></div>
                          </button>
                          <div>
                            <h4 className="portal-font-medium">{rule.name}</h4>
                            <p className="portal-text-sm portal-text-secondary">{rule.description}</p>
                          </div>
                        </div>
                        
                        <div className="portal-flex portal-items-center portal-gap-4">
                          <div className="portal-text-right">
                            <div className="portal-text-sm">Priority: {rule.priority}</div>
                            <div className="portal-text-xs portal-text-secondary">
                              Triggered {rule.triggerCount} times
                            </div>
                          </div>
                          <button className="portal-btn portal-btn-sm portal-btn-secondary">
                            <Settings size={14} />
                            Edit
                          </button>
                        </div>
                      </div>
                      
                      <div className="portal-flex portal-gap-2 portal-text-xs">
                        {rule.conditions.map((condition, index) => (
                          <span key={index} className="portal-px-2 portal-py-1 portal-bg-secondary/20 portal-rounded">
                            {condition.field} {condition.operator} {condition.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'intelligence' && (
            <div className="portal-space-y-6">
              {/* Threat Intelligence */}
              <div className="portal-grid portal-grid-cols-1 portal-lg:portal-grid-cols-2 portal-gap-6">
                <div className="portal-bg-surface portal-rounded-xl portal-p-6">
                  <h3 className="portal-text-xl portal-font-semibold portal-mb-6">Intelligence Feeds</h3>
                  <div className="portal-space-y-4">
                    {data?.threatIntelligence.map(intel => (
                      <div key={intel.id} className="portal-border portal-rounded-lg portal-p-4">
                        <div className="portal-flex portal-items-center portal-justify-between portal-mb-2">
                          <h4 className="portal-font-medium">{intel.source}</h4>
                          <span className={`portal-px-2 portal-py-1 portal-rounded portal-text-xs ${
                            intel.reliability === 'high' ? 'portal-bg-success/20 portal-text-success' :
                            intel.reliability === 'medium' ? 'portal-bg-warning/20 portal-text-warning' :
                            'portal-bg-error/20 portal-text-error'
                          }`}>
                            {intel.reliability} reliability
                          </span>
                        </div>
                        <p className="portal-text-sm portal-text-secondary portal-mb-3">{intel.description}</p>
                        <div className="portal-flex portal-justify-between portal-text-xs portal-text-secondary">
                          <span>Last updated: {new Date(intel.lastUpdated).toLocaleString()}</span>
                          <span>{intel.indicators} indicators</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="portal-bg-surface portal-rounded-xl portal-p-6">
                  <h3 className="portal-text-xl portal-font-semibold portal-mb-6">IOC Analysis</h3>
                  <div className="portal-h-96 portal-bg-secondary/10 portal-rounded-lg portal-flex portal-items-center portal-justify-center">
                    <Database size={48} className="portal-text-secondary" />
                    <span className="portal-ml-4 portal-text-secondary">Indicators of Compromise</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Threat Detail Modal */}
      <AnimatePresence>
        {selectedThreat && (
          <motion.div
            className="portal-fixed portal-inset-0 portal-bg-black/50 portal-backdrop-blur-sm portal-z-50 portal-flex portal-items-center portal-justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedThreat(null)}
          >
            <motion.div
              className="portal-bg-surface portal-rounded-xl portal-p-6 portal-max-w-2xl portal-w-full portal-mx-4 portal-max-h-[80vh] portal-overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="portal-flex portal-justify-between portal-items-start portal-mb-6">
                <h3 className="portal-text-xl portal-font-semibold">Threat Details</h3>
                <button
                  onClick={() => setSelectedThreat(null)}
                  className="portal-text-secondary hover:portal-text-primary"
                >
                  <XCircle size={24} />
                </button>
              </div>
              
              <div className="portal-space-y-4">
                <div className="portal-grid portal-grid-cols-2 portal-gap-4">
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Threat Type</label>
                    <p className="portal-font-semibold">{selectedThreat.type}</p>
                  </div>
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Severity</label>
                    <p className={`portal-font-semibold portal-capitalize ${
                      selectedThreat.severity === 'critical' ? 'portal-text-error' :
                      selectedThreat.severity === 'high' ? 'portal-text-warning' :
                      selectedThreat.severity === 'medium' ? 'portal-text-info' :
                      'portal-text-success'
                    }`}>
                      {selectedThreat.severity}
                    </p>
                  </div>
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Source</label>
                    <p className="portal-font-mono portal-text-sm">{selectedThreat.source}</p>
                  </div>
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Target</label>
                    <p className="portal-font-mono portal-text-sm">{selectedThreat.target}</p>
                  </div>
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Risk Score</label>
                    <p className="portal-font-semibold">{selectedThreat.riskScore}/100</p>
                  </div>
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Confidence</label>
                    <p className="portal-font-semibold">{selectedThreat.confidence}%</p>
                  </div>
                </div>
                
                <div>
                  <label className="portal-text-sm portal-font-medium portal-text-secondary">Description</label>
                  <p className="portal-mt-1">{selectedThreat.description}</p>
                </div>
                
                <div>
                  <label className="portal-text-sm portal-font-medium portal-text-secondary">Metadata</label>
                  <pre className="portal-mt-1 portal-p-3 portal-bg-secondary/10 portal-rounded portal-text-xs portal-overflow-x-auto">
                    {JSON.stringify(selectedThreat.metadata, null, 2)}
                  </pre>
                </div>
                
                <div className="portal-flex portal-gap-3 portal-pt-4">
                  <button
                    onClick={() => {
                      handleThreatAction(selectedThreat.id, 'block');
                      setSelectedThreat(null);
                    }}
                    className="portal-btn portal-btn-error"
                  >
                    <Lock size={16} />
                    Block Threat
                  </button>
                  <button
                    onClick={() => {
                      handleThreatAction(selectedThreat.id, 'investigate');
                      setSelectedThreat(null);
                    }}
                    className="portal-btn portal-btn-warning"
                  >
                    <Eye size={16} />
                    Investigate
                  </button>
                  <button
                    onClick={() => {
                      handleThreatAction(selectedThreat.id, 'dismiss');
                      setSelectedThreat(null);
                    }}
                    className="portal-btn portal-btn-secondary"
                  >
                    <CheckCircle size={16} />
                    Dismiss
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

export default CADS;
