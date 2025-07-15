import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Target,
  Eye,
  Shield,
  AlertTriangle,
  Activity,
  Database,
  Clock,
  Users,
  TrendingUp,
  BarChart3,
  Filter,
  Download,
  RefreshCw,
  Play,
  Pause,
  Crosshair,
  FileText,
  Settings,
  Globe
} from 'lucide-react';

interface ThreatHunt {
  id: string;
  title: string;
  description: string;
  hypothesis: string;
  status: 'planned' | 'active' | 'completed' | 'suspended';
  priority: 'low' | 'medium' | 'high' | 'critical';
  huntType: 'structured' | 'unstructured' | 'situational';
  methodology: string;
  dataSource: string[];
  analyst: string;
  startDate: Date;
  endDate?: Date;
  estimatedDuration: number;
  findings: HuntFinding[];
  indicators: Indicator[];
  progress: number;
}

interface HuntFinding {
  id: string;
  huntId: string;
  type: 'true_positive' | 'false_positive' | 'benign_true_positive' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  evidence: string[];
  iocs: string[];
  discoveredAt: Date;
  status: 'new' | 'investigating' | 'validated' | 'escalated' | 'closed';
  confidenceLevel: number;
  affectedAssets: string[];
}

interface Indicator {
  id: string;
  type: 'ip' | 'domain' | 'hash' | 'url' | 'email' | 'file_path' | 'registry_key';
  value: string;
  description: string;
  source: string;
  confidence: number;
  firstSeen: Date;
  lastSeen: Date;
  malicious: boolean;
  tags: string[];
}

interface HuntMetrics {
  totalHunts: number;
  activeHunts: number;
  completedHunts: number;
  findingsCount: number;
  truePositives: number;
  falsePositives: number;
  averageHuntDuration: number;
  threatCoverage: number;
}

interface HuntTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  methodology: string;
  dataSources: string[];
  estimatedTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  usageCount: number;
}

