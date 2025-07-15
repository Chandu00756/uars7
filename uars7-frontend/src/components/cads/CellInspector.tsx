import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Activity,
  Clock,
  Database,
  Shield,
  Eye,
  BarChart3,
  FileText,
  Terminal,
  Download,
  Pause,
  Play,
  Copy,
  Archive,
  AlertTriangle,
  CheckCircle,
  Info,
  TrendingUp,
  Cpu,
  MemoryStick,
  HardDrive,
  Zap,
  Key
} from 'lucide-react';

interface CellDetails {
  id: string;
  intentToken: string;
  ttl: number;
  user: string;
  devicePosture: {
    trusted: boolean;
    compliance: number;
    lastVerification: Date;
  };
  spawnTime: Date;
  runtime: number;
  status: 'running' | 'completed' | 'quarantined' | 'error';
  memory: {
    heap: number;
    stack: number;
    total: number;
    limit: number;
  };
  metrics: {
    gasCounter: number;
    execTime: number;
    syscalls: number;
    ioOperations: number;
  };
  riskScore: number;
  genomeScore: {
    fitness: number;
    latency: number;
    resource: number;
    security: number;
  };
  ledgerReceipt: {
    hash: string;
    blockNumber: number;
    timestamp: Date;
  };
  logs: Array<{
    timestamp: Date;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    source: string;
  }>;
  policyTrace: Array<{
    rule: string;
    verdict: 'allow' | 'deny' | 'audit';
    timestamp: Date;
    details: string;
  }>;
}

