import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileCheck,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Filter,
  Search,
  Calendar,
  Target,
  Database,
  Server
} from 'lucide-react';

interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  version: string;
  totalControls: number;
  implementedControls: number;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_assessed';
  lastAssessment: Date;
  nextAssessment: Date;
  auditor: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
}

interface ComplianceControl {
  id: string;
  frameworkId: string;
  controlId: string;
  title: string;
  description: string;
  category: string;
  status: 'implemented' | 'not_implemented' | 'partially_implemented' | 'not_applicable';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  owner: string;
  implementationDate?: Date;
  lastReview: Date;
  nextReview: Date;
  evidence: Evidence[];
  findings: Finding[];
}

interface Evidence {
  id: string;
  type: 'document' | 'screenshot' | 'configuration' | 'log' | 'policy';
  title: string;
  description: string;
  uploadedBy: string;
  uploadedAt: Date;
  fileSize?: number;
  verified: boolean;
}

interface Finding {
  id: string;
  type: 'deficiency' | 'observation' | 'recommendation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  discoveredBy: string;
  discoveredAt: Date;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
  remediation: string;
  dueDate: Date;
}

interface AuditReport {
  id: string;
  frameworkId: string;
  title: string;
  auditPeriod: {
    start: Date;
    end: Date;
  };
  auditor: string;
  status: 'draft' | 'in_review' | 'final' | 'published';
  overallRating: 'satisfactory' | 'needs_improvement' | 'unsatisfactory';
  controlsAssessed: number;
  findingsCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  createdAt: Date;
  publishedAt?: Date;
}

