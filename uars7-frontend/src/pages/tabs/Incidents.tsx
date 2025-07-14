import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, Shield, Eye, Search } from 'lucide-react';

const Incidents: React.FC = () => {
  const [filter, setFilter] = useState('all');
  
  const incidents = [
    {
      id: 'INC-001',
      title: 'SQL Injection Attempt Detected',
      severity: 'high',
      status: 'active',
      timestamp: '2025-07-11 22:15:30',
      source: '192.168.1.45',
      description: 'Multiple SQL injection attempts detected from external IP'
    },
    {
      id: 'INC-002',
      title: 'Suspicious Network Traffic',
      severity: 'medium',
      status: 'investigating',
      timestamp: '2025-07-11 21:45:12',
      source: '10.0.0.23',
      description: 'Unusual data transfer patterns detected'
    },
    {
      id: 'INC-003',
      title: 'Failed Authentication Attempts',
      severity: 'low',
      status: 'resolved',
      timestamp: '2025-07-11 20:30:45',
      source: '203.0.113.5',
      description: 'Multiple failed login attempts from external source'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="portal-incidents-page"
    >
      <div className="portal-page-header portal-mb-6">
        <h1 className="portal-text-3xl portal-font-bold portal-mb-2">Security Incidents</h1>
        <p className="portal-text-secondary">Monitor and manage security incidents across your infrastructure</p>
      </div>

      <div className="portal-incidents-controls portal-flex portal-justify-between portal-items-center portal-mb-6">
        <div className="portal-flex portal-gap-4">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="portal-px-3 portal-py-2 portal-rounded portal-border"
          >
            <option value="all">All Incidents</option>
            <option value="high">High Severity</option>
            <option value="medium">Medium Severity</option>
            <option value="low">Low Severity</option>
          </select>
          
          <div className="portal-search-box portal-flex portal-items-center portal-gap-2 portal-px-3 portal-py-2 portal-border portal-rounded">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search incidents..." 
              className="portal-border-none portal-outline-none"
            />
          </div>
        </div>
        
        <button className="portal-btn portal-btn-primary">
          <AlertTriangle size={16} />
          Create Incident
        </button>
      </div>

      <div className="portal-incidents-grid portal-space-y-4">
        {incidents.map((incident) => (
          <motion.div
            key={incident.id}
            className="portal-incident-card portal-bg-surface portal-rounded-lg portal-p-6 portal-border"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="portal-flex portal-justify-between portal-items-start portal-mb-4">
              <div className="portal-flex portal-items-center portal-gap-3">
                <div className={`portal-severity-indicator ${incident.severity}`}>
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <h3 className="portal-text-lg portal-font-semibold">{incident.title}</h3>
                  <p className="portal-text-sm portal-text-secondary">{incident.id}</p>
                </div>
              </div>
              <span className={`portal-status-badge ${incident.status}`}>
                {incident.status}
              </span>
            </div>
            
            <p className="portal-text-secondary portal-mb-4">{incident.description}</p>
            
            <div className="portal-incident-meta portal-flex portal-justify-between portal-items-center">
              <div className="portal-flex portal-items-center portal-gap-4 portal-text-sm portal-text-secondary">
                <span className="portal-flex portal-items-center portal-gap-1">
                  <Clock size={14} />
                  {incident.timestamp}
                </span>
                <span className="portal-flex portal-items-center portal-gap-1">
                  <Shield size={14} />
                  {incident.source}
                </span>
              </div>
              
              <button className="portal-btn portal-btn-secondary portal-btn-sm">
                <Eye size={14} />
                Investigate
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Incidents;