interface CellInspectorProps {
  cellId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const CellInspector: React.FC<CellInspectorProps> = ({ cellId, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'trace' | 'logs' | 'metrics' | 'genome' | 'ledger' | 'actions'>('summary');
  const [cellDetails, setCellDetails] = useState<CellDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [logsPaused, setLogsPaused] = useState(false);
  const [logsFilter, setLogsFilter] = useState('');

  useEffect(() => {
    if (cellId && isOpen) {
      loadCellDetails(cellId);
    }
  }, [cellId, isOpen]);

  const loadCellDetails = async (id: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockDetails: CellDetails = {
        id,
        intentToken: 'it_3a7b9c2d1e4f5g6h7i8j9k0l',
        ttl: 3600,
        user: 'analyst@portalvii.com',
        devicePosture: {
          trusted: true,
          compliance: 94.2,
          lastVerification: new Date(Date.now() - 300000)
        },
        spawnTime: new Date(Date.now() - 45000),
        runtime: 45,
        status: 'running',
        memory: {
          heap: 64,
          stack: 8,
          total: 72,
          limit: 128
        },
        metrics: {
          gasCounter: 1247,
          execTime: 156,
          syscalls: 89,
          ioOperations: 23
        },
        riskScore: 23.5,
        genomeScore: {
          fitness: 0.89,
          latency: 0.92,
          resource: 0.85,
          security: 0.91
        },
        ledgerReceipt: {
          hash: '0x3a7b9c2d1e4f5g6h7i8j9k0l1m2n3o4p',
          blockNumber: 12847,
          timestamp: new Date(Date.now() - 30000)
        },
        logs: [
          {
            timestamp: new Date(Date.now() - 5000),
            level: 'info',
            message: 'Intent validation completed successfully',
            source: 'policy-engine'
          },
          {
            timestamp: new Date(Date.now() - 15000),
            level: 'debug',
            message: 'Memory allocation: 64MB heap, 8MB stack',
            source: 'wasm-runtime'
          },
          {
            timestamp: new Date(Date.now() - 25000),
            level: 'info',
            message: 'Cell spawned with intent token: it_3a7b9c2d1e4f5g6h7i8j9k0l',
            source: 'cell-manager'
          },
          {
            timestamp: new Date(Date.now() - 35000),
            level: 'info',
            message: 'Device posture verification passed (94.2% compliance)',
            source: 'auth-validator'
          }
        ],
        policyTrace: [
          {
            rule: 'intent.user.role == "analyst"',
            verdict: 'allow',
            timestamp: new Date(Date.now() - 44000),
            details: 'User role verification passed'
          },
          {
            rule: 'device.compliance >= 90',
            verdict: 'allow',
            timestamp: new Date(Date.now() - 43000),
            details: 'Device compliance score: 94.2%'
          },
          {
            rule: 'resource.memory <= 256MB',
            verdict: 'allow',
            timestamp: new Date(Date.now() - 42000),
            details: 'Requested memory: 72MB (within limit)'
          },
          {
            rule: 'security.risk_score < 50',
            verdict: 'allow',
            timestamp: new Date(Date.now() - 41000),
            details: 'Risk score: 23.5 (acceptable)'
          }
        ]
      };

      setCellDetails(mockDetails);
    } catch (error) {
      console.error('Failed to load cell details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: CellDetails['status']) => {
    switch (status) {
      case 'running': return 'text-green-400 bg-green-400/20 border-green-400/50';
      case 'completed': return 'text-blue-400 bg-blue-400/20 border-blue-400/50';
      case 'quarantined': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/50';
      case 'error': return 'text-red-400 bg-red-400/20 border-red-400/50';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/50';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-cyan-400';
      case 'debug': return 'text-gray-400';
      default: return 'text-white';
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'allow': return 'text-green-400';
      case 'deny': return 'text-red-400';
      case 'audit': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const filteredLogs = cellDetails?.logs.filter(log =>
    logsFilter === '' || 
    log.message.toLowerCase().includes(logsFilter.toLowerCase()) ||
    log.source.toLowerCase().includes(logsFilter.toLowerCase()) ||
    log.level.toLowerCase().includes(logsFilter.toLowerCase())
  ) || [];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
              <div className="cads-kpi-icon bg-cyan-500/20">
                <Eye size={24} className="text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Cell Inspector</h2>
                <p className="text-white/60 text-sm">
                  {cellId ? `Inspecting: ${cellId}` : 'No cell selected'}
                </p>
              </div>
            </div>
            
            {cellDetails && (
              <div className="flex items-center gap-3">
                <span className={`cads-status-badge ${getStatusColor(cellDetails.status)}`}>
                  {cellDetails.status.toUpperCase()}
                </span>
                <button
                  onClick={onClose}
                  className="cads-action-button"
                  aria-label="Close Inspector"
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="cads-loading"></div>
              <span className="ml-3 text-white/70">Loading cell details...</span>
            </div>
          ) : cellDetails ? (
            <>
              {/* Tab Navigation */}
              <div className="border-b border-white/10">
                <div className="flex px-6 overflow-x-auto">
                  {[
                    { id: 'summary', label: 'Summary', icon: Info },
                    { id: 'trace', label: 'Policy Trace', icon: Shield },
                    { id: 'logs', label: 'Live Logs', icon: Terminal },
                    { id: 'metrics', label: 'Metrics', icon: BarChart3 },
                    { id: 'genome', label: 'Genome Score', icon: TrendingUp },
                    { id: 'ledger', label: 'Ledger Receipt', icon: Database },
                    { id: 'actions', label: 'Actions', icon: Zap }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-cyan-400 text-cyan-400'
                          : 'border-transparent text-white/60 hover:text-white'
                      }`}
                    >
                      <tab.icon size={16} />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-auto p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {activeTab === 'summary' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="cads-kpi-card">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Key size={16} />
                              Intent Token
                            </h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-white/60">Token ID</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-sm">{cellDetails.intentToken}</span>
                                  <button
                                    onClick={() => copyToClipboard(cellDetails.intentToken)}
                                    className="text-cyan-400 hover:text-cyan-300"
                                    aria-label="Copy Token ID"
                                  >
                                    <Copy size={14} />
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-white/60">TTL</span>
                                <span>{cellDetails.ttl}s</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-white/60">User</span>
                                <span>{cellDetails.user}</span>
                              </div>
                            </div>
                          </div>

                          <div className="cads-kpi-card">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Shield size={16} />
                              Device Posture
                            </h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-white/60">Trusted</span>
                                <span className={cellDetails.devicePosture.trusted ? 'text-green-400' : 'text-red-400'}>
                                  {cellDetails.devicePosture.trusted ? 'Yes' : 'No'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-white/60">Compliance</span>
                                <span className="text-green-400">{cellDetails.devicePosture.compliance}%</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-white/60">Last Check</span>
                                <span>{cellDetails.devicePosture.lastVerification.toLocaleTimeString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="cads-kpi-card">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Clock size={16} />
                              Runtime Info
                            </h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-white/60">Spawn Time</span>
                                <span>{cellDetails.spawnTime.toLocaleTimeString()}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-white/60">Runtime</span>
                                <span>{cellDetails.runtime}s</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-white/60">Risk Score</span>
                                <span className={cellDetails.riskScore > 50 ? 'text-red-400' : 'text-green-400'}>
                                  {cellDetails.riskScore}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="cads-chart-container">
                            <h4 className="cads-chart-title flex items-center gap-2">
                              <MemoryStick size={16} />
                              Memory Usage
                            </h4>
                            <div className="space-y-3">
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Heap</span>
                                  <span>{cellDetails.memory.heap}MB</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-cyan-400 h-2 rounded-full"
                                    style={{ width: `${(cellDetails.memory.heap / cellDetails.memory.limit) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Stack</span>
                                  <span>{cellDetails.memory.stack}MB</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-green-400 h-2 rounded-full"
                                    style={{ width: `${(cellDetails.memory.stack / cellDetails.memory.limit) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Total</span>
                                  <span>{cellDetails.memory.total}MB / {cellDetails.memory.limit}MB</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-yellow-400 h-2 rounded-full"
                                    style={{ width: `${(cellDetails.memory.total / cellDetails.memory.limit) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="cads-chart-container">
                            <h4 className="cads-chart-title flex items-center gap-2">
                              <Cpu size={16} />
                              Performance Metrics
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-cyan-400">{cellDetails.metrics.gasCounter}</div>
                                <div className="text-sm text-white/60">Gas Counter</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-400">{cellDetails.metrics.execTime}ms</div>
                                <div className="text-sm text-white/60">Exec Time</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-400">{cellDetails.metrics.syscalls}</div>
                                <div className="text-sm text-white/60">Syscalls</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-purple-400">{cellDetails.metrics.ioOperations}</div>
                                <div className="text-sm text-white/60">I/O Ops</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'trace' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Policy Evaluation Trace</h3>
                        <div className="space-y-3">
                          {cellDetails.policyTrace.map((trace, index) => (
                            <div key={index} className="cads-kpi-card">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className={`cads-status-badge text-xs ${getVerdictColor(trace.verdict)}`}>
                                      {trace.verdict.toUpperCase()}
                                    </span>
                                    <span className="text-sm text-white/60">
                                      {trace.timestamp.toLocaleTimeString()}
                                    </span>
                                  </div>
                                  <div className="font-mono text-sm bg-black/20 p-2 rounded border border-white/10 mb-2">
                                    {trace.rule}
                                  </div>
                                  <p className="text-white/80 text-sm">{trace.details}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === 'logs' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">Live Syscall Logs</h3>
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              placeholder="Filter logs..."
                              value={logsFilter}
                              onChange={(e) => setLogsFilter(e.target.value)}
                              className="cads-form-input"
                              aria-label="Filter logs"
                            />
                            <button
                              onClick={() => setLogsPaused(!logsPaused)}
                              className="cads-action-button"
                              aria-label={logsPaused ? "Resume logs" : "Pause logs"}
                            >
                              {logsPaused ? <Play size={16} /> : <Pause size={16} />}
                              {logsPaused ? 'Resume' : 'Pause'}
                            </button>
                          </div>
                        </div>
                        
                        <div className="bg-black/40 rounded border border-white/10 p-4 h-96 overflow-y-auto font-mono text-sm">
                          {filteredLogs.map((log, index) => (
                            <div key={index} className="flex gap-3 mb-2 items-start">
                              <span className="text-white/40 text-xs min-w-[80px]">
                                {log.timestamp.toLocaleTimeString()}
                              </span>
                              <span className={`text-xs min-w-[50px] ${getLogLevelColor(log.level)}`}>
                                {log.level.toUpperCase()}
                              </span>
                              <span className="text-white/60 text-xs min-w-[100px]">
                                [{log.source}]
                              </span>
                              <span className="text-white/90 flex-1">
                                {log.message}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === 'metrics' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="cads-chart-container">
                            <h4 className="cads-chart-title">Execution Histogram</h4>
                            <div className="h-48 flex items-end justify-center">
                              <div className="text-white/60">Chart visualization would go here</div>
                            </div>
                          </div>
                          
                          <div className="cads-chart-container">
                            <h4 className="cads-chart-title">Memory Timeline</h4>
                            <div className="h-48 flex items-end justify-center">
                              <div className="text-white/60">Memory usage chart would go here</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'genome' && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold">Genome Fitness Score Breakdown</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {Object.entries(cellDetails.genomeScore).map(([key, value]) => (
                            <div key={key} className="cads-kpi-card text-center">
                              <div className="text-2xl font-bold text-cyan-400 mb-1">
                                {(value * 100).toFixed(1)}%
                              </div>
                              <div className="text-sm text-white/60 capitalize">{key}</div>
                              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                                <div 
                                  className="bg-cyan-400 h-2 rounded-full"
                                  style={{ width: `${value * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === 'ledger' && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold">Blockchain Ledger Receipt</h3>
                        <div className="cads-kpi-card">
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm text-white/60">Transaction Hash</label>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="font-mono text-sm bg-black/20 p-2 rounded border border-white/10 flex-1">
                                  {cellDetails.ledgerReceipt.hash}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(cellDetails.ledgerReceipt.hash)}
                                  className="cads-action-button"
                                  aria-label="Copy Hash"
                                >
                                  <Copy size={16} />
                                </button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm text-white/60">Block Number</label>
                                <div className="font-mono text-lg font-semibold mt-1">
                                  #{cellDetails.ledgerReceipt.blockNumber}
                                </div>
                              </div>
                              <div>
                                <label className="text-sm text-white/60">Notarization Time</label>
                                <div className="text-lg font-semibold mt-1">
                                  {cellDetails.ledgerReceipt.timestamp.toLocaleString()}
                                </div>
                              </div>
                            </div>

                            <button
                              className="cads-action-button w-full"
                              onClick={() => window.open(`/fabric-explorer/block/${cellDetails.ledgerReceipt.blockNumber}`, '_blank')}
                            >
                              <Database size={16} />
                              View in Fabric Explorer
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'actions' && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold">Manual Actions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <button className="cads-action-button text-left p-4 h-auto">
                            <AlertTriangle size={20} className="text-yellow-400 mb-2" />
                            <div className="font-semibold">Quarantine Cell</div>
                            <div className="text-sm text-white/60 mt-1">
                              Isolate this cell for security analysis
                            </div>
                          </button>

                          <button className="cads-action-button text-left p-4 h-auto">
                            <Download size={20} className="text-cyan-400 mb-2" />
                            <div className="font-semibold">Create Snapshot</div>
                            <div className="text-sm text-white/60 mt-1">
                              Save current state for analysis
                            </div>
                          </button>

                          <button className="cads-action-button text-left p-4 h-auto">
                            <TrendingUp size={20} className="text-green-400 mb-2" />
                            <div className="font-semibold">Promote to Long-Run</div>
                            <div className="text-sm text-white/60 mt-1">
                              Convert to persistent service
                            </div>
                          </button>

                          <button className="cads-action-button text-left p-4 h-auto">
                            <Terminal size={20} className="text-purple-400 mb-2" />
                            <div className="font-semibold">Debug Shell</div>
                            <div className="text-sm text-white/60 mt-1">
                              Access cell debug interface
                            </div>
                          </button>

                          <button className="cads-action-button text-left p-4 h-auto">
                            <Archive size={20} className="text-orange-400 mb-2" />
                            <div className="font-semibold">Archive Logs</div>
                            <div className="text-sm text-white/60 mt-1">
                              Save logs to long-term storage
                            </div>
                          </button>

                          <button className="cads-action-button text-left p-4 h-auto">
                            <X size={20} className="text-red-400 mb-2" />
                            <div className="font-semibold">Terminate Cell</div>
                            <div className="text-sm text-white/60 mt-1">
                              Forcefully stop cell execution
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-white/60">
                <Eye size={48} className="mx-auto mb-4" />
                <p>No cell selected for inspection</p>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CellInspector;
