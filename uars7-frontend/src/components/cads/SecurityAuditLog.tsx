import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Play,
  Pause,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Shield
} from 'lucide-react';
import './cads.css';

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  resource: string;
  outcome: 'success' | 'failure' | 'warning';
  ipAddress: string;
  userAgent: string;
  details: string;
  riskScore: number;
}

interface SecurityAuditLogProps {
  className?: string;
}

const SecurityAuditLog: React.FC<SecurityAuditLogProps> = ({ className = '' }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOutcome, setFilterOutcome] = useState<'all' | 'success' | 'failure' | 'warning'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);

  // Mock data generation
  useEffect(() => {
    generateMockLogs();
    
    if (autoRefresh) {
      const interval = setInterval(generateMockLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const generateMockLogs = () => {
    const mockActions = [
      'Cell spawned',
      'Policy evaluated',
      'Token verified',
      'Risk assessment completed',
      'Cell terminated',
      'Configuration updated',
      'Alert triggered',
      'Genome updated'
    ];

    const mockUsers = [
      'admin@portalvii.com',
      'analyst@portalvii.com',
      'operator@portalvii.com',
      'system'
    ];

    const mockResources = [
      '/cads/v1/cells',
      '/cads/v1/policies',
      '/cads/v1/tokens',
      '/cads/v1/alerts',
      '/cads/v1/genome',
      '/cads/v1/settings'
    ];

    const outcomes: Array<'success' | 'failure' | 'warning'> = ['success', 'failure', 'warning'];

    const newLogs: AuditLogEntry[] = Array.from({ length: 10 }, (_, i) => ({
      id: `log-${Date.now()}-${i}`,
      timestamp: new Date(Date.now() - Math.random() * 86400000), // Random time in last 24h
      user: mockUsers[Math.floor(Math.random() * mockUsers.length)],
      action: mockActions[Math.floor(Math.random() * mockActions.length)],
      resource: mockResources[Math.floor(Math.random() * mockResources.length)],
      outcome: outcomes[Math.floor(Math.random() * outcomes.length)],
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: 'CADS/1.0 (Security Client)',
      details: 'Automated security operation completed successfully',
      riskScore: Math.floor(Math.random() * 100)
    }));

    setLogs(prev => [...newLogs, ...prev].slice(0, 100)); // Keep last 100 logs
  };

  // Filter logs based on search and outcome filter
  useEffect(() => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterOutcome !== 'all') {
      filtered = filtered.filter(log => log.outcome === filterOutcome);
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, filterOutcome]);

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'success': return <CheckCircle size={16} className="text-green-500" />;
      case 'failure': return <XCircle size={16} className="text-red-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-yellow-500" />;
      default: return <CheckCircle size={16} className="text-gray-500" />;
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-blue-500';
    return 'text-green-500';
  };

  const handleExport = () => {
    const csvData = filteredLogs.map(log => ({
      timestamp: log.timestamp.toISOString(),
      user: log.user,
      action: log.action,
      resource: log.resource,
      outcome: log.outcome,
      ipAddress: log.ipAddress,
      riskScore: log.riskScore,
      details: log.details
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`security-audit-log ${className}`}>
      <div className="audit-log-header">
        <h3 className="audit-log-title">
          <Shield className="cads-icon" />
          Security Audit Log
        </h3>
        
        <div className="audit-log-controls">
          <div className="audit-search-group">
            <div className="audit-search-input">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="cads-input"
              />
            </div>
            
            <select
              value={filterOutcome}
              onChange={(e) => setFilterOutcome(e.target.value as any)}
              className="cads-select"
              aria-label="Filter by outcome"
            >
              <option value="all">All Outcomes</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
              <option value="warning">Warning</option>
            </select>
          </div>
          
          <div className="audit-action-buttons">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`cads-button cads-button-sm ${autoRefresh ? 'active' : ''}`}
              title={autoRefresh ? 'Pause auto-refresh' : 'Enable auto-refresh'}
            >
              {autoRefresh ? <Pause size={16} /> : <Play size={16} />}
            </button>
            
            <button
              onClick={generateMockLogs}
              className="cads-button cads-button-sm"
              disabled={loading}
              title="Refresh logs"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            
            <button
              onClick={handleExport}
              className="cads-button cads-button-sm"
              title="Export to CSV"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="audit-log-stats">
        <div className="audit-stat">
          <span className="audit-stat-label">Total Logs:</span>
          <span className="audit-stat-value">{filteredLogs.length}</span>
        </div>
        <div className="audit-stat">
          <span className="audit-stat-label">Success Rate:</span>
          <span className="audit-stat-value">
            {filteredLogs.length > 0 
              ? Math.round((filteredLogs.filter(l => l.outcome === 'success').length / filteredLogs.length) * 100)
              : 0
            }%
          </span>
        </div>
        <div className="audit-stat">
          <span className="audit-stat-label">Avg Risk Score:</span>
          <span className="audit-stat-value">
            {filteredLogs.length > 0 
              ? Math.round(filteredLogs.reduce((sum, log) => sum + log.riskScore, 0) / filteredLogs.length)
              : 0
            }
          </span>
        </div>
      </div>

      <div className="audit-log-table-container">
        <table className="audit-log-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Outcome</th>
              <th>User</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Risk Score</th>
              <th>IP Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id} className={`audit-log-row outcome-${log.outcome}`}>
                <td className="audit-timestamp">
                  <Clock size={14} />
                  {log.timestamp.toLocaleString()}
                </td>
                <td className="audit-outcome">
                  {getOutcomeIcon(log.outcome)}
                  {log.outcome}
                </td>
                <td className="audit-user">
                  <User size={14} />
                  {log.user}
                </td>
                <td className="audit-action">{log.action}</td>
                <td className="audit-resource">
                  <code>{log.resource}</code>
                </td>
                <td className={`audit-risk-score ${getRiskColor(log.riskScore)}`}>
                  {log.riskScore}
                </td>
                <td className="audit-ip">{log.ipAddress}</td>
                <td className="audit-actions">
                  <button
                    className="cads-button cads-button-xs"
                    title="View details"
                  >
                    <Eye size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredLogs.length === 0 && (
        <div className="audit-log-empty">
          <Shield size={48} className="audit-empty-icon" />
          <h4>No audit logs found</h4>
          <p>No logs match your current search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default SecurityAuditLog;
