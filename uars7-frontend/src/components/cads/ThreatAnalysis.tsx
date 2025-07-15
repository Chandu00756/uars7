import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Shield,
  TrendingUp,
  Activity,
  Eye,
  Target,
  Zap,
  Globe,
  Users,
  Clock,
  Database,
  Filter,
  Search,
  Download,
  RefreshCw
} from 'lucide-react';

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
  attackVector: string;
  geolocation?: {
    country: string;
    city: string;
    latitude: number;
    longitude: number;
  };
}

interface ThreatMetrics {
  totalThreats: number;
  activeThreats: number;
  blockedThreats: number;
  investigatingThreats: number;
  averageResponseTime: number;
  threatScore: number;
}

const ThreatAnalysis: React.FC = () => {
  const [threats, setThreats] = useState<ThreatEvent[]>([]);
  const [metrics, setMetrics] = useState<ThreatMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedThreat, setSelectedThreat] = useState<ThreatEvent | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    loadThreatData();
  }, [timeRange]);

  const loadThreatData = async () => {
    setLoading(true);
    
    // Mock data - replace with actual API call
    const mockThreats: ThreatEvent[] = [
      {
        id: 'threat-001',
        timestamp: new Date(),
        severity: 'critical',
        type: 'Advanced Persistent Threat',
        source: '192.168.1.100',
        target: 'db-server-01',
        description: 'Sophisticated APT campaign detected with lateral movement',
        status: 'investigating',
        confidence: 95,
        riskScore: 92,
        attackVector: 'Spear Phishing',
        geolocation: {
          country: 'Unknown',
          city: 'Unknown',
          latitude: 0,
          longitude: 0
        }
      },
      {
        id: 'threat-002',
        timestamp: new Date(Date.now() - 3600000),
        severity: 'high',
        type: 'SQL Injection',
        source: '203.0.113.45',
        target: 'web-app-02',
        description: 'Multiple SQL injection attempts detected',
        status: 'mitigated',
        confidence: 88,
        riskScore: 75,
        attackVector: 'Web Application',
        geolocation: {
          country: 'China',
          city: 'Beijing',
          latitude: 39.9042,
          longitude: 116.4074
        }
      },
      {
        id: 'threat-003',
        timestamp: new Date(Date.now() - 7200000),
        severity: 'medium',
        type: 'Brute Force Attack',
        source: '198.51.100.23',
        target: 'ssh-server',
        description: 'SSH brute force attack on administrative accounts',
        status: 'resolved',
        confidence: 92,
        riskScore: 60,
        attackVector: 'Network Service',
        geolocation: {
          country: 'Russia',
          city: 'Moscow',
          latitude: 55.7558,
          longitude: 37.6176
        }
      }
    ];

    const mockMetrics: ThreatMetrics = {
      totalThreats: 156,
      activeThreats: 23,
      blockedThreats: 89,
      investigatingThreats: 12,
      averageResponseTime: 4.2,
      threatScore: 7.8
    };

    setThreats(mockThreats);
    setMetrics(mockMetrics);
    setLoading(false);
  };

  const filteredThreats = threats.filter(threat => {
    const matchesSeverity = filterSeverity === 'all' || threat.severity === filterSeverity;
    const matchesSearch = searchTerm === '' || 
      threat.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      threat.source.includes(searchTerm) ||
      threat.target.includes(searchTerm) ||
      threat.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSeverity && matchesSearch;
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
      case 'active': return 'cads-status-active';
      case 'investigating': return 'cads-status-investigating';
      case 'mitigated': return 'cads-status-mitigated';
      case 'resolved': return 'cads-status-resolved';
      default: return 'cads-status-active';
    }
  };

  if (loading) {
    return (
      <div className="cads-loading">
        <div className="cads-loading-spinner"></div>
        <p>Loading threat analysis...</p>
      </div>
    );
  }

  return (
    <div className="cads-threat-analysis">
      {/* Header */}
      <div className="cads-section-header">
        <div className="cads-header-content">
          <div className="cads-header-info">
            <h2 className="cads-section-title">
              <AlertTriangle className="cads-icon" />
              Threat Analysis
            </h2>
            <p className="cads-section-description">
              Real-time threat detection, analysis and intelligence
            </p>
          </div>
          <div className="cads-header-controls">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="cads-select"
              aria-label="Time range filter"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <button 
              onClick={loadThreatData} 
              className="cads-btn cads-btn-secondary"
              aria-label="Refresh threat data"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="cads-metrics-grid">
          <motion.div 
            className="cads-metric-card cads-metric-critical"
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="cads-metric-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="cads-metric-content">
              <div className="cads-metric-value">{metrics.activeThreats}</div>
              <div className="cads-metric-label">Active Threats</div>
            </div>
          </motion.div>

          <motion.div 
            className="cads-metric-card cads-metric-success"
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="cads-metric-icon">
              <Shield size={24} />
            </div>
            <div className="cads-metric-content">
              <div className="cads-metric-value">{metrics.blockedThreats}</div>
              <div className="cads-metric-label">Blocked Threats</div>
            </div>
          </motion.div>

          <motion.div 
            className="cads-metric-card cads-metric-warning"
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="cads-metric-icon">
              <Eye size={24} />
            </div>
            <div className="cads-metric-content">
              <div className="cads-metric-value">{metrics.investigatingThreats}</div>
              <div className="cads-metric-label">Investigating</div>
            </div>
          </motion.div>

          <motion.div 
            className="cads-metric-card cads-metric-info"
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="cads-metric-icon">
              <Clock size={24} />
            </div>
            <div className="cads-metric-content">
              <div className="cads-metric-value">{metrics.averageResponseTime}min</div>
              <div className="cads-metric-label">Avg Response Time</div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Threat Filters */}
      <div className="cads-filters-section">
        <div className="cads-filter-group">
          <div className="cads-search-box">
            <Search size={16} className="cads-search-icon" />
            <input
              type="text"
              placeholder="Search threats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="cads-search-input"
              aria-label="Search threats"
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

          <button 
            className="cads-btn cads-btn-secondary"
            aria-label="Export threat data"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Threat List */}
      <div className="cads-threat-list">
        <motion.div 
          className="cads-threat-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {filteredThreats.map((threat, index) => (
            <motion.div
              key={threat.id}
              className="cads-threat-card"
              whileHover={{ scale: 1.02, y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedThreat(threat)}
            >
              <div className="cads-threat-header">
                <div className={`cads-severity-badge ${getSeverityColor(threat.severity)}`}>
                  {threat.severity.toUpperCase()}
                </div>
                <div className={`cads-status-badge ${getStatusColor(threat.status)}`}>
                  {threat.status.toUpperCase()}
                </div>
              </div>

              <div className="cads-threat-content">
                <h3 className="cads-threat-title">{threat.type}</h3>
                <p className="cads-threat-description">{threat.description}</p>
                
                <div className="cads-threat-details">
                  <div className="cads-threat-detail">
                    <span className="cads-label">Source:</span>
                    <span className="cads-value">{threat.source}</span>
                  </div>
                  <div className="cads-threat-detail">
                    <span className="cads-label">Target:</span>
                    <span className="cads-value">{threat.target}</span>
                  </div>
                  <div className="cads-threat-detail">
                    <span className="cads-label">Risk Score:</span>
                    <span className="cads-value">{threat.riskScore}/100</span>
                  </div>
                  <div className="cads-threat-detail">
                    <span className="cads-label">Confidence:</span>
                    <span className="cads-value">{threat.confidence}%</span>
                  </div>
                </div>
              </div>

              <div className="cads-threat-timestamp">
                {threat.timestamp.toLocaleString()}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {filteredThreats.length === 0 && (
          <div className="cads-empty-state">
            <AlertTriangle size={48} className="cads-empty-icon" />
            <h3>No threats found</h3>
            <p>No threats match your current filters.</p>
          </div>
        )}
      </div>

      {/* Threat Detail Modal */}
      {selectedThreat && (
        <motion.div
          className="cads-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedThreat(null)}
        >
          <motion.div
            className="cads-modal-content cads-threat-detail-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cads-modal-header">
              <h3>Threat Details - {selectedThreat.type}</h3>
              <button 
                onClick={() => setSelectedThreat(null)} 
                className="cads-modal-close"
                aria-label="Close threat details"
              >
                ×
              </button>
            </div>

            <div className="cads-modal-body">
              <div className="cads-threat-detail-grid">
                <div className="cads-detail-section">
                  <h4>Basic Information</h4>
                  <div className="cads-detail-row">
                    <span className="cads-label">Threat ID:</span>
                    <span className="cads-value">{selectedThreat.id}</span>
                  </div>
                  <div className="cads-detail-row">
                    <span className="cads-label">Type:</span>
                    <span className="cads-value">{selectedThreat.type}</span>
                  </div>
                  <div className="cads-detail-row">
                    <span className="cads-label">Severity:</span>
                    <span className={`cads-value ${getSeverityColor(selectedThreat.severity)}`}>
                      {selectedThreat.severity.toUpperCase()}
                    </span>
                  </div>
                  <div className="cads-detail-row">
                    <span className="cads-label">Status:</span>
                    <span className={`cads-value ${getStatusColor(selectedThreat.status)}`}>
                      {selectedThreat.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="cads-detail-section">
                  <h4>Attack Information</h4>
                  <div className="cads-detail-row">
                    <span className="cads-label">Source IP:</span>
                    <span className="cads-value">{selectedThreat.source}</span>
                  </div>
                  <div className="cads-detail-row">
                    <span className="cads-label">Target:</span>
                    <span className="cads-value">{selectedThreat.target}</span>
                  </div>
                  <div className="cads-detail-row">
                    <span className="cads-label">Attack Vector:</span>
                    <span className="cads-value">{selectedThreat.attackVector}</span>
                  </div>
                  <div className="cads-detail-row">
                    <span className="cads-label">Risk Score:</span>
                    <span className="cads-value">{selectedThreat.riskScore}/100</span>
                  </div>
                </div>

                <div className="cads-detail-section">
                  <h4>Analysis</h4>
                  <div className="cads-detail-row">
                    <span className="cads-label">Confidence:</span>
                    <span className="cads-value">{selectedThreat.confidence}%</span>
                  </div>
                  <div className="cads-detail-row">
                    <span className="cads-label">Timestamp:</span>
                    <span className="cads-value">{selectedThreat.timestamp.toLocaleString()}</span>
                  </div>
                  {selectedThreat.geolocation && (
                    <>
                      <div className="cads-detail-row">
                        <span className="cads-label">Country:</span>
                        <span className="cads-value">{selectedThreat.geolocation.country}</span>
                      </div>
                      <div className="cads-detail-row">
                        <span className="cads-label">City:</span>
                        <span className="cads-value">{selectedThreat.geolocation.city}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="cads-detail-section cads-full-width">
                  <h4>Description</h4>
                  <p className="cads-description">{selectedThreat.description}</p>
                </div>
              </div>
            </div>

            <div className="cads-modal-footer">
              <button className="cads-btn cads-btn-danger">
                Block Source
              </button>
              <button className="cads-btn cads-btn-warning">
                Escalate
              </button>
              <button className="cads-btn cads-btn-primary">
                Mark as Resolved
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ThreatAnalysis;
