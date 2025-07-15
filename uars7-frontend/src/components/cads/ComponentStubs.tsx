import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Users, 
  Clock, 
  TrendingUp,
  Eye,
  Lock,
  Zap,
  CheckCircle,
  XCircle,
  RefreshCw,
  Play,
  Pause,
  Settings,
  Filter,
  Download,
  Search
} from 'lucide-react';

interface SecurityOperation {
  id: string;
  name: string;
  type: 'scan' | 'monitor' | 'analyze' | 'enforce';
  status: 'running' | 'paused' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  endTime?: Date;
  findings: number;
  criticalFindings: number;
  assignedTo: string;
  description: string;
  target: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface SecurityMetrics {
  totalOperations: number;
  activeOperations: number;
  completedToday: number;
  criticalFindings: number;
  averageTime: number;
  successRate: number;
}

export const SecurityOperations: React.FC = () => {
  const [operations, setOperations] = useState<SecurityOperation[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalOperations: 0,
    activeOperations: 0,
    completedToday: 0,
    criticalFindings: 0,
    averageTime: 0,
    successRate: 0
  });
  const [selectedOperation, setSelectedOperation] = useState<SecurityOperation | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOperation, setNewOperation] = useState({
    name: '',
    type: 'scan' as const,
    target: '',
    description: '',
    priority: 'medium' as const,
    assignedTo: ''
  });

  useEffect(() => {
    loadOperations();
    loadMetrics();
  }, []);

  const loadOperations = () => {
    // Mock data - replace with actual API call
    const mockOperations: SecurityOperation[] = [
      {
        id: 'op-001',
        name: 'Network Vulnerability Scan',
        type: 'scan',
        status: 'running',
        progress: 67,
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        findings: 23,
        criticalFindings: 3,
        assignedTo: 'security-team-alpha',
        description: 'Comprehensive vulnerability assessment of network infrastructure',
        target: '10.0.0.0/16',
        priority: 'high'
      },
      {
        id: 'op-002',
        name: 'Endpoint Monitoring',
        type: 'monitor',
        status: 'running',
        progress: 100,
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        findings: 156,
        criticalFindings: 8,
        assignedTo: 'security-team-beta',
        description: 'Continuous monitoring of endpoint devices for threats',
        target: 'All Endpoints',
        priority: 'critical'
      },
      {
        id: 'op-003',
        name: 'Log Analysis',
        type: 'analyze',
        status: 'completed',
        progress: 100,
        startTime: new Date(Date.now() - 6 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 30 * 60 * 1000),
        findings: 45,
        criticalFindings: 1,
        assignedTo: 'security-team-gamma',
        description: 'Analysis of security logs for anomalies and threats',
        target: 'Security Logs (7 days)',
        priority: 'medium'
      }
    ];
    setOperations(mockOperations);
  };

  const loadMetrics = () => {
    setMetrics({
      totalOperations: 147,
      activeOperations: 23,
      completedToday: 8,
      criticalFindings: 17,
      averageTime: 3.5,
      successRate: 94.2
    });
  };

  const createOperation = () => {
    const operation: SecurityOperation = {
      id: `op-${Date.now()}`,
      ...newOperation,
      status: 'running',
      progress: 0,
      startTime: new Date(),
      findings: 0,
      criticalFindings: 0
    };
    setOperations(prev => [operation, ...prev]);
    setShowCreateForm(false);
    setNewOperation({
      name: '',
      type: 'scan',
      target: '',
      description: '',
      priority: 'medium',
      assignedTo: ''
    });
  };

  const controlOperation = (id: string, action: 'pause' | 'resume' | 'stop') => {
    setOperations(prev => prev.map(op => {
      if (op.id === id) {
        switch (action) {
          case 'pause':
            return { ...op, status: 'paused' as const };
          case 'resume':
            return { ...op, status: 'running' as const };
          case 'stop':
            return { ...op, status: 'completed' as const, endTime: new Date() };
          default:
            return op;
        }
      }
      return op;
    }));
  };

  const filteredOperations = operations.filter(op => {
    const matchesStatus = filterStatus === 'all' || op.status === filterStatus;
    const matchesType = filterType === 'all' || op.type === filterType;
    const matchesSearch = op.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         op.target.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="text-green-400" size={16} />;
      case 'paused': return <Pause className="text-yellow-400" size={16} />;
      case 'completed': return <CheckCircle className="text-blue-400" size={16} />;
      case 'failed': return <XCircle className="text-red-400" size={16} />;
      default: return <Clock className="text-gray-400" size={16} />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'scan': return <Search className="text-blue-400" size={16} />;
      case 'monitor': return <Eye className="text-green-400" size={16} />;
      case 'analyze': return <Activity className="text-purple-400" size={16} />;
      case 'enforce': return <Lock className="text-orange-400" size={16} />;
      default: return <Shield className="text-gray-400" size={16} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400 bg-red-400/10';
      case 'high': return 'text-orange-400 bg-orange-400/10';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'low': return 'text-green-400 bg-green-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <div className="cads-content-wrapper">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Security Operations</h2>
          <p className="text-white/60">Monitor and manage security operations across your infrastructure</p>
        </div>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="cads-action-button"
          aria-label="Create new security operation"
        >
          <Zap size={16} />
          New Operation
        </button>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <motion.div 
          className="cads-metric-card"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Total Operations</p>
              <p className="text-2xl font-bold text-white">{metrics.totalOperations}</p>
            </div>
            <Shield className="text-blue-400" size={24} />
          </div>
        </motion.div>

        <motion.div 
          className="cads-metric-card"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Active Now</p>
              <p className="text-2xl font-bold text-green-400">{metrics.activeOperations}</p>
            </div>
            <Activity className="text-green-400" size={24} />
          </div>
        </motion.div>

        <motion.div 
          className="cads-metric-card"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Completed Today</p>
              <p className="text-2xl font-bold text-blue-400">{metrics.completedToday}</p>
            </div>
            <CheckCircle className="text-blue-400" size={24} />
          </div>
        </motion.div>

        <motion.div 
          className="cads-metric-card"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Critical Findings</p>
              <p className="text-2xl font-bold text-red-400">{metrics.criticalFindings}</p>
            </div>
            <AlertTriangle className="text-red-400" size={24} />
          </div>
        </motion.div>

        <motion.div 
          className="cads-metric-card"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Avg Time (hrs)</p>
              <p className="text-2xl font-bold text-purple-400">{metrics.averageTime}</p>
            </div>
            <Clock className="text-purple-400" size={24} />
          </div>
        </motion.div>

        <motion.div 
          className="cads-metric-card"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Success Rate</p>
              <p className="text-2xl font-bold text-green-400">{metrics.successRate}%</p>
            </div>
            <TrendingUp className="text-green-400" size={24} />
          </div>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-white/60" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="cads-form-select"
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            <option value="running">Running</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="cads-form-select"
            aria-label="Filter by type"
          >
            <option value="all">All Types</option>
            <option value="scan">Scan</option>
            <option value="monitor">Monitor</option>
            <option value="analyze">Analyze</option>
            <option value="enforce">Enforce</option>
          </select>
        </div>

        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search operations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="cads-form-input pl-10"
              aria-label="Search security operations"
            />
          </div>
        </div>

        <button className="cads-action-button" aria-label="Refresh operations list">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Operations List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredOperations.map(operation => (
            <motion.div
              key={operation.id}
              className="cads-card cursor-pointer"
              whileHover={{ scale: 1.01 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onClick={() => setSelectedOperation(operation)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(operation.type)}
                    {getStatusIcon(operation.status)}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-white">{operation.name}</h3>
                    <p className="text-white/60 text-sm">{operation.target}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(operation.priority)}`}>
                      {operation.priority.toUpperCase()}
                    </div>
                    <p className="text-white/60 text-sm mt-1">
                      {operation.findings} findings ({operation.criticalFindings} critical)
                    </p>
                  </div>

                  {operation.status === 'running' && (
                    <div className="w-24">
                      <div className="flex justify-between text-xs text-white/60 mb-1">
                        <span>Progress</span>
                        <span>{operation.progress}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${operation.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {operation.status === 'running' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          controlOperation(operation.id, 'pause');
                        }}
                        className="cads-icon-button"
                        aria-label="Pause operation"
                      >
                        <Pause size={14} />
                      </button>
                    )}
                    
                    {operation.status === 'paused' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          controlOperation(operation.id, 'resume');
                        }}
                        className="cads-icon-button"
                        aria-label="Resume operation"
                      >
                        <Play size={14} />
                      </button>
                    )}

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOperation(operation);
                      }}
                      className="cads-icon-button"
                      aria-label="View operation details"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Create Operation Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="cads-modal max-w-2xl w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Create Security Operation</h3>
                <button 
                  onClick={() => setShowCreateForm(false)}
                  className="cads-icon-button"
                  aria-label="Close create operation form"
                >
                  <XCircle size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="cads-form-group">
                    <label className="cads-form-label">Operation Name</label>
                    <input
                      type="text"
                      value={newOperation.name}
                      onChange={(e) => setNewOperation(prev => ({ ...prev, name: e.target.value }))}
                      className="cads-form-input"
                      placeholder="Enter operation name"
                      aria-label="Operation name"
                    />
                  </div>

                  <div className="cads-form-group">
                    <label className="cads-form-label">Operation Type</label>
                    <select
                      value={newOperation.type}
                      onChange={(e) => setNewOperation(prev => ({ ...prev, type: e.target.value as any }))}
                      className="cads-form-select"
                      aria-label="Operation type"
                    >
                      <option value="scan">Security Scan</option>
                      <option value="monitor">Monitoring</option>
                      <option value="analyze">Analysis</option>
                      <option value="enforce">Enforcement</option>
                    </select>
                  </div>

                  <div className="cads-form-group">
                    <label className="cads-form-label">Target</label>
                    <input
                      type="text"
                      value={newOperation.target}
                      onChange={(e) => setNewOperation(prev => ({ ...prev, target: e.target.value }))}
                      className="cads-form-input"
                      placeholder="Target system or network"
                      aria-label="Operation target"
                    />
                  </div>

                  <div className="cads-form-group">
                    <label className="cads-form-label">Priority</label>
                    <select
                      value={newOperation.priority}
                      onChange={(e) => setNewOperation(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="cads-form-select"
                      aria-label="Operation priority"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div className="cads-form-group md:col-span-2">
                    <label className="cads-form-label">Assigned To</label>
                    <input
                      type="text"
                      value={newOperation.assignedTo}
                      onChange={(e) => setNewOperation(prev => ({ ...prev, assignedTo: e.target.value }))}
                      className="cads-form-input"
                      placeholder="Team or individual"
                      aria-label="Assigned to"
                    />
                  </div>

                  <div className="cads-form-group md:col-span-2">
                    <label className="cads-form-label">Description</label>
                    <textarea
                      value={newOperation.description}
                      onChange={(e) => setNewOperation(prev => ({ ...prev, description: e.target.value }))}
                      className="cads-form-input min-h-[100px]"
                      placeholder="Describe the operation..."
                      aria-label="Operation description"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={createOperation}
                    className="cads-action-button flex-1"
                    aria-label="Create operation"
                  >
                    <Zap size={16} />
                    Create Operation
                  </button>
                  <button 
                    onClick={() => setShowCreateForm(false)}
                    className="cads-secondary-button flex-1"
                    aria-label="Cancel operation creation"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Operation Details Modal */}
      <AnimatePresence>
        {selectedOperation && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="cads-modal max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  {getTypeIcon(selectedOperation.type)}
                  <h3 className="text-xl font-bold text-white">{selectedOperation.name}</h3>
                  {getStatusIcon(selectedOperation.status)}
                </div>
                <button 
                  onClick={() => setSelectedOperation(null)}
                  className="cads-icon-button"
                  aria-label="Close operation details"
                >
                  <XCircle size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="cads-card">
                    <h4 className="text-lg font-semibold text-white mb-3">Operation Details</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-white/60">Target:</span>
                        <span className="text-white">{selectedOperation.target}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Priority:</span>
                        <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(selectedOperation.priority)}`}>
                          {selectedOperation.priority.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Assigned To:</span>
                        <span className="text-white">{selectedOperation.assignedTo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Started:</span>
                        <span className="text-white">{selectedOperation.startTime.toLocaleString()}</span>
                      </div>
                      {selectedOperation.endTime && (
                        <div className="flex justify-between">
                          <span className="text-white/60">Ended:</span>
                          <span className="text-white">{selectedOperation.endTime.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="cads-card">
                    <h4 className="text-lg font-semibold text-white mb-3">Description</h4>
                    <p className="text-white/80">{selectedOperation.description}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="cads-card">
                    <h4 className="text-lg font-semibold text-white mb-3">Findings Summary</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white/60">Total Findings:</span>
                        <span className="text-2xl font-bold text-white">{selectedOperation.findings}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/60">Critical:</span>
                        <span className="text-2xl font-bold text-red-400">{selectedOperation.criticalFindings}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/60">High:</span>
                        <span className="text-xl font-bold text-orange-400">{Math.floor(selectedOperation.findings * 0.2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/60">Medium:</span>
                        <span className="text-xl font-bold text-yellow-400">{Math.floor(selectedOperation.findings * 0.3)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/60">Low:</span>
                        <span className="text-xl font-bold text-green-400">{selectedOperation.findings - selectedOperation.criticalFindings - Math.floor(selectedOperation.findings * 0.5)}</span>
                      </div>
                    </div>
                  </div>

                  {selectedOperation.status === 'running' && (
                    <div className="cads-card">
                      <h4 className="text-lg font-semibold text-white mb-3">Progress</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">Completion</span>
                          <span className="text-white">{selectedOperation.progress}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-3">
                          <div 
                            className="bg-blue-400 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${selectedOperation.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button className="cads-action-button flex-1" aria-label="Download operation report">
                      <Download size={16} />
                      Download Report
                    </button>
                    <button className="cads-secondary-button" aria-label="Operation settings">
                      <Settings size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface Incident {
  id: string;
  title: string;
  severity: string;
  status: string;
  assignee: string;
  created: Date;
  lastUpdate: Date;
  description: string;
  affectedSystems: string[];
  responseActions: Array<{
    action: string;
    timestamp: Date;
    status: string;
  }>;
}

export const IncidentResponse: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: 'inc-001',
      title: 'Suspicious Network Activity Detected',
      severity: 'critical',
      status: 'active',
      assignee: 'security-team-alpha',
      created: new Date(Date.now() - 2 * 60 * 60 * 1000),
      lastUpdate: new Date(Date.now() - 30 * 60 * 1000),
      description: 'Anomalous traffic patterns detected from multiple endpoints',
      affectedSystems: ['Web Server Pool', 'Database Cluster', 'Load Balancer'],
      responseActions: [
        { action: 'Network isolation initiated', timestamp: new Date(Date.now() - 25 * 60 * 1000), status: 'completed' },
        { action: 'Forensic data collection', timestamp: new Date(Date.now() - 20 * 60 * 1000), status: 'in-progress' },
        { action: 'Stakeholder notification', timestamp: new Date(Date.now() - 15 * 60 * 1000), status: 'pending' }
      ]
    },
    {
      id: 'inc-002',
      title: 'Malware Detection on Endpoint',
      severity: 'high',
      status: 'investigating',
      assignee: 'security-team-beta',
      created: new Date(Date.now() - 4 * 60 * 60 * 1000),
      lastUpdate: new Date(Date.now() - 1 * 60 * 60 * 1000),
      description: 'Potential malware identified on workstation WS-HR-043',
      affectedSystems: ['HR Workstation WS-043'],
      responseActions: [
        { action: 'Endpoint quarantine', timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000), status: 'completed' },
        { action: 'Malware analysis', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), status: 'completed' },
        { action: 'System remediation', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), status: 'in-progress' }
      ]
    }
  ]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-400/10';
      case 'high': return 'text-orange-400 bg-orange-400/10';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'low': return 'text-green-400 bg-green-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-400 bg-red-400/10';
      case 'investigating': return 'text-orange-400 bg-orange-400/10';
      case 'resolving': return 'text-yellow-400 bg-yellow-400/10';
      case 'resolved': return 'text-green-400 bg-green-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <div className="cads-content-wrapper">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Incident Response</h2>
          <p className="text-white/60">Manage and respond to security incidents in real-time</p>
        </div>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="cads-action-button"
          aria-label="Create new incident"
        >
          <AlertTriangle size={16} />
          New Incident
        </button>
      </div>

      {/* Incident Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <motion.div className="cads-metric-card" whileHover={{ scale: 1.02 }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Active Incidents</p>
              <p className="text-2xl font-bold text-red-400">12</p>
            </div>
            <AlertTriangle className="text-red-400" size={24} />
          </div>
        </motion.div>

        <motion.div className="cads-metric-card" whileHover={{ scale: 1.02 }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Avg Response Time</p>
              <p className="text-2xl font-bold text-blue-400">8m</p>
            </div>
            <Clock className="text-blue-400" size={24} />
          </div>
        </motion.div>

        <motion.div className="cads-metric-card" whileHover={{ scale: 1.02 }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Resolved Today</p>
              <p className="text-2xl font-bold text-green-400">15</p>
            </div>
            <CheckCircle className="text-green-400" size={24} />
          </div>
        </motion.div>

        <motion.div className="cads-metric-card" whileHover={{ scale: 1.02 }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Critical Incidents</p>
              <p className="text-2xl font-bold text-red-400">3</p>
            </div>
            <Shield className="text-red-400" size={24} />
          </div>
        </motion.div>
      </div>

      {/* Incidents List */}
      <div className="space-y-4">
        <AnimatePresence>
          {incidents.map(incident => (
            <motion.div
              key={incident.id}
              className="cads-card cursor-pointer"
              whileHover={{ scale: 1.01 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onClick={() => setSelectedIncident(incident)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{incident.title}</h3>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                      {incident.severity.toUpperCase()}
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(incident.status)}`}>
                      {incident.status.toUpperCase()}
                    </div>
                  </div>
                  
                  <p className="text-white/70 mb-3">{incident.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-white/60">Assigned to:</span>
                      <p className="text-white">{incident.assignee}</p>
                    </div>
                    <div>
                      <span className="text-white/60">Created:</span>
                      <p className="text-white">{incident.created.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-white/60">Last Update:</span>
                      <p className="text-white">{incident.lastUpdate.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="text-white/60 text-sm">Affected Systems:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {incident.affectedSystems.map((system, index) => (
                        <span key={index} className="px-2 py-1 bg-white/10 rounded text-xs text-white">
                          {system}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle escalate
                    }}
                    className="cads-icon-button"
                    aria-label="Escalate incident"
                  >
                    <TrendingUp size={14} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIncident(incident);
                    }}
                    className="cads-icon-button"
                    aria-label="View incident details"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Incident Details Modal */}
      <AnimatePresence>
        {selectedIncident && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="cads-modal max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-white">{selectedIncident.title}</h3>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(selectedIncident.severity)}`}>
                    {selectedIncident.severity.toUpperCase()}
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedIncident(null)}
                  className="cads-icon-button"
                  aria-label="Close incident details"
                >
                  <XCircle size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="cads-card">
                    <h4 className="text-lg font-semibold text-white mb-3">Incident Details</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-white/60">Status:</span>
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedIncident.status)}`}>
                          {selectedIncident.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Severity:</span>
                        <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(selectedIncident.severity)}`}>
                          {selectedIncident.severity.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Assigned To:</span>
                        <span className="text-white">{selectedIncident.assignee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Created:</span>
                        <span className="text-white">{selectedIncident.created.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Last Update:</span>
                        <span className="text-white">{selectedIncident.lastUpdate.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="cads-card">
                    <h4 className="text-lg font-semibold text-white mb-3">Description</h4>
                    <p className="text-white/80">{selectedIncident.description}</p>
                  </div>

                  <div className="cads-card">
                    <h4 className="text-lg font-semibold text-white mb-3">Affected Systems</h4>
                    <div className="space-y-2">
                      {selectedIncident.affectedSystems.map((system: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <Shield size={14} className="text-red-400" />
                          <span className="text-white">{system}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="cads-card">
                    <h4 className="text-lg font-semibold text-white mb-3">Response Timeline</h4>
                    <div className="space-y-3">
                      {selectedIncident.responseActions.map((action: any, index: number) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className={`w-3 h-3 rounded-full mt-1 ${
                            action.status === 'completed' ? 'bg-green-400' :
                            action.status === 'in-progress' ? 'bg-yellow-400' : 'bg-gray-400'
                          }`} />
                          <div className="flex-1">
                            <p className="text-white font-medium">{action.action}</p>
                            <p className="text-white/60 text-sm">{action.timestamp.toLocaleString()}</p>
                            <span className={`text-xs px-2 py-1 rounded ${
                              action.status === 'completed' ? 'bg-green-400/10 text-green-400' :
                              action.status === 'in-progress' ? 'bg-yellow-400/10 text-yellow-400' : 
                              'bg-gray-400/10 text-gray-400'
                            }`}>
                              {action.status.replace('-', ' ').toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="cads-action-button flex-1" aria-label="Update incident status">
                      <RefreshCw size={16} />
                      Update Status
                    </button>
                    <button className="cads-secondary-button" aria-label="Generate incident report">
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ComplianceAudit: React.FC = () => (
  <div className="cads-content-wrapper">
    <div className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Compliance Audit</h2>
        <p className="text-white/60">Monitor compliance status and manage audit processes</p>
      </div>
      <button className="cads-action-button" aria-label="Start new audit">
        <Shield size={16} />
        New Audit
      </button>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <motion.div className="cads-metric-card" whileHover={{ scale: 1.02 }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm">Compliance Score</p>
            <p className="text-2xl font-bold text-green-400">96%</p>
          </div>
          <CheckCircle className="text-green-400" size={24} />
        </div>
      </motion.div>
      
      <motion.div className="cads-metric-card" whileHover={{ scale: 1.02 }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm">Active Audits</p>
            <p className="text-2xl font-bold text-blue-400">5</p>
          </div>
          <Activity className="text-blue-400" size={24} />
        </div>
      </motion.div>
      
      <motion.div className="cads-metric-card" whileHover={{ scale: 1.02 }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm">Findings</p>
            <p className="text-2xl font-bold text-orange-400">12</p>
          </div>
          <AlertTriangle className="text-orange-400" size={24} />
        </div>
      </motion.div>
    </div>
    
    <div className="cads-card">
      <h3 className="text-lg font-semibold text-white mb-4">Recent Audits</h3>
      <div className="space-y-3">
        {['SOC 2 Type II', 'PCI DSS', 'ISO 27001', 'NIST CSF'].map((framework, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex items-center gap-3">
              <Shield size={16} className="text-blue-400" />
              <span className="text-white">{framework}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-sm">Compliant</span>
              <CheckCircle size={14} className="text-green-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const ThreatHunting: React.FC = () => (
  <div className="cads-content-wrapper">
    <div className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Threat Hunting</h2>
        <p className="text-white/60">Proactively hunt for threats and advanced persistent threats</p>
      </div>
      <button className="cads-action-button" aria-label="Start new hunt">
        <Search size={16} />
        New Hunt
      </button>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <motion.div className="cads-metric-card" whileHover={{ scale: 1.02 }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm">Active Hunts</p>
            <p className="text-2xl font-bold text-blue-400">8</p>
          </div>
          <Search className="text-blue-400" size={24} />
        </div>
      </motion.div>
      
      <motion.div className="cads-metric-card" whileHover={{ scale: 1.02 }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm">IOCs Found</p>
            <p className="text-2xl font-bold text-red-400">23</p>
          </div>
          <AlertTriangle className="text-red-400" size={24} />
        </div>
      </motion.div>
      
      <motion.div className="cads-metric-card" whileHover={{ scale: 1.02 }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm">TTPs Detected</p>
            <p className="text-2xl font-bold text-orange-400">15</p>
          </div>
          <Eye className="text-orange-400" size={24} />
        </div>
      </motion.div>
      
      <motion.div className="cads-metric-card" whileHover={{ scale: 1.02 }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm">Hunt Success Rate</p>
            <p className="text-2xl font-bold text-green-400">87%</p>
          </div>
          <TrendingUp className="text-green-400" size={24} />
        </div>
      </motion.div>
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="cads-card">
        <h3 className="text-lg font-semibold text-white mb-4">Current Hunts</h3>
        <div className="space-y-3">
          {[
            { name: 'APT29 Indicators', status: 'running', progress: 67 },
            { name: 'Lateral Movement Detection', status: 'running', progress: 34 },
            { name: 'Data Exfiltration Hunt', status: 'completed', progress: 100 }
          ].map((hunt, index) => (
            <div key={index} className="p-3 bg-white/5 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{hunt.name}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  hunt.status === 'running' ? 'bg-blue-400/10 text-blue-400' : 'bg-green-400/10 text-green-400'
                }`}>
                  {hunt.status.toUpperCase()}
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    hunt.status === 'running' ? 'bg-blue-400' : 'bg-green-400'
                  }`}
                  style={{ width: `${hunt.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="cads-card">
        <h3 className="text-lg font-semibold text-white mb-4">Threat Intelligence</h3>
        <div className="space-y-3">
          {[
            { indicator: 'malicious.domain.com', type: 'Domain', confidence: 'High' },
            { indicator: '192.168.1.100', type: 'IP Address', confidence: 'Medium' },
            { indicator: 'SHA256:abc123...', type: 'File Hash', confidence: 'High' }
          ].map((ioc, index) => (
            <div key={index} className="p-3 bg-white/5 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium truncate">{ioc.indicator}</p>
                  <p className="text-white/60 text-sm">{ioc.type}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  ioc.confidence === 'High' ? 'bg-red-400/10 text-red-400' : 'bg-yellow-400/10 text-yellow-400'
                }`}>
                  {ioc.confidence}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const VulnerabilityManagement: React.FC = () => (
  <div className="cads-content-wrapper">
    <h2 className="text-xl font-bold mb-4">Vulnerability Management</h2>
    <p className="text-white/60">Vulnerability Management component will be implemented here.</p>
  </div>
);

export const PolicyRollout: React.FC = () => (
  <div className="cads-content-wrapper">
    <h2 className="text-xl font-bold mb-4">Policy Rollout</h2>
    <p className="text-white/60">Policy Rollout component will be implemented here.</p>
  </div>
);

export const TokenVault: React.FC = () => (
  <div className="cads-content-wrapper">
    <h2 className="text-xl font-bold mb-4">Token Vault</h2>
    <p className="text-white/60">Token Vault component will be implemented here.</p>
  </div>
);

export const TokenGenerator: React.FC = () => (
  <div className="cads-content-wrapper">
    <h2 className="text-xl font-bold mb-4">Token Generator</h2>
    <p className="text-white/60">Token Generator component will be implemented here.</p>
  </div>
);

export const TokenRevocation: React.FC = () => (
  <div className="cads-content-wrapper">
    <h2 className="text-xl font-bold mb-4">Token Revocation</h2>
    <p className="text-white/60">Token Revocation component will be implemented here.</p>
  </div>
);

export const FitnessMatrix: React.FC = () => (
  <div className="cads-content-wrapper">
    <h2 className="text-xl font-bold mb-4">Fitness Matrix</h2>
    <p className="text-white/60">Fitness Matrix component will be implemented here.</p>
  </div>
);

export const GenomeDiffViewer: React.FC = () => (
  <div className="cads-content-wrapper">
    <h2 className="text-xl font-bold mb-4">Genome Diff Viewer</h2>
    <p className="text-white/60">Genome Diff Viewer component will be implemented here.</p>
  </div>
);

export const CullQueue: React.FC = () => (
  <div className="cads-content-wrapper">
    <h2 className="text-xl font-bold mb-4">Cull Queue</h2>
    <p className="text-white/60">Cull Queue component will be implemented here.</p>
  </div>
);

export const AlertCorrelations: React.FC = () => (
  <div className="cads-content-wrapper">
    <h2 className="text-xl font-bold mb-4">Alert Correlations</h2>
    <p className="text-white/60">Alert Correlations component will be implemented here.</p>
  </div>
);

export const QuietHours: React.FC = () => (
  <div className="cads-content-wrapper">
    <h2 className="text-xl font-bold mb-4">Quiet Hours</h2>
    <p className="text-white/60">Quiet Hours component will be implemented here.</p>
  </div>
);

export const AlertAnalytics: React.FC = () => (
  <div className="cads-content-wrapper">
    <h2 className="text-xl font-bold mb-4">Alert Analytics</h2>
    <p className="text-white/60">Alert Analytics component will be implemented here.</p>
  </div>
);

export const MemoryManagement: React.FC = () => (
  <div className="cads-content-wrapper">
    <h2 className="text-xl font-bold mb-4">Memory Management</h2>
    <p className="text-white/60">Memory Management component will be implemented here.</p>
  </div>
);

export const LedgerConnectivity: React.FC = () => (
  <div className="cads-content-wrapper">
    <h2 className="text-xl font-bold mb-4">Ledger Connectivity</h2>
    <p className="text-white/60">Ledger Connectivity component will be implemented here.</p>
  </div>
);

export const ExperimentalFlags: React.FC = () => (
  <div className="cads-content-wrapper">
    <h2 className="text-xl font-bold mb-4">Experimental Flags</h2>
    <p className="text-white/60">Experimental Flags component will be implemented here.</p>
  </div>
);

export const APIKeyManagement: React.FC = () => (
  <div className="cads-content-wrapper">
    <h2 className="text-xl font-bold mb-4">API Key Management</h2>
    <p className="text-white/60">API Key Management component will be implemented here.</p>
  </div>
);

export const MetricsViewer: React.FC = () => (
  <div className="cads-content-wrapper">
    <h2 className="text-xl font-bold mb-4">Metrics Viewer</h2>
    <p className="text-white/60">Metrics Viewer component will be implemented here.</p>
  </div>
);

export const LogViewer: React.FC = () => (
  <div className="cads-content-wrapper">
    <h2 className="text-xl font-bold mb-4">Log Viewer</h2>
    <p className="text-white/60">Log Viewer component will be implemented here.</p>
  </div>
);

export default {
  SecurityOperations,
  IncidentResponse,
  ComplianceAudit,
  ThreatHunting,
  VulnerabilityManagement,
  PolicyRollout,
  TokenVault,
  TokenGenerator,
  TokenRevocation,
  FitnessMatrix,
  GenomeDiffViewer,
  CullQueue,
  AlertCorrelations,
  QuietHours,
  AlertAnalytics,
  MemoryManagement,
  LedgerConnectivity,
  ExperimentalFlags,
  APIKeyManagement,
  MetricsViewer,
  LogViewer
};