const ComplianceAudit: React.FC = () => {
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [controls, setControls] = useState<ComplianceControl[]>([]);
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'frameworks' | 'controls' | 'reports' | 'findings'>('frameworks');
  const [selectedFramework, setSelectedFramework] = useState<ComplianceFramework | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    setLoading(true);
    
    // Mock data
    const mockFrameworks: ComplianceFramework[] = [
      {
        id: 'fw-001',
        name: 'SOC 2 Type II',
        description: 'System and Organization Controls 2 Type II audit framework',
        version: '2017',
        totalControls: 64,
        implementedControls: 58,
        status: 'partial',
        lastAssessment: new Date(Date.now() - 2592000000), // 30 days ago
        nextAssessment: new Date(Date.now() + 7776000000), // 90 days from now
        auditor: 'PricewaterhouseCoopers',
        criticality: 'critical'
      },
      {
        id: 'fw-002',
        name: 'ISO 27001',
        description: 'Information Security Management System standard',
        version: '2013',
        totalControls: 114,
        implementedControls: 102,
        status: 'compliant',
        lastAssessment: new Date(Date.now() - 5184000000), // 60 days ago
        nextAssessment: new Date(Date.now() + 25920000000), // 300 days from now
        auditor: 'Deloitte',
        criticality: 'high'
      },
      {
        id: 'fw-003',
        name: 'GDPR',
        description: 'General Data Protection Regulation compliance',
        version: '2018',
        totalControls: 32,
        implementedControls: 30,
        status: 'compliant',
        lastAssessment: new Date(Date.now() - 7776000000), // 90 days ago
        nextAssessment: new Date(Date.now() + 7776000000), // 90 days from now
        auditor: 'KPMG',
        criticality: 'critical'
      }
    ];

    const mockControls: ComplianceControl[] = [
      {
        id: 'ctrl-001',
        frameworkId: 'fw-001',
        controlId: 'CC6.1',
        title: 'Logical and Physical Access Controls',
        description: 'Logical and physical access controls restrict access to system resources',
        category: 'Access Controls',
        status: 'implemented',
        riskLevel: 'high',
        owner: 'IT Security Team',
        implementationDate: new Date(Date.now() - 15552000000), // 180 days ago
        lastReview: new Date(Date.now() - 2592000000), // 30 days ago
        nextReview: new Date(Date.now() + 2592000000), // 30 days from now
        evidence: [
          {
            id: 'ev-001',
            type: 'policy',
            title: 'Access Control Policy',
            description: 'Comprehensive access control policy document',
            uploadedBy: 'Sarah Chen',
            uploadedAt: new Date(Date.now() - 1296000000), // 15 days ago
            verified: true
          }
        ],
        findings: []
      },
      {
        id: 'ctrl-002',
        frameworkId: 'fw-001',
        controlId: 'CC6.7',
        title: 'Data Transmission Controls',
        description: 'Data transmission is protected during transit',
        category: 'Data Protection',
        status: 'partially_implemented',
        riskLevel: 'medium',
        owner: 'Network Team',
        lastReview: new Date(Date.now() - 1296000000), // 15 days ago
        nextReview: new Date(Date.now() + 1296000000), // 15 days from now
        evidence: [
          {
            id: 'ev-002',
            type: 'configuration',
            title: 'TLS Configuration',
            description: 'SSL/TLS configuration evidence',
            uploadedBy: 'Network Admin',
            uploadedAt: new Date(Date.now() - 864000000), // 10 days ago
            verified: false
          }
        ],
        findings: [
          {
            id: 'find-001',
            type: 'deficiency',
            severity: 'medium',
            title: 'Weak Cipher Suites Detected',
            description: 'Some systems are using deprecated cipher suites for encryption',
            discoveredBy: 'External Auditor',
            discoveredAt: new Date(Date.now() - 1296000000), // 15 days ago
            status: 'in_progress',
            remediation: 'Update cipher suite configuration to use only approved strong ciphers',
            dueDate: new Date(Date.now() + 1296000000) // 15 days from now
          }
        ]
      }
    ];

    const mockReports: AuditReport[] = [
      {
        id: 'rpt-001',
        frameworkId: 'fw-001',
        title: 'SOC 2 Type II Annual Audit Report',
        auditPeriod: {
          start: new Date(Date.now() - 31536000000), // 1 year ago
          end: new Date(Date.now() - 2592000000) // 30 days ago
        },
        auditor: 'PricewaterhouseCoopers',
        status: 'final',
        overallRating: 'needs_improvement',
        controlsAssessed: 64,
        findingsCount: {
          critical: 1,
          high: 3,
          medium: 8,
          low: 12
        },
        createdAt: new Date(Date.now() - 2592000000), // 30 days ago
        publishedAt: new Date(Date.now() - 1296000000) // 15 days ago
      },
      {
        id: 'rpt-002',
        frameworkId: 'fw-002',
        title: 'ISO 27001 Certification Audit',
        auditPeriod: {
          start: new Date(Date.now() - 7776000000), // 90 days ago
          end: new Date(Date.now() - 5184000000) // 60 days ago
        },
        auditor: 'Deloitte',
        status: 'published',
        overallRating: 'satisfactory',
        controlsAssessed: 114,
        findingsCount: {
          critical: 0,
          high: 1,
          medium: 4,
          low: 7
        },
        createdAt: new Date(Date.now() - 5184000000), // 60 days ago
        publishedAt: new Date(Date.now() - 4320000000) // 50 days ago
      }
    ];

    setFrameworks(mockFrameworks);
    setControls(mockControls);
    setReports(mockReports);
    setLoading(false);
  };

  const getFrameworkStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'cads-status-compliant';
      case 'partial': return 'cads-status-partial';
      case 'non_compliant': return 'cads-status-non-compliant';
      case 'not_assessed': return 'cads-status-not-assessed';
      default: return 'cads-status-not-assessed';
    }
  };

  const getControlStatusColor = (status: string) => {
    switch (status) {
      case 'implemented': return 'cads-control-implemented';
      case 'partially_implemented': return 'cads-control-partial';
      case 'not_implemented': return 'cads-control-not-implemented';
      case 'not_applicable': return 'cads-control-not-applicable';
      default: return 'cads-control-not-implemented';
    }
  };

  const getRiskLevelColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'cads-risk-critical';
      case 'high': return 'cads-risk-high';
      case 'medium': return 'cads-risk-medium';
      case 'low': return 'cads-risk-low';
      default: return 'cads-risk-low';
    }
  };

  const calculateCompliancePercentage = (framework: ComplianceFramework) => {
    return Math.round((framework.implementedControls / framework.totalControls) * 100);
  };

  if (loading) {
    return (
      <div className="cads-loading">
        <div className="cads-loading-spinner"></div>
        <p>Loading compliance data...</p>
      </div>
    );
  }

  return (
    <div className="cads-compliance-audit">
      {/* Header */}
      <div className="cads-section-header">
        <div className="cads-header-content">
          <div className="cads-header-info">
            <h2 className="cads-section-title">
              <FileCheck className="cads-icon" />
              Compliance & Audit
            </h2>
            <p className="cads-section-description">
              Monitor compliance frameworks, controls, and audit findings
            </p>
          </div>
          <div className="cads-header-controls">
            <button 
              onClick={loadComplianceData} 
              className="cads-btn cads-btn-secondary"
              aria-label="Refresh compliance data"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button className="cads-btn cads-btn-primary">
              <FileText size={16} />
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="cads-compliance-overview">
        <div className="cads-overview-metrics">
          <motion.div 
            className="cads-metric-card cads-metric-success"
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="cads-metric-icon">
              <CheckCircle size={24} />
            </div>
            <div className="cads-metric-content">
              <div className="cads-metric-value">
                {frameworks.filter(f => f.status === 'compliant').length}
              </div>
              <div className="cads-metric-label">Compliant Frameworks</div>
            </div>
          </motion.div>

          <motion.div 
            className="cads-metric-card cads-metric-warning"
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="cads-metric-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="cads-metric-content">
              <div className="cads-metric-value">
                {controls.filter(c => c.findings.length > 0).length}
              </div>
              <div className="cads-metric-label">Controls with Findings</div>
            </div>
          </motion.div>

          <motion.div 
            className="cads-metric-card cads-metric-info"
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="cads-metric-icon">
              <Calendar size={24} />
            </div>
            <div className="cads-metric-content">
              <div className="cads-metric-value">
                {frameworks.filter(f => 
                  (f.nextAssessment.getTime() - Date.now()) < 30 * 24 * 60 * 60 * 1000
                ).length}
              </div>
              <div className="cads-metric-label">Upcoming Assessments</div>
            </div>
          </motion.div>

          <motion.div 
            className="cads-metric-card cads-metric-primary"
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="cads-metric-icon">
              <BarChart3 size={24} />
            </div>
            <div className="cads-metric-content">
              <div className="cads-metric-value">
                {Math.round(
                  frameworks.reduce((sum, f) => sum + calculateCompliancePercentage(f), 0) / frameworks.length
                )}%
              </div>
              <div className="cads-metric-label">Avg Compliance</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="cads-tab-navigation">
        <button
          className={`cads-tab ${activeTab === 'frameworks' ? 'cads-tab-active' : ''}`}
          onClick={() => setActiveTab('frameworks')}
        >
          <Shield size={16} />
          Frameworks ({frameworks.length})
        </button>
        <button
          className={`cads-tab ${activeTab === 'controls' ? 'cads-tab-active' : ''}`}
          onClick={() => setActiveTab('controls')}
        >
          <CheckCircle size={16} />
          Controls ({controls.length})
        </button>
        <button
          className={`cads-tab ${activeTab === 'reports' ? 'cads-tab-active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <FileText size={16} />
          Reports ({reports.length})
        </button>
        <button
          className={`cads-tab ${activeTab === 'findings' ? 'cads-tab-active' : ''}`}
          onClick={() => setActiveTab('findings')}
        >
          <AlertTriangle size={16} />
          Findings ({controls.reduce((sum, c) => sum + c.findings.length, 0)})
        </button>
      </div>

      {/* Frameworks Tab */}
      {activeTab === 'frameworks' && (
        <div className="cads-frameworks-section">
          <div className="cads-frameworks-grid">
            {frameworks.map((framework, index) => (
              <motion.div
                key={framework.id}
                className="cads-framework-card"
                whileHover={{ scale: 1.02, y: -2 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedFramework(framework)}
              >
                <div className="cads-framework-header">
                  <div className={`cads-framework-status ${getFrameworkStatusColor(framework.status)}`}>
                    {framework.status.replace('_', ' ').toUpperCase()}
                  </div>
                  <div className={`cads-criticality-badge ${getRiskLevelColor(framework.criticality)}`}>
                    {framework.criticality.toUpperCase()}
                  </div>
                </div>

                <div className="cads-framework-content">
                  <h3 className="cads-framework-title">{framework.name}</h3>
                  <p className="cads-framework-description">{framework.description}</p>
                  
                  <div className="cads-framework-stats">
                    <div className="cads-framework-stat">
                      <span className="cads-label">Version:</span>
                      <span className="cads-value">{framework.version}</span>
                    </div>
                    <div className="cads-framework-stat">
                      <span className="cads-label">Auditor:</span>
                      <span className="cads-value">{framework.auditor}</span>
                    </div>
                  </div>

                  <div className="cads-framework-progress">
                    <div className="cads-progress-header">
                      <span>Implementation Progress</span>
                      <span>{calculateCompliancePercentage(framework)}%</span>
                    </div>
                    <div className="cads-progress-bar">
                      <div 
                        className="cads-progress-fill"
                        style={{ width: `${calculateCompliancePercentage(framework)}%` }}
                      ></div>
                    </div>
                    <div className="cads-progress-details">
                      {framework.implementedControls} of {framework.totalControls} controls implemented
                    </div>
                  </div>

                  <div className="cads-framework-timeline">
                    <div className="cads-timeline-item">
                      <Clock size={14} />
                      <span className="cads-label">Last Assessment:</span>
                      <span className="cads-value">{framework.lastAssessment.toLocaleDateString()}</span>
                    </div>
                    <div className="cads-timeline-item">
                      <Calendar size={14} />
                      <span className="cads-label">Next Assessment:</span>
                      <span className="cads-value">{framework.nextAssessment.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Controls Tab */}
      {activeTab === 'controls' && (
        <div className="cads-controls-section">
          {/* Filters */}
          <div className="cads-filters-section">
            <div className="cads-filter-group">
              <div className="cads-search-box">
                <Search size={16} className="cads-search-icon" />
                <input
                  type="text"
                  placeholder="Search controls..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="cads-search-input"
                  aria-label="Search controls"
                />
              </div>
              
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="cads-select"
                aria-label="Filter by status"
              >
                <option value="all">All Status</option>
                <option value="implemented">Implemented</option>
                <option value="partially_implemented">Partially Implemented</option>
                <option value="not_implemented">Not Implemented</option>
                <option value="not_applicable">Not Applicable</option>
              </select>

              <button 
                className="cads-btn cads-btn-secondary"
                aria-label="Export controls data"
              >
                <Download size={16} />
                Export
              </button>
            </div>
          </div>

          <div className="cads-controls-list">
            {controls
              .filter(control => 
                (filterStatus === 'all' || control.status === filterStatus) &&
                (searchTerm === '' || 
                  control.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  control.controlId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  control.description.toLowerCase().includes(searchTerm.toLowerCase())
                )
              )
              .map((control, index) => (
                <motion.div
                  key={control.id}
                  className="cads-control-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="cads-control-header">
                    <div className="cads-control-id">{control.controlId}</div>
                    <div className={`cads-control-status ${getControlStatusColor(control.status)}`}>
                      {control.status.replace('_', ' ').toUpperCase()}
                    </div>
                    <div className={`cads-risk-badge ${getRiskLevelColor(control.riskLevel)}`}>
                      {control.riskLevel.toUpperCase()}
                    </div>
                  </div>

                  <div className="cads-control-content">
                    <h4 className="cads-control-title">{control.title}</h4>
                    <p className="cads-control-description">{control.description}</p>
                    
                    <div className="cads-control-details">
                      <div className="cads-control-detail">
                        <span className="cads-label">Category:</span>
                        <span className="cads-value">{control.category}</span>
                      </div>
                      <div className="cads-control-detail">
                        <span className="cads-label">Owner:</span>
                        <span className="cads-value">{control.owner}</span>
                      </div>
                      <div className="cads-control-detail">
                        <span className="cads-label">Last Review:</span>
                        <span className="cads-value">{control.lastReview.toLocaleDateString()}</span>
                      </div>
                      <div className="cads-control-detail">
                        <span className="cads-label">Next Review:</span>
                        <span className="cads-value">{control.nextReview.toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="cads-control-metrics">
                      <div className="cads-control-metric">
                        <FileText size={16} />
                        <span>{control.evidence.length} Evidence</span>
                      </div>
                      <div className="cads-control-metric">
                        <AlertTriangle size={16} />
                        <span>{control.findings.length} Findings</span>
                      </div>
                    </div>

                    {control.findings.length > 0 && (
                      <div className="cads-control-findings">
                        <h5>Recent Findings:</h5>
                        {control.findings.map((finding, idx) => (
                          <div key={finding.id} className="cads-finding-item">
                            <div className={`cads-finding-severity ${getRiskLevelColor(finding.severity)}`}>
                              {finding.severity.toUpperCase()}
                            </div>
                            <div className="cads-finding-content">
                              <div className="cads-finding-title">{finding.title}</div>
                              <div className="cads-finding-status">{finding.status.replace('_', ' ')}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="cads-reports-section">
          <div className="cads-reports-list">
            {reports.map((report, index) => (
              <motion.div
                key={report.id}
                className="cads-report-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.01 }}
              >
                <div className="cads-report-header">
                  <h3 className="cads-report-title">{report.title}</h3>
                  <div className="cads-report-status">
                    {report.status.replace('_', ' ').toUpperCase()}
                  </div>
                </div>

                <div className="cads-report-content">
                  <div className="cads-report-details">
                    <div className="cads-report-detail">
                      <span className="cads-label">Auditor:</span>
                      <span className="cads-value">{report.auditor}</span>
                    </div>
                    <div className="cads-report-detail">
                      <span className="cads-label">Period:</span>
                      <span className="cads-value">
                        {report.auditPeriod.start.toLocaleDateString()} - {report.auditPeriod.end.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="cads-report-detail">
                      <span className="cads-label">Overall Rating:</span>
                      <span className={`cads-value cads-rating-${report.overallRating.replace('_', '-')}`}>
                        {report.overallRating.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="cads-report-detail">
                      <span className="cads-label">Controls Assessed:</span>
                      <span className="cads-value">{report.controlsAssessed}</span>
                    </div>
                  </div>

                  <div className="cads-report-findings">
                    <h4>Findings Summary</h4>
                    <div className="cads-findings-summary">
                      <div className="cads-finding-count cads-finding-critical">
                        <span className="cads-count">{report.findingsCount.critical}</span>
                        <span className="cads-label">Critical</span>
                      </div>
                      <div className="cads-finding-count cads-finding-high">
                        <span className="cads-count">{report.findingsCount.high}</span>
                        <span className="cads-label">High</span>
                      </div>
                      <div className="cads-finding-count cads-finding-medium">
                        <span className="cads-count">{report.findingsCount.medium}</span>
                        <span className="cads-label">Medium</span>
                      </div>
                      <div className="cads-finding-count cads-finding-low">
                        <span className="cads-count">{report.findingsCount.low}</span>
                        <span className="cads-label">Low</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="cads-report-actions">
                  <button className="cads-btn cads-btn-secondary">
                    <Download size={16} />
                    Download PDF
                  </button>
                  <button className="cads-btn cads-btn-primary">
                    View Details
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Framework Detail Modal */}
      {selectedFramework && (
        <motion.div
          className="cads-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedFramework(null)}
        >
          <motion.div
            className="cads-modal-content cads-framework-detail-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cads-modal-header">
              <h3>Framework Details - {selectedFramework.name}</h3>
              <button 
                onClick={() => setSelectedFramework(null)} 
                className="cads-modal-close"
                aria-label="Close framework details"
              >
                ×
              </button>
            </div>

            <div className="cads-modal-body">
              <div className="cads-framework-detail-content">
                <div className="cads-detail-section">
                  <h4>Framework Information</h4>
                  <div className="cads-detail-row">
                    <span className="cads-label">Name:</span>
                    <span className="cads-value">{selectedFramework.name}</span>
                  </div>
                  <div className="cads-detail-row">
                    <span className="cads-label">Version:</span>
                    <span className="cads-value">{selectedFramework.version}</span>
                  </div>
                  <div className="cads-detail-row">
                    <span className="cads-label">Status:</span>
                    <span className={`cads-value ${getFrameworkStatusColor(selectedFramework.status)}`}>
                      {selectedFramework.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="cads-detail-row">
                    <span className="cads-label">Criticality:</span>
                    <span className={`cads-value ${getRiskLevelColor(selectedFramework.criticality)}`}>
                      {selectedFramework.criticality.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="cads-detail-section">
                  <h4>Implementation Status</h4>
                  <div className="cads-detail-row">
                    <span className="cads-label">Total Controls:</span>
                    <span className="cads-value">{selectedFramework.totalControls}</span>
                  </div>
                  <div className="cads-detail-row">
                    <span className="cads-label">Implemented:</span>
                    <span className="cads-value">{selectedFramework.implementedControls}</span>
                  </div>
                  <div className="cads-detail-row">
                    <span className="cads-label">Completion:</span>
                    <span className="cads-value">{calculateCompliancePercentage(selectedFramework)}%</span>
                  </div>
                </div>

                <div className="cads-detail-section">
                  <h4>Audit Information</h4>
                  <div className="cads-detail-row">
                    <span className="cads-label">Auditor:</span>
                    <span className="cads-value">{selectedFramework.auditor}</span>
                  </div>
                  <div className="cads-detail-row">
                    <span className="cads-label">Last Assessment:</span>
                    <span className="cads-value">{selectedFramework.lastAssessment.toLocaleDateString()}</span>
                  </div>
                  <div className="cads-detail-row">
                    <span className="cads-label">Next Assessment:</span>
                    <span className="cads-value">{selectedFramework.nextAssessment.toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="cads-detail-section cads-full-width">
                  <h4>Description</h4>
                  <p className="cads-description">{selectedFramework.description}</p>
                </div>
              </div>
            </div>

            <div className="cads-modal-footer">
              <button className="cads-btn cads-btn-secondary">
                View Controls
              </button>
              <button className="cads-btn cads-btn-primary">
                Schedule Assessment
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ComplianceAudit;
