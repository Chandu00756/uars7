import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Clock,
  Users,
  Activity,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  Target,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Filter,
  Search,
  Download,
  Play,
  Pause
} from 'lucide-react';

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'containment' | 'eradication' | 'recovery' | 'closed';
  category: 'malware' | 'phishing' | 'data_breach' | 'ddos' | 'unauthorized_access' | 'system_failure';
  reportedBy: string;
  assignedTo: string;
  createdAt: Date;
  updatedAt: Date;
  estimatedResolution: Date;
  affectedSystems: string[];
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  responseTeam: string[];
}

interface ResponseAction {
  id: string;
  incidentId: string;
  action: string;
  description: string;
  assignedTo: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  createdAt: Date;
  completedAt?: Date;
  dependencies: string[];
}

interface Playbook {
  id: string;
  name: string;
  category: string;
  description: string;
  steps: PlaybookStep[];
  estimatedTime: number;
  lastUsed?: Date;
}

interface PlaybookStep {
  id: string;
  title: string;
  description: string;
  estimatedTime: number;
  dependencies: string[];
  automatable: boolean;
}

const IncidentResponse: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [responseActions, setResponseActions] = useState<ResponseAction[]>([]);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [activeTab, setActiveTab] = useState<'incidents' | 'actions' | 'playbooks'>('incidents');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadIncidentData();
  }, []);

  const loadIncidentData = async () => {
    setLoading(true);
    
    // Mock data
    const mockIncidents: Incident[] = [
      {
        id: 'inc-001',
        title: 'Suspected Data Breach - Customer Database',
        description: 'Unauthorized access detected to customer database with potential data exfiltration',
        severity: 'critical',
        status: 'investigating',
        category: 'data_breach',
        reportedBy: 'Security Monitoring System',
        assignedTo: 'Sarah Chen',
        createdAt: new Date(Date.now() - 3600000),
        updatedAt: new Date(Date.now() - 1800000),
        estimatedResolution: new Date(Date.now() + 7200000),
        affectedSystems: ['Customer DB', 'Web Portal', 'API Gateway'],
        impactLevel: 'critical',
        responseTeam: ['Sarah Chen', 'Mike Rodriguez', 'Alex Johnson']
      },
      {
        id: 'inc-002',
        title: 'Phishing Campaign Targeting Employees',
        description: 'Large-scale phishing campaign detected targeting employee credentials',
        severity: 'high',
        status: 'containment',
        category: 'phishing',
        reportedBy: 'John Smith',
        assignedTo: 'Mike Rodriguez',
        createdAt: new Date(Date.now() - 7200000),
        updatedAt: new Date(Date.now() - 3600000),
        estimatedResolution: new Date(Date.now() + 3600000),
        affectedSystems: ['Email System', 'User Accounts'],
        impactLevel: 'medium',
        responseTeam: ['Mike Rodriguez', 'Alex Johnson']
      },
      {
        id: 'inc-003',
        title: 'DDoS Attack on Web Services',
        description: 'Distributed denial of service attack affecting web service availability',
        severity: 'high',
        status: 'recovery',
        category: 'ddos',
        reportedBy: 'Network Operations',
        assignedTo: 'Alex Johnson',
        createdAt: new Date(Date.now() - 14400000),
        updatedAt: new Date(Date.now() - 900000),
        estimatedResolution: new Date(Date.now() + 1800000),
        affectedSystems: ['Web Servers', 'Load Balancer', 'CDN'],
        impactLevel: 'high',
        responseTeam: ['Alex Johnson', 'Network Team']
      }
    ];

    const mockActions: ResponseAction[] = [
      {
        id: 'action-001',
        incidentId: 'inc-001',
        action: 'Isolate Affected Systems',
        description: 'Isolate customer database and related systems to prevent further compromise',
        assignedTo: 'Sarah Chen',
        status: 'completed',
        createdAt: new Date(Date.now() - 3000000),
        completedAt: new Date(Date.now() - 2700000),
        dependencies: []
      },
      {
        id: 'action-002',
        incidentId: 'inc-001',
        action: 'Forensic Analysis',
        description: 'Conduct detailed forensic analysis of compromised systems',
        assignedTo: 'Mike Rodriguez',
        status: 'in_progress',
        createdAt: new Date(Date.now() - 2700000),
        dependencies: ['action-001']
      },
      {
        id: 'action-003',
        incidentId: 'inc-001',
        action: 'Customer Notification',
        description: 'Prepare and send customer breach notification',
        assignedTo: 'Legal Team',
        status: 'pending',
        createdAt: new Date(Date.now() - 2400000),
        dependencies: ['action-002']
      }
    ];

    const mockPlaybooks: Playbook[] = [
      {
        id: 'pb-001',
        name: 'Data Breach Response',
        category: 'data_breach',
        description: 'Comprehensive response plan for data breach incidents',
        estimatedTime: 480,
        lastUsed: new Date(Date.now() - 86400000),
        steps: [
          {
            id: 'step-001',
            title: 'Initial Assessment',
            description: 'Assess scope and severity of the breach',
            estimatedTime: 30,
            dependencies: [],
            automatable: false
          },
          {
            id: 'step-002',
            title: 'System Isolation',
            description: 'Isolate affected systems to prevent further damage',
            estimatedTime: 15,
            dependencies: ['step-001'],
            automatable: true
          },
          {
            id: 'step-003',
            title: 'Evidence Collection',
            description: 'Collect and preserve digital evidence',
            estimatedTime: 60,
            dependencies: ['step-002'],
            automatable: false
          }
        ]
      },
      {
        id: 'pb-002',
        name: 'DDoS Mitigation',
        category: 'ddos',
        description: 'Standard operating procedure for DDoS attack response',
        estimatedTime: 120,
        lastUsed: new Date(Date.now() - 172800000),
        steps: [
          {
            id: 'step-004',
            title: 'Traffic Analysis',
            description: 'Analyze attack traffic patterns and sources',
            estimatedTime: 20,
            dependencies: [],
            automatable: true
          },
          {
            id: 'step-005',
            title: 'Rate Limiting',
            description: 'Implement rate limiting and traffic filtering',
            estimatedTime: 10,
            dependencies: ['step-004'],
            automatable: true
          },
          {
            id: 'step-006',
            title: 'Upstream Mitigation',
            description: 'Coordinate with ISP for upstream filtering',
            estimatedTime: 30,
            dependencies: ['step-005'],
            automatable: false
          }
        ]
      }
    ];

    setIncidents(mockIncidents);
    setResponseActions(mockActions);
    setPlaybooks(mockPlaybooks);
    setLoading(false);
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesSeverity = filterSeverity === 'all' || incident.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || incident.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSeverity && matchesStatus && matchesSearch;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'cads-severity-critical';
      case 'high': return 'cads-severity-high';
      case 'medium': return 'cads-severity-medium';
      case 'low': return 'cads-severity-low';
      default: return 'cads-severity-low';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'cads-status-open';
      case 'investigating': return 'cads-status-investigating';
      case 'containment': return 'cads-status-containment';
      case 'eradication': return 'cads-status-eradication';
      case 'recovery': return 'cads-status-recovery';
      case 'closed': return 'cads-status-closed';
      default: return 'cads-status-open';
    }
  };

  const getActionStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'cads-action-pending';
      case 'in_progress': return 'cads-action-in-progress';
      case 'completed': return 'cads-action-completed';
      case 'blocked': return 'cads-action-blocked';
      default: return 'cads-action-pending';
    }
  };

  if (loading) {
    return (
      <div className="cads-loading">
        <div className="cads-loading-spinner"></div>
        <p>Loading incident response...</p>
      </div>
    );
  }

  return (
    <div className="cads-incident-response">
      {/* Header */}
      <div className="cads-section-header">
        <div className="cads-header-content">
          <div className="cads-header-info">
            <h2 className="cads-section-title">
              <AlertCircle className="cads-icon" />
              Incident Response
            </h2>
            <p className="cads-section-description">
              Manage security incidents and coordinate response activities
            </p>
          </div>
          <div className="cads-header-controls">
            <button 
              onClick={loadIncidentData} 
              className="cads-btn cads-btn-secondary"
              aria-label="Refresh incident data"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button className="cads-btn cads-btn-primary">
              <AlertCircle size={16} />
              Create Incident
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="cads-tab-navigation">
        <button
          className={`cads-tab ${activeTab === 'incidents' ? 'cads-tab-active' : ''}`}
          onClick={() => setActiveTab('incidents')}
        >
          <AlertCircle size={16} />
          Incidents ({incidents.length})
        </button>
        <button
          className={`cads-tab ${activeTab === 'actions' ? 'cads-tab-active' : ''}`}
          onClick={() => setActiveTab('actions')}
        >
          <CheckCircle size={16} />
          Actions ({responseActions.length})
        </button>
        <button
          className={`cads-tab ${activeTab === 'playbooks' ? 'cads-tab-active' : ''}`}
          onClick={() => setActiveTab('playbooks')}
        >
          <FileText size={16} />
          Playbooks ({playbooks.length})
        </button>
      </div>

      {/* Incidents Tab */}
      {activeTab === 'incidents' && (
        <div className="cads-incidents-section">
          {/* Filters */}
          <div className="cads-filters-section">
            <div className="cads-filter-group">
              <div className="cads-search-box">
                <Search size={16} className="cads-search-icon" />
                <input
                  type="text"
                  placeholder="Search incidents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="cads-search-input"
                  aria-label="Search incidents"
                />
              </div>
              
              <select 
                value={filterSeverity} 
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="cads-select"
                aria-label="Filter by severity"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="cads-select"
                aria-label="Filter by status"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="containment">Containment</option>
                <option value="eradication">Eradication</option>
                <option value="recovery">Recovery</option>
                <option value="closed">Closed</option>
              </select>

              <button 
                className="cads-btn cads-btn-secondary"
                aria-label="Export incident data"
              >
                <Download size={16} />
                Export
              </button>
            </div>
          </div>

          {/* Incident List */}
          <div className="cads-incident-list">
            {filteredIncidents.map((incident, index) => (
              <motion.div
                key={incident.id}
                className="cads-incident-card"
                whileHover={{ scale: 1.01, y: -2 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedIncident(incident)}
              >
                <div className="cads-incident-header">
                  <div className={`cads-severity-badge ${getSeverityColor(incident.severity)}`}>
                    {incident.severity.toUpperCase()}
                  </div>
                  <div className={`cads-status-badge ${getStatusColor(incident.status)}`}>
                    {incident.status.replace('_', ' ').toUpperCase()}
                  </div>
                  <div className="cads-incident-id">#{incident.id}</div>
                </div>

                <div className="cads-incident-content">
                  <h3 className="cads-incident-title">{incident.title}</h3>
                  <p className="cads-incident-description">{incident.description}</p>
                  
                  <div className="cads-incident-details">
                    <div className="cads-incident-detail">
                      <Users size={14} />
                      <span>Assigned to: {incident.assignedTo}</span>
                    </div>
                    <div className="cads-incident-detail">
                      <Clock size={14} />
                      <span>Created: {incident.createdAt.toLocaleString()}</span>
                    </div>
                    <div className="cads-incident-detail">
                      <Target size={14} />
                      <span>Impact: {incident.impactLevel}</span>
                    </div>
                  </div>

                  <div className="cads-incident-systems">
                    <span className="cads-label">Affected Systems:</span>
                    {incident.affectedSystems.map((system, idx) => (
                      <span key={idx} className="cads-system-tag">
                        {system}
                      </span>
                    ))}
                  </div>

                  <div className="cads-incident-team">
                    <span className="cads-label">Response Team:</span>
                    {incident.responseTeam.map((member, idx) => (
                      <span key={idx} className="cads-team-member">
                        {member}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="cads-incident-timeline">
                  <div className="cads-timeline-item">
                    <span className="cads-label">ETA Resolution:</span>
                    <span className="cads-value">{incident.estimatedResolution.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredIncidents.length === 0 && (
            <div className="cads-empty-state">
              <AlertCircle size={48} className="cads-empty-icon" />
              <h3>No incidents found</h3>
              <p>No incidents match your current filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Actions Tab */}
      {activeTab === 'actions' && (
        <div className="cads-actions-section">
          <div className="cads-actions-list">
            {responseActions.map((action, index) => (
              <motion.div
                key={action.id}
                className="cads-action-card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="cads-action-header">
                  <div className={`cads-action-status-badge ${getActionStatusColor(action.status)}`}>
                    {action.status.replace('_', ' ').toUpperCase()}
                  </div>
                  <div className="cads-action-incident">
                    Incident: {action.incidentId}
                  </div>
                </div>

                <div className="cads-action-content">
                  <h4 className="cads-action-title">{action.action}</h4>
                  <p className="cads-action-description">{action.description}</p>
                  
                  <div className="cads-action-details">
                    <div className="cads-action-detail">
                      <span className="cads-label">Assigned:</span>
                      <span className="cads-value">{action.assignedTo}</span>
                    </div>
                    <div className="cads-action-detail">
                      <span className="cads-label">Created:</span>
                      <span className="cads-value">{action.createdAt.toLocaleString()}</span>
                    </div>
                    {action.completedAt && (
                      <div className="cads-action-detail">
                        <span className="cads-label">Completed:</span>
                        <span className="cads-value">{action.completedAt.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {action.dependencies.length > 0 && (
                    <div className="cads-action-dependencies">
                      <span className="cads-label">Dependencies:</span>
                      {action.dependencies.map((dep, idx) => (
                        <span key={idx} className="cads-dependency-tag">
                          {dep}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Playbooks Tab */}
      {activeTab === 'playbooks' && (
        <div className="cads-playbooks-section">
          <div className="cads-playbooks-list">
            {playbooks.map((playbook, index) => (
              <motion.div
                key={playbook.id}
                className="cads-playbook-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="cads-playbook-header">
                  <h3 className="cads-playbook-title">{playbook.name}</h3>
                  <div className="cads-playbook-category">{playbook.category}</div>
                </div>

                <div className="cads-playbook-content">
                  <p className="cads-playbook-description">{playbook.description}</p>
                  
                  <div className="cads-playbook-stats">
                    <div className="cads-playbook-stat">
                      <span className="cads-label">Steps:</span>
                      <span className="cads-value">{playbook.steps.length}</span>
                    </div>
                    <div className="cads-playbook-stat">
                      <span className="cads-label">Est. Time:</span>
                      <span className="cads-value">{playbook.estimatedTime}min</span>
                    </div>
                    {playbook.lastUsed && (
                      <div className="cads-playbook-stat">
                        <span className="cads-label">Last Used:</span>
                        <span className="cads-value">{playbook.lastUsed.toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="cads-playbook-steps">
                    {playbook.steps.slice(0, 3).map((step, idx) => (
                      <div key={step.id} className="cads-playbook-step-preview">
                        <div className="cads-step-number">{idx + 1}</div>
                        <div className="cads-step-content">
                          <div className="cads-step-title">{step.title}</div>
                          <div className="cads-step-time">{step.estimatedTime}min</div>
                        </div>
                        {step.automatable && (
                          <div className="cads-step-auto">
                            <Play size={12} />
                          </div>
                        )}
                      </div>
                    ))}
                    {playbook.steps.length > 3 && (
                      <div className="cads-playbook-more">
                        +{playbook.steps.length - 3} more steps
                      </div>
                    )}
                  </div>
                </div>

                <div className="cads-playbook-actions">
                  <button className="cads-btn cads-btn-secondary">
                    View Details
                  </button>
                  <button className="cads-btn cads-btn-primary">
                    <Play size={16} />
                    Execute
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <motion.div
          className="cads-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedIncident(null)}
        >
          <motion.div
            className="cads-modal-content cads-incident-detail-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cads-modal-header">
              <h3>Incident Details - {selectedIncident.title}</h3>
              <button 
                onClick={() => setSelectedIncident(null)} 
                className="cads-modal-close"
                aria-label="Close incident details"
              >
                ×
              </button>
            </div>

            <div className="cads-modal-body">
              <div className="cads-incident-detail-tabs">
                <div className="cads-incident-overview">
                  <div className="cads-detail-grid">
                    <div className="cads-detail-section">
                      <h4>Incident Information</h4>
                      <div className="cads-detail-row">
                        <span className="cads-label">ID:</span>
                        <span className="cads-value">{selectedIncident.id}</span>
                      </div>
                      <div className="cads-detail-row">
                        <span className="cads-label">Category:</span>
                        <span className="cads-value">{selectedIncident.category}</span>
                      </div>
                      <div className="cads-detail-row">
                        <span className="cads-label">Severity:</span>
                        <span className={`cads-value ${getSeverityColor(selectedIncident.severity)}`}>
                          {selectedIncident.severity.toUpperCase()}
                        </span>
                      </div>
                      <div className="cads-detail-row">
                        <span className="cads-label">Status:</span>
                        <span className={`cads-value ${getStatusColor(selectedIncident.status)}`}>
                          {selectedIncident.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="cads-detail-section">
                      <h4>Assignment</h4>
                      <div className="cads-detail-row">
                        <span className="cads-label">Reported By:</span>
                        <span className="cads-value">{selectedIncident.reportedBy}</span>
                      </div>
                      <div className="cads-detail-row">
                        <span className="cads-label">Assigned To:</span>
                        <span className="cads-value">{selectedIncident.assignedTo}</span>
                      </div>
                      <div className="cads-detail-row">
                        <span className="cads-label">Response Team:</span>
                        <span className="cads-value">{selectedIncident.responseTeam.join(', ')}</span>
                      </div>
                    </div>

                    <div className="cads-detail-section">
                      <h4>Timeline</h4>
                      <div className="cads-detail-row">
                        <span className="cads-label">Created:</span>
                        <span className="cads-value">{selectedIncident.createdAt.toLocaleString()}</span>
                      </div>
                      <div className="cads-detail-row">
                        <span className="cads-label">Updated:</span>
                        <span className="cads-value">{selectedIncident.updatedAt.toLocaleString()}</span>
                      </div>
                      <div className="cads-detail-row">
                        <span className="cads-label">ETA Resolution:</span>
                        <span className="cads-value">{selectedIncident.estimatedResolution.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="cads-detail-section cads-full-width">
                      <h4>Description</h4>
                      <p className="cads-description">{selectedIncident.description}</p>
                    </div>

                    <div className="cads-detail-section cads-full-width">
                      <h4>Affected Systems</h4>
                      <div className="cads-systems-list">
                        {selectedIncident.affectedSystems.map((system, idx) => (
                          <div key={idx} className="cads-system-item">
                            <AlertTriangle size={16} />
                            {system}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="cads-modal-footer">
              <button className="cads-btn cads-btn-secondary">
                <MessageCircle size={16} />
                Add Comment
              </button>
              <button className="cads-btn cads-btn-warning">
                <Phone size={16} />
                Escalate
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

export default IncidentResponse;
