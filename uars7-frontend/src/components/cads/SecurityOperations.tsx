import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Users,
  Server,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Lock,
  Unlock,
  Play,
  Pause,
  RefreshCw,
  Settings,
  BarChart3,
  Filter,
  Search,
  Download
} from 'lucide-react';

interface SecurityOperation {
  id: string;
  type: 'patrol' | 'investigation' | 'response' | 'maintenance';
  status: 'active' | 'pending' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  assignedTo: string;
  startTime: Date;
  estimatedDuration: number;
  progress: number;
  resources: string[];
}

interface Operator {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'offline' | 'busy';
  activeOperations: number;
  certification: string;
  lastActive: Date;
}

interface SystemHealth {
  overall: number;
  subsystems: {
    detection: number;
    response: number;
    monitoring: number;
    analytics: number;
  };
}

const SecurityOperations: React.FC = () => {
  const [operations, setOperations] = useState<SecurityOperation[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOperation, setSelectedOperation] = useState<SecurityOperation | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadOperationsData();
  }, []);

  const loadOperationsData = async () => {
    setLoading(true);
    
    // Mock data
    const mockOperations: SecurityOperation[] = [
      {
        id: 'op-001',
        type: 'investigation',
        status: 'active',
        priority: 'high',
        title: 'Advanced Persistent Threat Investigation',
        description: 'Investigating sophisticated APT campaign with lateral movement indicators',
        assignedTo: 'Sarah Chen',
        startTime: new Date(Date.now() - 3600000),
        estimatedDuration: 480,
        progress: 35,
        resources: ['SIEM', 'EDR', 'Threat Intelligence', 'Forensics']
      },
      {
        id: 'op-002',
        type: 'response',
        status: 'active',
        priority: 'critical',
        title: 'DDoS Attack Mitigation',
        description: 'Active response to large-scale DDoS attack on web infrastructure',
        assignedTo: 'Mike Rodriguez',
        startTime: new Date(Date.now() - 1800000),
        estimatedDuration: 120,
        progress: 75,
        resources: ['WAF', 'Load Balancer', 'CDN', 'Traffic Analysis']
      },
      {
        id: 'op-003',
        type: 'patrol',
        status: 'active',
        priority: 'medium',
        title: 'Network Security Patrol',
        description: 'Routine security patrol and anomaly detection across network segments',
        assignedTo: 'Alex Johnson',
        startTime: new Date(Date.now() - 7200000),
        estimatedDuration: 360,
        progress: 60,
        resources: ['Network Scanner', 'IDS/IPS', 'Traffic Monitor']
      }
    ];

    const mockOperators: Operator[] = [
      {
        id: 'op-user-001',
        name: 'Sarah Chen',
        role: 'Senior Security Analyst',
        status: 'online',
        activeOperations: 2,
        certification: 'CISSP, GCIH',
        lastActive: new Date()
      },
      {
        id: 'op-user-002',
        name: 'Mike Rodriguez',
        role: 'Incident Response Lead',
        status: 'busy',
        activeOperations: 1,
        certification: 'GCFA, GNFA',
        lastActive: new Date()
      },
      {
        id: 'op-user-003',
        name: 'Alex Johnson',
        role: 'Security Operations Specialist',
        status: 'online',
        activeOperations: 1,
        certification: 'Security+, CySA+',
        lastActive: new Date(Date.now() - 300000)
      }
    ];

    const mockSystemHealth: SystemHealth = {
      overall: 94,
      subsystems: {
        detection: 98,
        response: 89,
        monitoring: 96,
        analytics: 92
      }
    };

    setOperations(mockOperations);
    setOperators(mockOperators);
    setSystemHealth(mockSystemHealth);
    setLoading(false);
  };

  const filteredOperations = operations.filter(operation => {
    const matchesStatus = filterStatus === 'all' || operation.status === filterStatus;
    const matchesType = filterType === 'all' || operation.type === filterType;
    const matchesSearch = searchTerm === '' || 
      operation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      operation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      operation.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'cads-priority-critical';
      case 'high': return 'cads-priority-high';
      case 'medium': return 'cads-priority-medium';
      case 'low': return 'cads-priority-low';
      default: return 'cads-priority-low';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'cads-status-active';
      case 'pending': return 'cads-status-pending';
      case 'completed': return 'cads-status-completed';
      case 'failed': return 'cads-status-failed';
      default: return 'cads-status-pending';
    }
  };

  const getOperatorStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'cads-operator-online';
      case 'busy': return 'cads-operator-busy';
      case 'offline': return 'cads-operator-offline';
      default: return 'cads-operator-offline';
    }
  };

  if (loading) {
    return (
      <div className="cads-loading">
        <div className="cads-loading-spinner"></div>
        <p>Loading security operations...</p>
      </div>
    );
  }

  return (
    <div className="cads-security-operations">
      {/* Header */}
      <div className="cads-section-header">
        <div className="cads-header-content">
          <div className="cads-header-info">
            <h2 className="cads-section-title">
              <Shield className="cads-icon" />
              Security Operations Center
            </h2>
            <p className="cads-section-description">
              Command center for security operations and incident response
            </p>
          </div>
          <div className="cads-header-controls">
            <button 
              onClick={loadOperationsData} 
              className="cads-btn cads-btn-secondary"
              aria-label="Refresh operations data"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <div className="cads-system-health">
          <motion.div 
            className="cads-health-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="cads-health-header">
              <h3>System Health</h3>
              <div className="cads-health-overall">
                <div className="cads-health-score">{systemHealth.overall}%</div>
                <div className="cads-health-label">Overall</div>
              </div>
            </div>
            
            <div className="cads-health-subsystems">
              {Object.entries(systemHealth.subsystems).map(([system, health]) => (
                <div key={system} className="cads-health-subsystem">
                  <div className="cads-subsystem-name">{system}</div>
                  <div className="cads-subsystem-bar">
                    <div 
                      className="cads-subsystem-progress"
                      style={{ width: `${health}%` }}
                    ></div>
                  </div>
                  <div className="cads-subsystem-value">{health}%</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Operations and Operators Grid */}
      <div className="cads-operations-grid">
        {/* Active Operations */}
        <div className="cads-operations-section">
          <div className="cads-section-header">
            <h3>Active Operations</h3>
            <div className="cads-operations-controls">
              <div className="cads-search-box">
                <Search size={16} className="cads-search-icon" />
                <input
                  type="text"
                  placeholder="Search operations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="cads-search-input"
                  aria-label="Search operations"
                />
              </div>
              
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="cads-select"
                aria-label="Filter by status"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>

              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="cads-select"
                aria-label="Filter by type"
              >
                <option value="all">All Types</option>
                <option value="patrol">Patrol</option>
                <option value="investigation">Investigation</option>
                <option value="response">Response</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div className="cads-operations-list">
            {filteredOperations.map((operation, index) => (
              <motion.div
                key={operation.id}
                className="cads-operation-card"
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedOperation(operation)}
              >
                <div className="cads-operation-header">
                  <div className={`cads-priority-badge ${getPriorityColor(operation.priority)}`}>
                    {operation.priority.toUpperCase()}
                  </div>
                  <div className={`cads-status-badge ${getStatusColor(operation.status)}`}>
                    {operation.status.toUpperCase()}
                  </div>
                </div>

                <div className="cads-operation-content">
                  <h4 className="cads-operation-title">{operation.title}</h4>
                  <p className="cads-operation-description">{operation.description}</p>
                  
                  <div className="cads-operation-details">
                    <div className="cads-operation-detail">
                      <span className="cads-label">Assigned:</span>
                      <span className="cads-value">{operation.assignedTo}</span>
                    </div>
                    <div className="cads-operation-detail">
                      <span className="cads-label">Duration:</span>
                      <span className="cads-value">{operation.estimatedDuration}min</span>
                    </div>
                  </div>

                  <div className="cads-operation-progress">
                    <div className="cads-progress-header">
                      <span>Progress</span>
                      <span>{operation.progress}%</span>
                    </div>
                    <div className="cads-progress-bar">
                      <div 
                        className="cads-progress-fill"
                        style={{ width: `${operation.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="cads-operation-resources">
                    {operation.resources.map((resource, idx) => (
                      <span key={idx} className="cads-resource-tag">
                        {resource}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="cads-operation-timestamp">
                  Started: {operation.startTime.toLocaleString()}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Operators Panel */}
        <div className="cads-operators-section">
          <div className="cads-section-header">
            <h3>Operations Team</h3>
          </div>

          <div className="cads-operators-list">
            {operators.map((operator, index) => (
              <motion.div
                key={operator.id}
                className="cads-operator-card"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="cads-operator-header">
                  <div className="cads-operator-avatar">
                    <Users size={24} />
                  </div>
                  <div className={`cads-operator-status ${getOperatorStatusColor(operator.status)}`}>
                    {operator.status}
                  </div>
                </div>

                <div className="cads-operator-info">
                  <h4 className="cads-operator-name">{operator.name}</h4>
                  <p className="cads-operator-role">{operator.role}</p>
                  
                  <div className="cads-operator-stats">
                    <div className="cads-operator-stat">
                      <span className="cads-label">Active Ops:</span>
                      <span className="cads-value">{operator.activeOperations}</span>
                    </div>
                    <div className="cads-operator-stat">
                      <span className="cads-label">Cert:</span>
                      <span className="cads-value">{operator.certification}</span>
                    </div>
                  </div>

                  <div className="cads-operator-last-active">
                    Last active: {operator.lastActive.toLocaleTimeString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Operation Detail Modal */}
      {selectedOperation && (
        <motion.div
          className="cads-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedOperation(null)}
        >
          <motion.div
            className="cads-modal-content cads-operation-detail-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cads-modal-header">
              <h3>Operation Details - {selectedOperation.title}</h3>
              <button 
                onClick={() => setSelectedOperation(null)} 
                className="cads-modal-close"
                aria-label="Close operation details"
              >
                ×
              </button>
            </div>

            <div className="cads-modal-body">
              <div className="cads-operation-detail-grid">
                <div className="cads-detail-section">
                  <h4>Operation Information</h4>
                  <div className="cads-detail-row">
                    <span className="cads-label">Operation ID:</span>
                    <span className="cads-value">{selectedOperation.id}</span>
                  </div>
                  <div className="cads-detail-row">
                    <span className="cads-label">Type:</span>
                    <span className="cads-value">{selectedOperation.type}</span>
                  </div>
                  <div className="cads-detail-row">
                    <span className="cads-label">Priority:</span>
                    <span className={`cads-value ${getPriorityColor(selectedOperation.priority)}`}>
                      {selectedOperation.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className="cads-detail-row">
                    <span className="cads-label">Status:</span>
                    <span className={`cads-value ${getStatusColor(selectedOperation.status)}`}>
                      {selectedOperation.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="cads-detail-section">
                  <h4>Assignment Details</h4>
                  <div className="cads-detail-row">
                    <span className="cads-label">Assigned To:</span>
                    <span className="cads-value">{selectedOperation.assignedTo}</span>
                  </div>
                  <div className="cads-detail-row">
                    <span className="cads-label">Start Time:</span>
                    <span className="cads-value">{selectedOperation.startTime.toLocaleString()}</span>
                  </div>
                  <div className="cads-detail-row">
                    <span className="cads-label">Duration:</span>
                    <span className="cads-value">{selectedOperation.estimatedDuration} minutes</span>
                  </div>
                  <div className="cads-detail-row">
                    <span className="cads-label">Progress:</span>
                    <span className="cads-value">{selectedOperation.progress}%</span>
                  </div>
                </div>

                <div className="cads-detail-section cads-full-width">
                  <h4>Description</h4>
                  <p className="cads-description">{selectedOperation.description}</p>
                </div>

                <div className="cads-detail-section cads-full-width">
                  <h4>Resources</h4>
                  <div className="cads-resources-grid">
                    {selectedOperation.resources.map((resource, idx) => (
                      <div key={idx} className="cads-resource-item">
                        <Server size={16} />
                        {resource}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="cads-modal-footer">
              <button className="cads-btn cads-btn-secondary">
                View Logs
              </button>
              <button className="cads-btn cads-btn-warning">
                Pause Operation
              </button>
              <button className="cads-btn cads-btn-primary">
                Update Status
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default SecurityOperations;
