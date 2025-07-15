import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Shield,
  Zap,
  Clock,
  Bell,
  BellOff,
  Filter,
  Search,
  Download,
  Archive,
  Trash2,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Users,
  Server,
  Database,
  Wifi,
  WifiOff,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Settings,
  BarChart3,
  AlertCircle,
  Info,
  HelpCircle
} from 'lucide-react';

interface Alert {
  id: string;
  timestamp: Date;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  type: 'security' | 'performance' | 'system' | 'network' | 'policy' | 'microcell';
  title: string;
  description: string;
  source: string;
  affectedResources: string[];
  correlationId?: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'suppressed';
  assignedTo?: string;
  resolvedAt?: Date;
  metadata: Record<string, any>;
  actions?: string[];
}

interface CorrelationGroup {
  id: string;
  alerts: Alert[];
  pattern: string;
  confidence: number;
  timeWindow: number;
  rootCause?: string;
}

interface AlertsProps {}

const Alerts: React.FC<AlertsProps> = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [correlations, setCorrelations] = useState<CorrelationGroup[]>([]);
  const [activeTab, setActiveTab] = useState<'stream' | 'correlations' | 'quiet' | 'analytics'>('stream');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    severity: 'all',
    type: 'all',
    status: 'active',
    timeRange: '24h'
  });
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [quietHours, setQuietHours] = useState({
    enabled: false,
    start: '22:00',
    end: '06:00',
    severityThreshold: 'high'
  });

  useEffect(() => {
    const loadAlerts = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockAlerts: Alert[] = [
          {
            id: 'alert-001',
            timestamp: new Date(Date.now() - 300000),
            severity: 'critical',
            type: 'security',
            title: 'Suspicious Microcell Spawning Pattern',
            description: 'Detected unusual burst of microcell spawn requests from single source IP',
            source: '192.168.1.100',
            affectedResources: ['microcell-pool-1', 'auth-gateway'],
            correlationId: 'corr-001',
            status: 'active',
            metadata: {
              requestCount: 156,
              timeWindow: '5m',
              threshold: 50
            },
            actions: ['Block IP', 'Escalate to SOC', 'Create Policy Rule']
          },
          {
            id: 'alert-002',
            timestamp: new Date(Date.now() - 600000),
            severity: 'high',
            type: 'performance',
            title: 'Memory Pool Exhaustion Warning',
            description: 'WebAssembly memory pool utilization exceeded 85% threshold',
            source: 'wasm-pool-manager',
            affectedResources: ['wasm-pool-main'],
            status: 'acknowledged',
            assignedTo: 'ops-team',
            metadata: {
              currentUtilization: 87.3,
              threshold: 85,
              availableMemory: '512MB'
            },
            actions: ['Scale Pool', 'Cull Low-Priority Cells', 'Alert DevOps']
          },
          {
            id: 'alert-003',
            timestamp: new Date(Date.now() - 900000),
            severity: 'medium',
            type: 'system',
            title: 'Microcell Timeout Increase',
            description: 'Average microcell response time increased by 45% over baseline',
            source: 'monitoring-agent',
            affectedResources: ['microcell-cluster-a'],
            status: 'active',
            metadata: {
              currentAvg: 145,
              baseline: 100,
              increase: 45
            }
          },
          {
            id: 'alert-004',
            timestamp: new Date(Date.now() - 1200000),
            severity: 'low',
            type: 'policy',
            title: 'Policy Rollout Completed',
            description: 'Security policy update v2.1.3 successfully deployed to all nodes',
            source: 'policy-engine',
            affectedResources: ['all-nodes'],
            status: 'resolved',
            resolvedAt: new Date(Date.now() - 300000),
            metadata: {
              policyVersion: 'v2.1.3',
              nodesUpdated: 24,
              rolloutDuration: '15m'
            }
          },
          {
            id: 'alert-005',
            timestamp: new Date(Date.now() - 1800000),
            severity: 'critical',
            type: 'network',
            title: 'Intent Token Validation Failures',
            description: 'High rate of invalid intent token rejections from mobile clients',
            source: 'auth-validator',
            affectedResources: ['token-validator', 'mobile-gateway'],
            correlationId: 'corr-001',
            status: 'active',
            metadata: {
              failureRate: 23.5,
              threshold: 5,
              affectedUsers: 45
            },
            actions: ['Check Token Service', 'Validate Mobile App', 'Review Policies']
          }
        ];

        setAlerts(mockAlerts);

        // Mock correlations
        const mockCorrelations: CorrelationGroup[] = [
          {
            id: 'corr-001',
            alerts: mockAlerts.filter(a => a.correlationId === 'corr-001'),
            pattern: 'Authentication anomaly pattern',
            confidence: 0.89,
            timeWindow: 1800, // 30 minutes
            rootCause: 'Potential coordinated attack on authentication system'
          }
        ];

        setCorrelations(mockCorrelations);
      } catch (error) {
        console.error('Failed to load alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();

    // Simulate real-time alerts
    if (realTimeEnabled) {
      const interval = setInterval(() => {
        if (Math.random() < 0.1) { // 10% chance every 5 seconds
          const newAlert: Alert = {
            id: `alert-${Date.now()}`,
            timestamp: new Date(),
            severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
            type: ['security', 'performance', 'system', 'network'][Math.floor(Math.random() * 4)] as any,
            title: 'Real-time Alert Simulation',
            description: 'This is a simulated real-time alert for demonstration',
            source: 'real-time-simulator',
            affectedResources: ['demo-resource'],
            status: 'active',
            metadata: {}
          };

          setAlerts(prev => [newAlert, ...prev.slice(0, 49)]); // Keep last 50 alerts
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [realTimeEnabled]);

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-400 border-red-400 bg-red-400/20';
      case 'high': return 'text-orange-400 border-orange-400 bg-orange-400/20';
      case 'medium': return 'text-yellow-400 border-yellow-400 bg-yellow-400/20';
      case 'low': return 'text-blue-400 border-blue-400 bg-blue-400/20';
      case 'info': return 'text-cyan-400 border-cyan-400 bg-cyan-400/20';
      default: return 'text-gray-400 border-gray-400 bg-gray-400/20';
    }
  };

  const getSeverityIcon = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical': return <AlertTriangle size={14} />;
      case 'high': return <AlertCircle size={14} />;
      case 'medium': return <AlertTriangle size={14} />;
      case 'low': return <Info size={14} />;
      case 'info': return <HelpCircle size={14} />;
      default: return <AlertTriangle size={14} />;
    }
  };

  const getTypeIcon = (type: Alert['type']) => {
    switch (type) {
      case 'security': return <Shield size={16} />;
      case 'performance': return <Activity size={16} />;
      case 'system': return <Server size={16} />;
      case 'network': return <Wifi size={16} />;
      case 'policy': return <Target size={16} />;
      case 'microcell': return <Zap size={16} />;
      default: return <AlertTriangle size={16} />;
    }
  };

  const getStatusColor = (status: Alert['status']) => {
    switch (status) {
      case 'active': return 'text-red-400 border-red-400 bg-red-400/10';
      case 'acknowledged': return 'text-yellow-400 border-yellow-400 bg-yellow-400/10';
      case 'resolved': return 'text-green-400 border-green-400 bg-green-400/10';
      case 'suppressed': return 'text-gray-400 border-gray-400 bg-gray-400/10';
      default: return 'text-gray-400 border-gray-400 bg-gray-400/10';
    }
  };

  const updateAlertStatus = (alertId: string, status: Alert['status']) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId 
        ? { 
            ...alert, 
            status, 
            resolvedAt: status === 'resolved' ? new Date() : undefined,
            assignedTo: status === 'acknowledged' ? 'current-user' : alert.assignedTo
          }
        : alert
    ));
  };

  const bulkUpdateAlerts = (alertIds: string[], status: Alert['status']) => {
    setAlerts(prev => prev.map(alert =>
      alertIds.includes(alert.id)
        ? { 
            ...alert, 
            status, 
            resolvedAt: status === 'resolved' ? new Date() : undefined,
            assignedTo: status === 'acknowledged' ? 'current-user' : alert.assignedTo
          }
        : alert
    ));
    setSelectedAlerts(new Set());
  };

  const toggleAlertSelection = (alertId: string) => {
    const newSelection = new Set(selectedAlerts);
    if (newSelection.has(alertId)) {
      newSelection.delete(alertId);
    } else {
      newSelection.add(alertId);
    }
    setSelectedAlerts(newSelection);
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filters.severity !== 'all' && alert.severity !== filters.severity) return false;
    if (filters.type !== 'all' && alert.type !== filters.type) return false;
    if (filters.status !== 'all' && alert.status !== filters.status) return false;
    
    const hoursAgo = parseInt(filters.timeRange.replace('h', ''));
    const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    if (alert.timestamp < cutoff) return false;
    
    return true;
  });

  const alertStats = {
    total: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length
  };

  if (loading) {
    return (
      <div className="cads-content-wrapper">
        <div className="flex items-center justify-center h-64">
          <div className="cads-loading"></div>
          <span className="ml-3 text-white/70">Loading Alert Stream...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="cads-content-wrapper cads-fade-in">
      {/* Tab Navigation */}
      <div className="cads-nav-tabs">
        <div className="cads-nav-list">
          {[
            { id: 'stream', label: 'Alert Stream', icon: Activity },
            { id: 'correlations', label: 'Correlations', icon: BarChart3 },
            { id: 'quiet', label: 'Quiet Hours', icon: BellOff },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`cads-nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
            className={`cads-action-button ${realTimeEnabled ? 'bg-green-500/20 border-green-500/50' : 'bg-gray-500/20 border-gray-500/50'}`}
          >
            {realTimeEnabled ? <Play size={16} /> : <Pause size={16} />}
            Real-time {realTimeEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Alert Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="cads-kpi-card">
          <div className="cads-kpi-icon bg-blue-500/20">
            <Activity size={24} className="text-blue-400" />
          </div>
          <div className="cads-kpi-content">
            <div className="cads-kpi-value">{alertStats.total}</div>
            <div className="cads-kpi-label">Total Alerts</div>
          </div>
        </div>

        <div className="cads-kpi-card">
          <div className="cads-kpi-icon bg-red-500/20">
            <AlertTriangle size={24} className="text-red-400" />
          </div>
          <div className="cads-kpi-content">
            <div className="cads-kpi-value">{alertStats.active}</div>
            <div className="cads-kpi-label">Active</div>
          </div>
        </div>

        <div className="cads-kpi-card">
          <div className="cads-kpi-icon bg-red-500/20">
            <AlertCircle size={24} className="text-red-400" />
          </div>
          <div className="cads-kpi-content">
            <div className="cads-kpi-value">{alertStats.critical}</div>
            <div className="cads-kpi-label">Critical</div>
          </div>
        </div>

        <div className="cads-kpi-card">
          <div className="cads-kpi-icon bg-yellow-500/20">
            <CheckCircle size={24} className="text-yellow-400" />
          </div>
          <div className="cads-kpi-content">
            <div className="cads-kpi-value">{alertStats.acknowledged}</div>
            <div className="cads-kpi-label">Acknowledged</div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'stream' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4 p-4 bg-black/20 rounded border border-white/10">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Severity:</label>
                  <select
                    value={filters.severity}
                    onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                    className="cads-form-select text-sm"
                    title="Filter by Severity"
                  >
                    <option value="all">All</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                    <option value="info">Info</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Type:</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="cads-form-select text-sm"
                    title="Filter by Type"
                  >
                    <option value="all">All</option>
                    <option value="security">Security</option>
                    <option value="performance">Performance</option>
                    <option value="system">System</option>
                    <option value="network">Network</option>
                    <option value="policy">Policy</option>
                    <option value="microcell">Microcell</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Status:</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="cads-form-select text-sm"
                    title="Filter by Status"
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="resolved">Resolved</option>
                    <option value="suppressed">Suppressed</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Time:</label>
                  <select
                    value={filters.timeRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
                    className="cads-form-select text-sm"
                    title="Filter by Time Range"
                  >
                    <option value="1h">Last Hour</option>
                    <option value="6h">Last 6 Hours</option>
                    <option value="24h">Last 24 Hours</option>
                    <option value="168h">Last Week</option>
                  </select>
                </div>

                {selectedAlerts.size > 0 && (
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={() => bulkUpdateAlerts(Array.from(selectedAlerts), 'acknowledged')}
                      className="cads-action-button text-sm"
                    >
                      <CheckCircle size={14} />
                      Acknowledge ({selectedAlerts.size})
                    </button>
                    <button
                      onClick={() => bulkUpdateAlerts(Array.from(selectedAlerts), 'resolved')}
                      className="cads-action-button text-sm"
                    >
                      <XCircle size={14} />
                      Resolve ({selectedAlerts.size})
                    </button>
                  </div>
                )}
              </div>

              {/* Alert List */}
              <div className="space-y-3">
                {filteredAlerts.map(alert => (
                  <motion.div
                    key={alert.id}
                    className="cads-kpi-card"
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedAlerts.has(alert.id)}
                        onChange={() => toggleAlertSelection(alert.id)}
                        className="mt-1 rounded"
                        title={`Select ${alert.title}`}
                      />

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className={`cads-status-badge ${getSeverityColor(alert.severity)}`}>
                              {getSeverityIcon(alert.severity)}
                              {alert.severity.toUpperCase()}
                            </span>
                            <span className="flex items-center gap-1 text-sm text-white/60">
                              {getTypeIcon(alert.type)}
                              {alert.type}
                            </span>
                            <span className={`cads-status-badge text-xs ${getStatusColor(alert.status)}`}>
                              {alert.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-sm text-white/60">
                            {alert.timestamp.toLocaleTimeString()}
                          </div>
                        </div>

                        <h4 className="text-lg font-semibold mb-1">{alert.title}</h4>
                        <p className="text-white/80 mb-3">{alert.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-3">
                          <div>
                            <div className="text-white/60">Source</div>
                            <div className="font-mono">{alert.source}</div>
                          </div>
                          <div>
                            <div className="text-white/60">Affected Resources</div>
                            <div className="font-mono">{alert.affectedResources.join(', ')}</div>
                          </div>
                          {alert.assignedTo && (
                            <div>
                              <div className="text-white/60">Assigned To</div>
                              <div>{alert.assignedTo}</div>
                            </div>
                          )}
                        </div>

                        {alert.actions && alert.actions.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {alert.actions.map((action, idx) => (
                              <button
                                key={idx}
                                className="px-3 py-1 text-xs bg-cyan-500/20 border border-cyan-500/30 rounded text-cyan-400 hover:bg-cyan-500/30"
                              >
                                {action}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        {alert.status === 'active' && (
                          <>
                            <button
                              onClick={() => updateAlertStatus(alert.id, 'acknowledged')}
                              className="cads-action-button text-sm"
                            >
                              <CheckCircle size={14} />
                              Ack
                            </button>
                            <button
                              onClick={() => updateAlertStatus(alert.id, 'resolved')}
                              className="cads-action-button text-sm"
                            >
                              <XCircle size={14} />
                              Resolve
                            </button>
                          </>
                        )}
                        {alert.status === 'acknowledged' && (
                          <button
                            onClick={() => updateAlertStatus(alert.id, 'resolved')}
                            className="cads-action-button text-sm"
                          >
                            <XCircle size={14} />
                            Resolve
                          </button>
                        )}
                        <button className="cads-action-button text-sm">
                          <Archive size={14} />
                          Archive
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {filteredAlerts.length === 0 && (
                  <div className="text-center py-12 text-white/60">
                    <CheckCircle size={48} className="mx-auto mb-4 text-green-400" />
                    <p>No alerts match the current filters</p>
                    <p className="text-sm mt-2">Try adjusting your filter criteria</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'correlations' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold">Alert Correlations ({correlations.length})</h3>

              <div className="space-y-4">
                {correlations.map(correlation => (
                  <motion.div
                    key={correlation.id}
                    className="cads-kpi-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold">{correlation.pattern}</h4>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-white/60">
                            Confidence: <span className="text-green-400 font-semibold">{(correlation.confidence * 100).toFixed(0)}%</span>
                          </span>
                          <span className="text-sm text-white/60">
                            Window: {Math.floor(correlation.timeWindow / 60)}m
                          </span>
                        </div>
                      </div>

                      {correlation.rootCause && (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                          <div className="flex items-start gap-2">
                            <Target size={16} className="text-yellow-400 mt-0.5" />
                            <div className="text-sm">
                              <div className="font-semibold text-yellow-400">Probable Root Cause</div>
                              <div className="text-white/80">{correlation.rootCause}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <h5 className="font-semibold">Correlated Alerts ({correlation.alerts.length})</h5>
                        {correlation.alerts.map(alert => (
                          <div key={alert.id} className="flex items-center justify-between p-3 bg-black/20 rounded border border-white/10">
                            <div className="flex items-center gap-3">
                              <span className={`cads-status-badge ${getSeverityColor(alert.severity)} text-xs`}>
                                {getSeverityIcon(alert.severity)}
                                {alert.severity}
                              </span>
                              <span>{alert.title}</span>
                            </div>
                            <div className="text-sm text-white/60">
                              {alert.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {correlations.length === 0 && (
                  <div className="text-center py-12 text-white/60">
                    <BarChart3 size={48} className="mx-auto mb-4" />
                    <p>No alert correlations detected</p>
                    <p className="text-sm mt-2">Correlations will appear when related alerts are identified</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'quiet' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold">Quiet Hours Configuration</h3>

              <div className="cads-chart-container">
                <h4 className="cads-chart-title">Quiet Hours Settings</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={quietHours.enabled}
                      onChange={(e) => setQuietHours(prev => ({ ...prev, enabled: e.target.checked }))}
                      className="rounded"
                      id="quietHoursEnabled"
                    />
                    <label htmlFor="quietHoursEnabled" className="font-medium">Enable Quiet Hours</label>
                  </div>

                  {quietHours.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="cads-form-group">
                        <label className="cads-form-label">Start Time</label>
                        <input
                          type="time"
                          value={quietHours.start}
                          onChange={(e) => setQuietHours(prev => ({ ...prev, start: e.target.value }))}
                          className="cads-form-input"
                          aria-label="Quiet hours start time"
                        />
                      </div>

                      <div className="cads-form-group">
                        <label className="cads-form-label">End Time</label>
                        <input
                          type="time"
                          value={quietHours.end}
                          onChange={(e) => setQuietHours(prev => ({ ...prev, end: e.target.value }))}
                          className="cads-form-input"
                          aria-label="Quiet hours end time"
                        />
                      </div>

                      <div className="cads-form-group">
                        <label className="cads-form-label">Minimum Severity</label>
                        <select
                          value={quietHours.severityThreshold}
                          onChange={(e) => setQuietHours(prev => ({ ...prev, severityThreshold: e.target.value }))}
                          className="cads-form-select"
                          title="Minimum severity level to alert during quiet hours"
                        >
                          <option value="critical">Critical Only</option>
                          <option value="high">High & Critical</option>
                          <option value="medium">Medium & Above</option>
                          <option value="low">All Severities</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded">
                    <div className="flex items-start gap-2">
                      <Info size={16} className="text-blue-400 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-semibold text-blue-400">Quiet Hours Behavior</div>
                        <div className="text-white/80 mt-1">
                          During quiet hours, only alerts meeting the minimum severity threshold will trigger 
                          notifications. All alerts will still be logged and visible in the alert stream.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="cads-chart-container">
                <h4 className="cads-chart-title">Notification Preferences</h4>
                <div className="space-y-3">
                  {[
                    { type: 'email', label: 'Email Notifications', enabled: true },
                    { type: 'slack', label: 'Slack Integration', enabled: false },
                    { type: 'webhook', label: 'Webhook Alerts', enabled: true },
                    { type: 'sms', label: 'SMS (Critical Only)', enabled: false }
                  ].map(pref => (
                    <div key={pref.type} className="flex items-center justify-between p-3 bg-black/20 rounded border border-white/10">
                      <span>{pref.label}</span>
                      <button
                        className={`cads-action-button text-sm ${
                          pref.enabled ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-gray-500/20 border-gray-500/50'
                        }`}
                      >
                        {pref.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold">Alert Analytics</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="cads-chart-container">
                  <h4 className="cads-chart-title">Alerts by Severity (24h)</h4>
                  <div className="space-y-3">
                    {['critical', 'high', 'medium', 'low', 'info'].map(severity => {
                      const count = alerts.filter(a => a.severity === severity).length;
                      const percentage = alerts.length > 0 ? (count / alerts.length) * 100 : 0;
                      
                      return (
                        <div key={severity} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded ${getSeverityColor(severity as any).split(' ')[0]} ${getSeverityColor(severity as any).split(' ')[2]}`}></div>
                            <span className="capitalize">{severity}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-white/10 rounded overflow-hidden">
                              <div 
                                className={`h-full ${getSeverityColor(severity as any).split(' ')[2]}`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-mono w-8">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="cads-chart-container">
                  <h4 className="cads-chart-title">Alerts by Type (24h)</h4>
                  <div className="space-y-3">
                    {['security', 'performance', 'system', 'network', 'policy', 'microcell'].map(type => {
                      const count = alerts.filter(a => a.type === type).length;
                      const percentage = alerts.length > 0 ? (count / alerts.length) * 100 : 0;
                      
                      return (
                        <div key={type} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(type as any)}
                            <span className="capitalize">{type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-white/10 rounded overflow-hidden">
                              <div 
                                className="h-full bg-cyan-400/50"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-mono w-8">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="cads-chart-container">
                <h4 className="cads-chart-title">Alert Resolution Metrics</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {alerts.filter(a => a.status === 'resolved').length}
                    </div>
                    <div className="text-sm text-white/60">Resolved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {alerts.filter(a => a.status === 'acknowledged').length}
                    </div>
                    <div className="text-sm text-white/60">Acknowledged</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">
                      {alerts.filter(a => a.status === 'active').length}
                    </div>
                    <div className="text-sm text-white/60">Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {alerts.length > 0 ? Math.round((alerts.filter(a => a.status === 'resolved').length / alerts.length) * 100) : 0}%
                    </div>
                    <div className="text-sm text-white/60">Resolution Rate</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Alerts;