const ThreatHunting: React.FC = () => {
  const [hunts, setHunts] = useState<ThreatHunt[]>([]);
  const [templates, setTemplates] = useState<HuntTemplate[]>([]);
  const [metrics, setMetrics] = useState<HuntMetrics | null>(null);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'hunts' | 'findings' | 'indicators' | 'templates'>('hunts');
  const [selectedHunt, setSelectedHunt] = useState<ThreatHunt | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadHuntingData();
  }, []);

  const loadHuntingData = async () => {
    setLoading(true);
    
    // Mock data
    const mockHunts: ThreatHunt[] = [
      {
        id: 'hunt-001',
        title: 'Advanced Persistent Threat Campaign Detection',
        description: 'Hunt for indicators of a sophisticated APT campaign targeting financial sector',
        hypothesis: 'Adversary is using legitimate admin tools for lateral movement and persistence',
        status: 'active',
        priority: 'critical',
        huntType: 'structured',
        methodology: 'MITRE ATT&CK Framework',
        dataSource: ['Windows Event Logs', 'Network Traffic', 'EDR Telemetry', 'Email Logs'],
        analyst: 'Sarah Chen',
        startDate: new Date(Date.now() - 86400000), // 1 day ago
        estimatedDuration: 168, // 7 days in hours
        progress: 45,
        findings: [
          {
            id: 'finding-001',
            huntId: 'hunt-001',
            type: 'true_positive',
            severity: 'high',
            title: 'Suspicious PowerShell Execution',
            description: 'Detected PowerShell commands consistent with reconnaissance activities',
            evidence: ['Event ID 4688', 'PowerShell logs', 'Network connections'],
            iocs: ['powershell.exe -EncodedCommand', '10.0.1.45', 'whoami /groups'],
            discoveredAt: new Date(Date.now() - 43200000),
            status: 'investigating',
            confidenceLevel: 85,
            affectedAssets: ['WORKSTATION-001', 'WORKSTATION-015']
          }
        ],
        indicators: [
          {
            id: 'ioc-001',
            type: 'ip',
            value: '192.168.100.45',
            description: 'Suspicious IP address observed in network traffic',
            source: 'Internal Hunt',
            confidence: 85,
            firstSeen: new Date(Date.now() - 86400000),
            lastSeen: new Date(Date.now() - 3600000),
            malicious: true,
            tags: ['C2', 'APT', 'Lateral Movement']
          }
        ]
      },
      {
        id: 'hunt-002',
        title: 'Insider Threat - Data Exfiltration',
        description: 'Hunt for anomalous data access patterns indicating potential insider threat',
        hypothesis: 'Privileged user accessing unusual amounts of sensitive data outside normal patterns',
        status: 'completed',
        priority: 'high',
        huntType: 'situational',
        methodology: 'User Behavior Analytics',
        dataSource: ['Database Audit Logs', 'File Access Logs', 'VPN Logs', 'Badge Access'],
        analyst: 'Mike Rodriguez',
        startDate: new Date(Date.now() - 604800000), // 7 days ago
        endDate: new Date(Date.now() - 172800000), // 2 days ago
        estimatedDuration: 120, // 5 days in hours
        progress: 100,
        findings: [
          {
            id: 'finding-002',
            huntId: 'hunt-002',
            type: 'false_positive',
            severity: 'low',
            title: 'Legitimate Admin Activity',
            description: 'Large data access was part of approved system migration',
            evidence: ['Change ticket #CHG-2024-001', 'Manager approval email'],
            iocs: [],
            discoveredAt: new Date(Date.now() - 345600000),
            status: 'closed',
            confidenceLevel: 95,
            affectedAssets: ['DATABASE-PROD-01']
          }
        ],
        indicators: []
      },
      {
        id: 'hunt-003',
        title: 'Cryptocurrency Mining Malware',
        description: 'Hunt for cryptocurrency mining activities on corporate infrastructure',
        hypothesis: 'Malware is using corporate resources for cryptocurrency mining',
        status: 'planned',
        priority: 'medium',
        huntType: 'unstructured',
        methodology: 'Anomaly Detection',
        dataSource: ['CPU Usage Metrics', 'Network Traffic', 'Process Monitoring'],
        analyst: 'Alex Johnson',
        startDate: new Date(Date.now() + 86400000), // 1 day from now
        estimatedDuration: 72, // 3 days in hours
        progress: 0,
        findings: [],
        indicators: []
      }
    ];

    const mockTemplates: HuntTemplate[] = [
      {
        id: 'template-001',
        name: 'Living off the Land Techniques',
        description: 'Hunt for adversaries using legitimate tools for malicious purposes',
        category: 'Defense Evasion',
        methodology: 'MITRE ATT&CK T1105, T1570',
        dataSources: ['Windows Event Logs', 'Sysmon', 'PowerShell Logs'],
        estimatedTime: 96,
        difficulty: 'intermediate',
        usageCount: 12
      },
      {
        id: 'template-002',
        name: 'Command and Control Detection',
        description: 'Identify C2 communications and beaconing behavior',
        category: 'Command and Control',
        methodology: 'Network Traffic Analysis, Beaconing Detection',
        dataSources: ['Network Logs', 'DNS Logs', 'Proxy Logs'],
        estimatedTime: 120,
        difficulty: 'advanced',
        usageCount: 8
      },
      {
        id: 'template-003',
        name: 'Privilege Escalation Hunt',
        description: 'Hunt for privilege escalation techniques and indicators',
        category: 'Privilege Escalation',
        methodology: 'MITRE ATT&CK T1068, T1055',
        dataSources: ['Windows Event Logs', 'Registry Monitoring', 'Process Creation'],
        estimatedTime: 72,
        difficulty: 'beginner',
        usageCount: 15
      }
    ];

    const mockMetrics: HuntMetrics = {
      totalHunts: 24,
      activeHunts: 3,
      completedHunts: 18,
      findingsCount: 87,
      truePositives: 34,
      falsePositives: 53,
      averageHuntDuration: 4.2,
      threatCoverage: 78
    };

    const mockIndicators: Indicator[] = [
      {
        id: 'ioc-001',
        type: 'ip',
        value: '203.0.113.45',
        description: 'Known malicious IP address associated with APT group',
        source: 'Threat Intelligence Feed',
        confidence: 95,
        firstSeen: new Date(Date.now() - 2592000000), // 30 days ago
        lastSeen: new Date(Date.now() - 86400000), // 1 day ago
        malicious: true,
        tags: ['APT', 'C2', 'Exfiltration']
      },
      {
        id: 'ioc-002',
        type: 'hash',
        value: 'e3b0c44298fc1c149afbf4c8996fb924',
        description: 'SHA256 hash of malicious executable',
        source: 'Internal Analysis',
        confidence: 90,
        firstSeen: new Date(Date.now() - 1296000000), // 15 days ago
        lastSeen: new Date(Date.now() - 432000000), // 5 days ago
        malicious: true,
        tags: ['Malware', 'Trojan', 'Persistence']
      },
      {
        id: 'ioc-003',
        type: 'domain',
        value: 'malicious-domain.com',
        description: 'Command and control domain',
        source: 'External Feed',
        confidence: 88,
        firstSeen: new Date(Date.now() - 1728000000), // 20 days ago
        lastSeen: new Date(Date.now() - 172800000), // 2 days ago
        malicious: true,
        tags: ['C2', 'Domain', 'Infrastructure']
      }
    ];

    setHunts(mockHunts);
    setTemplates(mockTemplates);
    setMetrics(mockMetrics);
    setIndicators(mockIndicators);
    setLoading(false);
  };

  const filteredHunts = hunts.filter(hunt => {
    const matchesStatus = filterStatus === 'all' || hunt.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || hunt.priority === filterPriority;
    const matchesSearch = searchTerm === '' || 
      hunt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hunt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hunt.hypothesis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hunt.analyst.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'cads-status-planned';
      case 'active': return 'cads-status-active';
      case 'completed': return 'cads-status-completed';
      case 'suspended': return 'cads-status-suspended';
      default: return 'cads-status-planned';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'cads-priority-critical';
      case 'high': return 'cads-priority-high';
      case 'medium': return 'cads-priority-medium';
      case 'low': return 'cads-priority-low';
      default: return 'cads-priority-low';
    }
  };

  const getFindingTypeColor = (type: string) => {
    switch (type) {
      case 'true_positive': return 'cads-finding-true-positive';
      case 'false_positive': return 'cads-finding-false-positive';
      case 'benign_true_positive': return 'cads-finding-benign';
      case 'unknown': return 'cads-finding-unknown';
      default: return 'cads-finding-unknown';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'cads-difficulty-beginner';
      case 'intermediate': return 'cads-difficulty-intermediate';
      case 'advanced': return 'cads-difficulty-advanced';
      case 'expert': return 'cads-difficulty-expert';
      default: return 'cads-difficulty-beginner';
    }
  };

  if (loading) {
    return (
      <div className="cads-loading">
        <div className="cads-loading-spinner"></div>
        <p>Loading threat hunting data...</p>
      </div>
    );
  }

  return (
    <div className="cads-threat-hunting">
      {/* Header */}
      <div className="cads-section-header">
        <div className="cads-header-content">
          <div className="cads-header-info">
            <h2 className="cads-section-title">
              <Crosshair className="cads-icon" />
              Threat Hunting
            </h2>
            <p className="cads-section-description">
              Proactive threat hunting operations and intelligence gathering
            </p>
          </div>
          <div className="cads-header-controls">
            <button 
              onClick={loadHuntingData} 
              className="cads-btn cads-btn-secondary"
              aria-label="Refresh hunting data"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button className="cads-btn cads-btn-primary">
              <Target size={16} />
              New Hunt
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="cads-hunting-metrics">
          <motion.div 
            className="cads-metric-card cads-metric-primary"
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="cads-metric-icon">
              <Target size={24} />
            </div>
            <div className="cads-metric-content">
              <div className="cads-metric-value">{metrics.activeHunts}</div>
              <div className="cads-metric-label">Active Hunts</div>
            </div>
          </motion.div>

          <motion.div 
            className="cads-metric-card cads-metric-success"
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="cads-metric-icon">
              <Eye size={24} />
            </div>
            <div className="cads-metric-content">
              <div className="cads-metric-value">{metrics.truePositives}</div>
              <div className="cads-metric-label">True Positives</div>
            </div>
          </motion.div>

          <motion.div 
            className="cads-metric-card cads-metric-warning"
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="cads-metric-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="cads-metric-content">
              <div className="cads-metric-value">{metrics.findingsCount}</div>
              <div className="cads-metric-label">Total Findings</div>
            </div>
          </motion.div>

          <motion.div 
            className="cads-metric-card cads-metric-info"
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="cads-metric-icon">
              <BarChart3 size={24} />
            </div>
            <div className="cads-metric-content">
              <div className="cads-metric-value">{metrics.threatCoverage}%</div>
              <div className="cads-metric-label">Threat Coverage</div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="cads-tab-navigation">
        <button
          className={`cads-tab ${activeTab === 'hunts' ? 'cads-tab-active' : ''}`}
          onClick={() => setActiveTab('hunts')}
        >
          <Target size={16} />
          Hunts ({hunts.length})
        </button>
        <button
          className={`cads-tab ${activeTab === 'findings' ? 'cads-tab-active' : ''}`}
          onClick={() => setActiveTab('findings')}
        >
          <Eye size={16} />
          Findings ({hunts.reduce((sum, h) => sum + h.findings.length, 0)})
        </button>
        <button
          className={`cads-tab ${activeTab === 'indicators' ? 'cads-tab-active' : ''}`}
          onClick={() => setActiveTab('indicators')}
        >
          <AlertTriangle size={16} />
          IOCs ({indicators.length})
        </button>
        <button
          className={`cads-tab ${activeTab === 'templates' ? 'cads-tab-active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <FileText size={16} />
          Templates ({templates.length})
        </button>
      </div>

      {/* Hunts Tab */}
      {activeTab === 'hunts' && (
        <div className="cads-hunts-section">
          {/* Filters */}
          <div className="cads-filters-section">
            <div className="cads-filter-group">
              <div className="cads-search-box">
                <Search size={16} className="cads-search-icon" />
                <input
                  type="text"
                  placeholder="Search hunts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="cads-search-input"
                  aria-label="Search hunts"
                />
              </div>
              
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="cads-select"
                aria-label="Filter by status"
              >
                <option value="all">All Status</option>
                <option value="planned">Planned</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="suspended">Suspended</option>
              </select>

              <select 
                value={filterPriority} 
                onChange={(e) => setFilterPriority(e.target.value)}
                className="cads-select"
                aria-label="Filter by priority"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <button 
                className="cads-btn cads-btn-secondary"
                aria-label="Export hunts data"
              >
                <Download size={16} />
                Export
              </button>
            </div>
          </div>

          {/* Hunt List */}
          <div className="cads-hunts-list">
            {filteredHunts.map((hunt, index) => (
              <motion.div
                key={hunt.id}
                className="cads-hunt-card"
                whileHover={{ scale: 1.01, y: -2 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedHunt(hunt)}
              >
                <div className="cads-hunt-header">
                  <div className={`cads-status-badge ${getStatusColor(hunt.status)}`}>
                    {hunt.status.toUpperCase()}
                  </div>
                  <div className={`cads-priority-badge ${getPriorityColor(hunt.priority)}`}>
                    {hunt.priority.toUpperCase()}
                  </div>
                  <div className="cads-hunt-type">{hunt.huntType}</div>
                </div>

                <div className="cads-hunt-content">
                  <h3 className="cads-hunt-title">{hunt.title}</h3>
                  <p className="cads-hunt-description">{hunt.description}</p>
                  
                  <div className="cads-hunt-hypothesis">
                    <strong>Hypothesis:</strong> {hunt.hypothesis}
                  </div>

                  <div className="cads-hunt-details">
                    <div className="cads-hunt-detail">
                      <Users size={14} />
                      <span>Analyst: {hunt.analyst}</span>
                    </div>
                    <div className="cads-hunt-detail">
                      <Clock size={14} />
                      <span>Duration: {hunt.estimatedDuration}h</span>
                    </div>
                    <div className="cads-hunt-detail">
                      <Database size={14} />
                      <span>Data Sources: {hunt.dataSource.length}</span>
                    </div>
                  </div>

                  {hunt.status === 'active' && (
                    <div className="cads-hunt-progress">
                      <div className="cads-progress-header">
                        <span>Progress</span>
                        <span>{hunt.progress}%</span>
                      </div>
                      <div className="cads-progress-bar">
                        <div 
                          className="cads-progress-fill"
                          style={{ width: `${hunt.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="cads-hunt-metrics">
                    <div className="cads-hunt-metric">
                      <Eye size={16} />
                      <span>{hunt.findings.length} Findings</span>
                    </div>
                    <div className="cads-hunt-metric">
                      <AlertTriangle size={16} />
                      <span>{hunt.indicators.length} IOCs</span>
                    </div>
                  </div>

                  <div className="cads-hunt-data-sources">
                    <span className="cads-label">Data Sources:</span>
                    {hunt.dataSource.slice(0, 3).map((source, idx) => (
                      <span key={idx} className="cads-data-source-tag">
                        {source}
                      </span>
                    ))}
                    {hunt.dataSource.length > 3 && (
                      <span className="cads-more-sources">
                        +{hunt.dataSource.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="cads-hunt-footer">
                  <span className="cads-hunt-start-date">
                    Started: {hunt.startDate.toLocaleDateString()}
                  </span>
                  {hunt.endDate && (
                    <span className="cads-hunt-end-date">
                      Completed: {hunt.endDate.toLocaleDateString()}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {filteredHunts.length === 0 && (
            <div className="cads-empty-state">
              <Target size={48} className="cads-empty-icon" />
              <h3>No hunts found</h3>
              <p>No hunts match your current filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Findings Tab */}
      {activeTab === 'findings' && (
        <div className="cads-findings-section">
          <div className="cads-findings-list">
            {hunts.flatMap(hunt => hunt.findings).map((finding, index) => (
              <motion.div
                key={finding.id}
                className="cads-finding-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="cads-finding-header">
                  <div className={`cads-finding-type ${getFindingTypeColor(finding.type)}`}>
                    {finding.type.replace('_', ' ').toUpperCase()}
                  </div>
                  <div className={`cads-severity-badge ${getPriorityColor(finding.severity)}`}>
                    {finding.severity.toUpperCase()}
                  </div>
                  <div className="cads-finding-hunt">Hunt: {finding.huntId}</div>
                </div>

                <div className="cads-finding-content">
                  <h4 className="cads-finding-title">{finding.title}</h4>
                  <p className="cads-finding-description">{finding.description}</p>
                  
                  <div className="cads-finding-stats">
                    <div className="cads-finding-stat">
                      <span className="cads-label">Confidence:</span>
                      <span className="cads-value">{finding.confidenceLevel}%</span>
                    </div>
                    <div className="cads-finding-stat">
                      <span className="cads-label">Status:</span>
                      <span className="cads-value">{finding.status.replace('_', ' ')}</span>
                    </div>
                    <div className="cads-finding-stat">
                      <span className="cads-label">Assets:</span>
                      <span className="cads-value">{finding.affectedAssets.length}</span>
                    </div>
                  </div>

                  {finding.iocs.length > 0 && (
                    <div className="cads-finding-iocs">
                      <span className="cads-label">IOCs:</span>
                      {finding.iocs.slice(0, 3).map((ioc, idx) => (
                        <span key={idx} className="cads-ioc-tag">
                          {ioc}
                        </span>
                      ))}
                      {finding.iocs.length > 3 && (
                        <span className="cads-more-iocs">
                          +{finding.iocs.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="cads-finding-timestamp">
                    Discovered: {finding.discoveredAt.toLocaleString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Indicators Tab */}
      {activeTab === 'indicators' && (
        <div className="cads-indicators-section">
          <div className="cads-indicators-list">
            {indicators.map((indicator, index) => (
              <motion.div
                key={indicator.id}
                className="cads-indicator-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="cads-indicator-header">
                  <div className="cads-indicator-type">{indicator.type.toUpperCase()}</div>
                  <div className={`cads-malicious-badge ${indicator.malicious ? 'cads-malicious' : 'cads-benign'}`}>
                    {indicator.malicious ? 'MALICIOUS' : 'BENIGN'}
                  </div>
                  <div className="cads-indicator-confidence">{indicator.confidence}%</div>
                </div>

                <div className="cads-indicator-content">
                  <div className="cads-indicator-value">{indicator.value}</div>
                  <p className="cads-indicator-description">{indicator.description}</p>
                  
                  <div className="cads-indicator-details">
                    <div className="cads-indicator-detail">
                      <span className="cads-label">Source:</span>
                      <span className="cads-value">{indicator.source}</span>
                    </div>
                    <div className="cads-indicator-detail">
                      <span className="cads-label">First Seen:</span>
                      <span className="cads-value">{indicator.firstSeen.toLocaleDateString()}</span>
                    </div>
                    <div className="cads-indicator-detail">
                      <span className="cads-label">Last Seen:</span>
                      <span className="cads-value">{indicator.lastSeen.toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="cads-indicator-tags">
                    {indicator.tags.map((tag, idx) => (
                      <span key={idx} className="cads-indicator-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="cads-templates-section">
          <div className="cads-templates-grid">
            {templates.map((template, index) => (
              <motion.div
                key={template.id}
                className="cads-template-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="cads-template-header">
                  <h3 className="cads-template-name">{template.name}</h3>
                  <div className={`cads-difficulty-badge ${getDifficultyColor(template.difficulty)}`}>
                    {template.difficulty.toUpperCase()}
                  </div>
                </div>

                <div className="cads-template-content">
                  <div className="cads-template-category">{template.category}</div>
                  <p className="cads-template-description">{template.description}</p>
                  
                  <div className="cads-template-stats">
                    <div className="cads-template-stat">
                      <Clock size={14} />
                      <span>{template.estimatedTime}h</span>
                    </div>
                    <div className="cads-template-stat">
                      <Database size={14} />
                      <span>{template.dataSources.length} sources</span>
                    </div>
                    <div className="cads-template-stat">
                      <TrendingUp size={14} />
                      <span>{template.usageCount} uses</span>
                    </div>
                  </div>

                  <div className="cads-template-methodology">
                    <span className="cads-label">Methodology:</span>
                    <span className="cads-value">{template.methodology}</span>
                  </div>

                  <div className="cads-template-sources">
                    <span className="cads-label">Data Sources:</span>
                    {template.dataSources.slice(0, 2).map((source, idx) => (
                      <span key={idx} className="cads-source-tag">
                        {source}
                      </span>
                    ))}
                    {template.dataSources.length > 2 && (
                      <span className="cads-more-sources">
                        +{template.dataSources.length - 2} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="cads-template-actions">
                  <button className="cads-btn cads-btn-secondary">
                    Preview
                  </button>
                  <button className="cads-btn cads-btn-primary">
                    <Play size={16} />
                    Use Template
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Hunt Detail Modal */}
      {selectedHunt && (
        <motion.div
          className="cads-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedHunt(null)}
        >
          <motion.div
            className="cads-modal-content cads-hunt-detail-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cads-modal-header">
              <h3>Hunt Details - {selectedHunt.title}</h3>
              <button 
                onClick={() => setSelectedHunt(null)} 
                className="cads-modal-close"
                aria-label="Close hunt details"
              >
                ×
              </button>
            </div>

            <div className="cads-modal-body">
              <div className="cads-hunt-detail-tabs">
                <div className="cads-hunt-overview">
                  <div className="cads-detail-grid">
                    <div className="cads-detail-section">
                      <h4>Hunt Information</h4>
                      <div className="cads-detail-row">
                        <span className="cads-label">ID:</span>
                        <span className="cads-value">{selectedHunt.id}</span>
                      </div>
                      <div className="cads-detail-row">
                        <span className="cads-label">Type:</span>
                        <span className="cads-value">{selectedHunt.huntType}</span>
                      </div>
                      <div className="cads-detail-row">
                        <span className="cads-label">Priority:</span>
                        <span className={`cads-value ${getPriorityColor(selectedHunt.priority)}`}>
                          {selectedHunt.priority.toUpperCase()}
                        </span>
                      </div>
                      <div className="cads-detail-row">
                        <span className="cads-label">Status:</span>
                        <span className={`cads-value ${getStatusColor(selectedHunt.status)}`}>
                          {selectedHunt.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="cads-detail-section">
                      <h4>Assignment</h4>
                      <div className="cads-detail-row">
                        <span className="cads-label">Analyst:</span>
                        <span className="cads-value">{selectedHunt.analyst}</span>
                      </div>
                      <div className="cads-detail-row">
                        <span className="cads-label">Methodology:</span>
                        <span className="cads-value">{selectedHunt.methodology}</span>
                      </div>
                      <div className="cads-detail-row">
                        <span className="cads-label">Start Date:</span>
                        <span className="cads-value">{selectedHunt.startDate.toLocaleDateString()}</span>
                      </div>
                      <div className="cads-detail-row">
                        <span className="cads-label">Duration:</span>
                        <span className="cads-value">{selectedHunt.estimatedDuration}h</span>
                      </div>
                    </div>

                    <div className="cads-detail-section cads-full-width">
                      <h4>Description</h4>
                      <p className="cads-description">{selectedHunt.description}</p>
                    </div>

                    <div className="cads-detail-section cads-full-width">
                      <h4>Hypothesis</h4>
                      <p className="cads-hypothesis">{selectedHunt.hypothesis}</p>
                    </div>

                    <div className="cads-detail-section cads-full-width">
                      <h4>Data Sources</h4>
                      <div className="cads-data-sources-list">
                        {selectedHunt.dataSource.map((source, idx) => (
                          <div key={idx} className="cads-data-source-item">
                            <Database size={16} />
                            {source}
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
                View Findings
              </button>
              <button className="cads-btn cads-btn-warning">
                {selectedHunt.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                {selectedHunt.status === 'active' ? 'Pause' : 'Resume'}
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

export default ThreatHunting;
