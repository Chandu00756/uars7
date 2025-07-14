import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  RotateCcw, 
  Database, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  History,
  Play,
  Pause,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Eye,
  Zap,
  Shield,
  Server,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  Calendar,
  Timer,
  Archive,
  Rewind,
  FastForward,
  SkipBack,
  SkipForward,
  TrendingUp,
  X
} from 'lucide-react';

interface DataSnapshot {
  id: string;
  timestamp: string;
  size: string;
  type: 'full' | 'incremental' | 'differential';
  status: 'completed' | 'in_progress' | 'failed' | 'corrupted';
  integrity: number;
  location: string;
  description: string;
  dependencies: string[];
  retentionDays: number;
}

interface RollbackOperation {
  id: string;
  timestamp: string;
  targetTime: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  affectedSystems: string[];
  dataSize: string;
  estimatedTime: string;
  initiatedBy: string;
  reason: string;
}

interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'snapshot' | 'rollback' | 'data_change' | 'system_event';
  description: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  impact: string;
  duration?: string;
}

interface TemporalMetrics {
  totalSnapshots: number;
  storageUsed: string;
  retentionPeriod: string;
  averageSnapshotTime: string;
  rollbackCapability: number;
  dataIntegrity: number;
  compressionRatio: number;
  replicationStatus: string;
}

const TRDN: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'snapshots' | 'rollback' | 'timeline' | 'analytics'>('overview');
  const [selectedSnapshot, setSelectedSnapshot] = useState<DataSnapshot | null>(null);
  const [selectedRollback, setSelectedRollback] = useState<RollbackOperation | null>(null);
  const [isRealTime, setIsRealTime] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock temporal metrics
  const [metrics] = useState<TemporalMetrics>({
    totalSnapshots: 1247,
    storageUsed: '2.4 TB',
    retentionPeriod: '90 days',
    averageSnapshotTime: '3.2 min',
    rollbackCapability: 99.7,
    dataIntegrity: 100.0,
    compressionRatio: 4.2,
    replicationStatus: 'Synchronized'
  });

  // Mock snapshot data
  const [snapshots] = useState<DataSnapshot[]>([
    {
      id: 'snap-001',
      timestamp: '2025-01-11 22:00:00',
      size: '1.2 GB',
      type: 'full',
      status: 'completed',
      integrity: 100,
      location: 'Primary Storage Cluster',
      description: 'Scheduled full system snapshot',
      dependencies: [],
      retentionDays: 90
    },
    {
      id: 'snap-002',
      timestamp: '2025-01-11 21:30:00',
      size: '345 MB',
      type: 'incremental',
      status: 'completed',
      integrity: 100,
      location: 'Primary Storage Cluster',
      description: 'Incremental backup - security updates',
      dependencies: ['snap-001'],
      retentionDays: 30
    },
    {
      id: 'snap-003',
      timestamp: '2025-01-11 21:00:00',
      size: '892 MB',
      type: 'differential',
      status: 'completed',
      integrity: 99.8,
      location: 'Secondary Storage Cluster',
      description: 'Pre-deployment differential snapshot',
      dependencies: ['snap-001'],
      retentionDays: 60
    },
    {
      id: 'snap-004',
      timestamp: '2025-01-11 20:30:00',
      size: '156 MB',
      type: 'incremental',
      status: 'in_progress',
      integrity: 0,
      location: 'Primary Storage Cluster',
      description: 'Real-time incremental backup',
      dependencies: ['snap-003'],
      retentionDays: 30
    },
    {
      id: 'snap-005',
      timestamp: '2025-01-11 20:00:00',
      size: '2.1 GB',
      type: 'full',
      status: 'failed',
      integrity: 0,
      location: 'Backup Storage Cluster',
      description: 'Failed full backup - storage error',
      dependencies: [],
      retentionDays: 90
    }
  ]);

  // Mock rollback operations
  const [rollbacks] = useState<RollbackOperation[]>([
    {
      id: 'rb-001',
      timestamp: '2025-01-11 22:15:00',
      targetTime: '2025-01-11 21:00:00',
      status: 'completed',
      progress: 100,
      affectedSystems: ['Database Cluster', 'Application Servers'],
      dataSize: '1.2 GB',
      estimatedTime: '15 minutes',
      initiatedBy: 'admin@company.com',
      reason: 'Critical security vulnerability rollback'
    },
    {
      id: 'rb-002',
      timestamp: '2025-01-11 21:45:00',
      targetTime: '2025-01-11 20:30:00',
      status: 'in_progress',
      progress: 67,
      affectedSystems: ['Web Servers', 'Load Balancers'],
      dataSize: '892 MB',
      estimatedTime: '12 minutes',
      initiatedBy: 'ops@company.com',
      reason: 'Failed deployment rollback'
    },
    {
      id: 'rb-003',
      timestamp: '2025-01-11 20:15:00',
      targetTime: '2025-01-11 19:00:00',
      status: 'failed',
      progress: 34,
      affectedSystems: ['File System', 'Cache Servers'],
      dataSize: '2.4 GB',
      estimatedTime: '25 minutes',
      initiatedBy: 'security@company.com',
      reason: 'Data corruption recovery attempt'
    }
  ]);

  // Mock timeline events
  const [timelineEvents] = useState<TimelineEvent[]>([
    {
      id: 'tl-001',
      timestamp: '2025-01-11 22:30:00',
      type: 'snapshot',
      description: 'Full system snapshot completed successfully',
      severity: 'info',
      impact: 'No impact on system performance',
      duration: '3.2 minutes'
    },
    {
      id: 'tl-002',
      timestamp: '2025-01-11 22:15:00',
      type: 'rollback',
      description: 'Emergency rollback initiated due to security breach',
      severity: 'critical',
      impact: 'System downtime: 15 minutes',
      duration: '15 minutes'
    },
    {
      id: 'tl-003',
      timestamp: '2025-01-11 21:45:00',
      type: 'data_change',
      description: 'Large data modification detected in user database',
      severity: 'warning',
      impact: 'Increased backup frequency triggered',
      duration: '2 minutes'
    },
    {
      id: 'tl-004',
      timestamp: '2025-01-11 21:30:00',
      type: 'system_event',
      description: 'Scheduled maintenance window started',
      severity: 'info',
      impact: 'Backup operations temporarily paused',
      duration: '30 minutes'
    },
    {
      id: 'tl-005',
      timestamp: '2025-01-11 21:00:00',
      type: 'snapshot',
      description: 'Incremental backup failed - storage capacity exceeded',
      severity: 'error',
      impact: 'Backup schedule delayed by 15 minutes',
      duration: '5 minutes'
    }
  ]);

  const initiateRollback = (targetTime: string, reason: string) => {
    console.log(`Initiating rollback to ${targetTime}: ${reason}`);
    // Implementation would go here
  };

  const createSnapshot = (type: 'full' | 'incremental' | 'differential', description: string) => {
    console.log(`Creating ${type} snapshot: ${description}`);
    // Implementation would go here
  };

  const verifyIntegrity = (snapshotId: string) => {
    console.log(`Verifying integrity for snapshot: ${snapshotId}`);
    // Implementation would go here
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="portal-trdn-dashboard portal-space-y-6"
    >
      {/* Header */}
      <div className="portal-flex portal-justify-between portal-items-center">
        <div>
          <h1 className="portal-text-3xl portal-font-bold portal-flex portal-items-center portal-gap-3">
            <Clock className="portal-text-accent" size={32} />
            Time-Reversible Data Network
          </h1>
          <p className="portal-text-secondary portal-mt-2">
            Advanced temporal data management with point-in-time recovery and rollback capabilities
          </p>
        </div>
        
        <div className="portal-flex portal-items-center portal-gap-4">
          <div className="portal-flex portal-items-center portal-gap-2">
            <div className="portal-w-3 portal-h-3 portal-rounded-full portal-bg-success portal-animate-pulse"></div>
            <span className="portal-text-sm portal-text-secondary">
              {metrics.replicationStatus}
            </span>
          </div>
          
          <button
            onClick={() => setIsRealTime(!isRealTime)}
            className={`portal-btn portal-btn-sm ${isRealTime ? 'portal-btn-primary' : 'portal-btn-secondary'}`}
          >
            {isRealTime ? <Pause size={16} /> : <Play size={16} />}
            {isRealTime ? 'Live' : 'Paused'}
          </button>
          
          <button className="portal-btn portal-btn-secondary portal-btn-sm">
            <RefreshCw size={16} />
            Refresh
          </button>
          
          <button className="portal-btn portal-btn-secondary portal-btn-sm">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="portal-grid portal-grid-cols-1 portal-md:portal-grid-cols-2 portal-lg:portal-grid-cols-4 portal-gap-6">
        <motion.div
          className="portal-bg-surface portal-rounded-xl portal-p-6 portal-border portal-border-accent/20"
          whileHover={{ scale: 1.02 }}
        >
          <div className="portal-flex portal-items-center portal-justify-between portal-mb-4">
            <div className="portal-p-3 portal-bg-accent/10 portal-rounded-lg">
              <Archive className="portal-text-accent" size={24} />
            </div>
            <span className="portal-text-2xl portal-font-bold portal-text-accent">
              {metrics.totalSnapshots}
            </span>
          </div>
          <h3 className="portal-font-semibold portal-mb-2">Total Snapshots</h3>
          <p className="portal-text-sm portal-text-secondary">Across all systems</p>
        </motion.div>

        <motion.div
          className="portal-bg-surface portal-rounded-xl portal-p-6 portal-border portal-border-success/20"
          whileHover={{ scale: 1.02 }}
        >
          <div className="portal-flex portal-items-center portal-justify-between portal-mb-4">
            <div className="portal-p-3 portal-bg-success/10 portal-rounded-lg">
              <CheckCircle className="portal-text-success" size={24} />
            </div>
            <span className="portal-text-2xl portal-font-bold portal-text-success">
              {metrics.rollbackCapability}%
            </span>
          </div>
          <h3 className="portal-font-semibold portal-mb-2">Rollback Ready</h3>
          <p className="portal-text-sm portal-text-secondary">System availability</p>
        </motion.div>

        <motion.div
          className="portal-bg-surface portal-rounded-xl portal-p-6 portal-border portal-border-info/20"
          whileHover={{ scale: 1.02 }}
        >
          <div className="portal-flex portal-items-center portal-justify-between portal-mb-4">
            <div className="portal-p-3 portal-bg-info/10 portal-rounded-lg">
              <HardDrive className="portal-text-info" size={24} />
            </div>
            <span className="portal-text-2xl portal-font-bold portal-text-info">
              {metrics.storageUsed}
            </span>
          </div>
          <h3 className="portal-font-semibold portal-mb-2">Storage Used</h3>
          <p className="portal-text-sm portal-text-secondary">Temporal data storage</p>
        </motion.div>

        <motion.div
          className="portal-bg-surface portal-rounded-xl portal-p-6 portal-border portal-border-warning/20"
          whileHover={{ scale: 1.02 }}
        >
          <div className="portal-flex portal-items-center portal-justify-between portal-mb-4">
            <div className="portal-p-3 portal-bg-warning/10 portal-rounded-lg">
              <Timer className="portal-text-warning" size={24} />
            </div>
            <span className="portal-text-2xl portal-font-bold portal-text-warning">
              {metrics.averageSnapshotTime}
            </span>
          </div>
          <h3 className="portal-font-semibold portal-mb-2">Avg Snapshot Time</h3>
          <p className="portal-text-sm portal-text-secondary">Processing duration</p>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <div className="portal-border-b portal-border-secondary">
        <nav className="portal-flex portal-space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'snapshots', label: 'Data Snapshots', icon: Archive },
            { id: 'rollback', label: 'Rollback Operations', icon: RotateCcw },
            { id: 'timeline', label: 'Temporal Timeline', icon: History },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`portal-flex portal-items-center portal-gap-2 portal-py-4 portal-px-1 portal-border-b-2 portal-font-medium portal-text-sm ${
                activeTab === tab.id
                  ? 'portal-border-accent portal-text-accent'
                  : 'portal-border-transparent portal-text-secondary hover:portal-text-primary'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="portal-space-y-6">
              {/* System Status */}
              <div className="portal-bg-surface portal-rounded-xl portal-p-6">
                <h3 className="portal-text-xl portal-font-semibold portal-mb-6">System Status & Health</h3>
                <div className="portal-grid portal-grid-cols-1 portal-lg:portal-grid-cols-3 portal-gap-6">
                  <div className="portal-space-y-4">
                    <h4 className="portal-font-semibold portal-text-accent">Data Integrity</h4>
                    <div className="portal-relative portal-w-32 portal-h-32 portal-mx-auto">
                      <svg className="portal-w-full portal-h-full portal-transform portal--rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="portal-text-secondary/20"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - metrics.dataIntegrity / 100)}`}
                          className="portal-text-success portal-transition-all portal-duration-1000"
                        />
                      </svg>
                      <div className="portal-absolute portal-inset-0 portal-flex portal-items-center portal-justify-center">
                        <span className="portal-text-2xl portal-font-bold portal-text-success">
                          {metrics.dataIntegrity}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="portal-space-y-4">
                    <h4 className="portal-font-semibold portal-text-info">Storage Metrics</h4>
                    <div className="portal-space-y-3">
                      <div className="portal-flex portal-justify-between">
                        <span className="portal-text-sm">Total Storage</span>
                        <span className="portal-font-medium">{metrics.storageUsed}</span>
                      </div>
                      <div className="portal-flex portal-justify-between">
                        <span className="portal-text-sm">Compression Ratio</span>
                        <span className="portal-font-medium">{metrics.compressionRatio}:1</span>
                      </div>
                      <div className="portal-flex portal-justify-between">
                        <span className="portal-text-sm">Retention Period</span>
                        <span className="portal-font-medium">{metrics.retentionPeriod}</span>
                      </div>
                      <div className="portal-flex portal-justify-between">
                        <span className="portal-text-sm">Replication</span>
                        <span className="portal-font-medium portal-text-success">{metrics.replicationStatus}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="portal-space-y-4">
                    <h4 className="portal-font-semibold portal-text-warning">Quick Actions</h4>
                    <div className="portal-space-y-2">
                      <button
                        onClick={() => createSnapshot('full', 'Manual full backup')}
                        className="portal-w-full portal-btn portal-btn-primary portal-justify-start"
                      >
                        <Archive size={16} />
                        Create Full Snapshot
                      </button>
                      <button
                        onClick={() => createSnapshot('incremental', 'Manual incremental backup')}
                        className="portal-w-full portal-btn portal-btn-secondary portal-justify-start"
                      >
                        <Database size={16} />
                        Create Incremental
                      </button>
                      <button className="portal-w-full portal-btn portal-btn-secondary portal-justify-start">
                        <Eye size={16} />
                        Verify All Snapshots
                      </button>
                      <button className="portal-w-full portal-btn portal-btn-warning portal-justify-start">
                        <RotateCcw size={16} />
                        Emergency Rollback
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="portal-bg-surface portal-rounded-xl portal-p-6">
                <h3 className="portal-text-xl portal-font-semibold portal-mb-6">Recent Temporal Activity</h3>
                <div className="portal-space-y-4">
                  {timelineEvents.slice(0, 5).map(event => (
                    <div key={event.id} className="portal-flex portal-items-start portal-gap-4 portal-p-4 portal-border portal-rounded-lg">
                      <div className={`portal-p-2 portal-rounded portal-flex-shrink-0 ${
                        event.severity === 'critical' ? 'portal-bg-error/20 portal-text-error' :
                        event.severity === 'error' ? 'portal-bg-error/20 portal-text-error' :
                        event.severity === 'warning' ? 'portal-bg-warning/20 portal-text-warning' :
                        'portal-bg-success/20 portal-text-success'
                      }`}>
                        {event.type === 'snapshot' && <Archive size={16} />}
                        {event.type === 'rollback' && <RotateCcw size={16} />}
                        {event.type === 'data_change' && <Database size={16} />}
                        {event.type === 'system_event' && <Settings size={16} />}
                      </div>
                      <div className="portal-flex-1">
                        <div className="portal-flex portal-items-center portal-justify-between portal-mb-2">
                          <h4 className="portal-font-medium">{event.description}</h4>
                          <span className="portal-text-xs portal-text-secondary">{event.timestamp}</span>
                        </div>
                        <p className="portal-text-sm portal-text-secondary portal-mb-1">{event.impact}</p>
                        {event.duration && (
                          <span className="portal-text-xs portal-px-2 portal-py-1 portal-bg-secondary/20 portal-rounded">
                            Duration: {event.duration}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'snapshots' && (
            <div className="portal-space-y-6">
              {/* Snapshot Management */}
              <div className="portal-bg-surface portal-rounded-xl portal-p-6">
                <div className="portal-flex portal-justify-between portal-items-center portal-mb-6">
                  <h3 className="portal-text-xl portal-font-semibold">Data Snapshots</h3>
                  <div className="portal-flex portal-gap-2">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="portal-px-3 portal-py-2 portal-border portal-rounded portal-bg-surface"
                    >
                      <option value="all">All Status</option>
                      <option value="completed">Completed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="failed">Failed</option>
                    </select>
                    <button className="portal-btn portal-btn-primary">
                      <Archive size={16} />
                      Create Snapshot
                    </button>
                  </div>
                </div>
                
                <div className="portal-space-y-4">
                  {snapshots
                    .filter(snapshot => filterStatus === 'all' || snapshot.status === filterStatus)
                    .map(snapshot => (
                      <motion.div
                        key={snapshot.id}
                        className="portal-border portal-rounded-lg portal-p-4 hover:portal-bg-secondary/10 portal-cursor-pointer"
                        onClick={() => setSelectedSnapshot(snapshot)}
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="portal-flex portal-items-center portal-justify-between portal-mb-3">
                          <div className="portal-flex portal-items-center portal-gap-3">
                            <div className={`portal-p-2 portal-rounded ${
                              snapshot.status === 'completed' ? 'portal-bg-success/20 portal-text-success' :
                              snapshot.status === 'in_progress' ? 'portal-bg-info/20 portal-text-info' :
                              snapshot.status === 'failed' ? 'portal-bg-error/20 portal-text-error' :
                              'portal-bg-warning/20 portal-text-warning'
                            }`}>
                              <Archive size={16} />
                            </div>
                            <div>
                              <h4 className="portal-font-medium">{snapshot.id}</h4>
                              <p className="portal-text-sm portal-text-secondary">{snapshot.description}</p>
                            </div>
                          </div>
                          
                          <div className="portal-flex portal-items-center portal-gap-4">
                            <div className="portal-text-right">
                              <div className="portal-text-sm portal-font-medium">{snapshot.size}</div>
                              <div className="portal-text-xs portal-text-secondary">{snapshot.type}</div>
                            </div>
                            
                            <div className="portal-text-right">
                              <div className="portal-text-sm portal-font-medium">
                                {snapshot.status === 'completed' ? `${snapshot.integrity}%` : snapshot.status}
                              </div>
                              <div className="portal-text-xs portal-text-secondary">{snapshot.timestamp}</div>
                            </div>
                            
                            <div className="portal-flex portal-gap-2">
                              {snapshot.status === 'completed' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    verifyIntegrity(snapshot.id);
                                  }}
                                  className="portal-btn portal-btn-sm portal-btn-secondary"
                                >
                                  <Eye size={14} />
                                  Verify
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  initiateRollback(snapshot.timestamp, 'Manual rollback to snapshot');
                                }}
                                className="portal-btn portal-btn-sm portal-btn-warning"
                                disabled={snapshot.status !== 'completed'}
                              >
                                <RotateCcw size={14} />
                                Rollback
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="portal-flex portal-gap-2 portal-text-xs">
                          <span className="portal-px-2 portal-py-1 portal-bg-secondary/20 portal-rounded">
                            Location: {snapshot.location}
                          </span>
                          <span className="portal-px-2 portal-py-1 portal-bg-secondary/20 portal-rounded">
                            Retention: {snapshot.retentionDays} days
                          </span>
                          {snapshot.dependencies.length > 0 && (
                            <span className="portal-px-2 portal-py-1 portal-bg-secondary/20 portal-rounded">
                              Dependencies: {snapshot.dependencies.length}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rollback' && (
            <div className="portal-space-y-6">
              {/* Rollback Operations */}
              <div className="portal-bg-surface portal-rounded-xl portal-p-6">
                <div className="portal-flex portal-justify-between portal-items-center portal-mb-6">
                  <h3 className="portal-text-xl portal-font-semibold">Rollback Operations</h3>
                  <button className="portal-btn portal-btn-warning">
                    <RotateCcw size={16} />
                    Initiate Rollback
                  </button>
                </div>
                
                <div className="portal-space-y-4">
                  {rollbacks.map(rollback => (
                    <motion.div
                      key={rollback.id}
                      className="portal-border portal-rounded-lg portal-p-4"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="portal-flex portal-items-center portal-justify-between portal-mb-4">
                        <div className="portal-flex portal-items-center portal-gap-3">
                          <div className={`portal-p-2 portal-rounded ${
                            rollback.status === 'completed' ? 'portal-bg-success/20 portal-text-success' :
                            rollback.status === 'in_progress' ? 'portal-bg-info/20 portal-text-info' :
                            rollback.status === 'failed' ? 'portal-bg-error/20 portal-text-error' :
                            'portal-bg-warning/20 portal-text-warning'
                          }`}>
                            <RotateCcw size={16} />
                          </div>
                          <div>
                            <h4 className="portal-font-medium">{rollback.id}</h4>
                            <p className="portal-text-sm portal-text-secondary">{rollback.reason}</p>
                          </div>
                        </div>
                        
                        <div className="portal-text-right">
                          <div className="portal-text-sm portal-font-medium portal-capitalize">{rollback.status}</div>
                          <div className="portal-text-xs portal-text-secondary">
                            {rollback.status === 'in_progress' ? `${rollback.progress}% complete` : rollback.timestamp}
                          </div>
                        </div>
                      </div>
                      
                      {rollback.status === 'in_progress' && (
                        <div className="portal-mb-4">
                          <div className="portal-flex portal-justify-between portal-text-sm portal-mb-1">
                            <span>Progress</span>
                            <span>{rollback.progress}%</span>
                          </div>
                          <div className="portal-w-full portal-bg-secondary/20 portal-rounded-full portal-h-2">
                            <div 
                              className="portal-bg-info portal-h-2 portal-rounded-full portal-transition-all portal-duration-300"
                              style={{ width: `${rollback.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="portal-grid portal-grid-cols-2 portal-gap-4 portal-text-sm">
                        <div>
                          <span className="portal-text-secondary">Target Time:</span>
                          <div className="portal-font-medium">{rollback.targetTime}</div>
                        </div>
                        <div>
                          <span className="portal-text-secondary">Data Size:</span>
                          <div className="portal-font-medium">{rollback.dataSize}</div>
                        </div>
                        <div>
                          <span className="portal-text-secondary">Estimated Time:</span>
                          <div className="portal-font-medium">{rollback.estimatedTime}</div>
                        </div>
                        <div>
                          <span className="portal-text-secondary">Initiated By:</span>
                          <div className="portal-font-medium">{rollback.initiatedBy}</div>
                        </div>
                      </div>
                      
                      <div className="portal-mt-3">
                        <span className="portal-text-secondary portal-text-sm">Affected Systems:</span>
                        <div className="portal-flex portal-gap-2 portal-mt-1">
                          {rollback.affectedSystems.map(system => (
                            <span key={system} className="portal-px-2 portal-py-1 portal-bg-secondary/20 portal-rounded portal-text-xs">
                              {system}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="portal-space-y-6">
              {/* Temporal Timeline */}
              <div className="portal-bg-surface portal-rounded-xl portal-p-6">
                <div className="portal-flex portal-justify-between portal-items-center portal-mb-6">
                  <h3 className="portal-text-xl portal-font-semibold">Temporal Timeline</h3>
                  <div className="portal-flex portal-gap-2">
                    <select
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value)}
                      className="portal-px-3 portal-py-2 portal-border portal-rounded portal-bg-surface"
                    >
                      <option value="1h">Last Hour</option>
                      <option value="6h">Last 6 Hours</option>
                      <option value="24h">Last 24 Hours</option>
                      <option value="7d">Last 7 Days</option>
                      <option value="30d">Last 30 Days</option>
                    </select>
                  </div>
                </div>
                
                <div className="portal-relative">
                  <div className="portal-absolute portal-left-6 portal-top-0 portal-bottom-0 portal-w-0.5 portal-bg-secondary/30"></div>
                  
                  <div className="portal-space-y-6">
                    {timelineEvents.map((event, index) => (
                      <motion.div
                        key={event.id}
                        className="portal-relative portal-flex portal-items-start portal-gap-4"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className={`portal-relative portal-z-10 portal-p-3 portal-rounded-full portal-border-4 portal-border-surface ${
                          event.severity === 'critical' ? 'portal-bg-error portal-text-white' :
                          event.severity === 'error' ? 'portal-bg-error portal-text-white' :
                          event.severity === 'warning' ? 'portal-bg-warning portal-text-white' :
                          'portal-bg-success portal-text-white'
                        }`}>
                          {event.type === 'snapshot' && <Archive size={16} />}
                          {event.type === 'rollback' && <RotateCcw size={16} />}
                          {event.type === 'data_change' && <Database size={16} />}
                          {event.type === 'system_event' && <Settings size={16} />}
                        </div>
                        
                        <div className="portal-flex-1 portal-bg-secondary/10 portal-rounded-lg portal-p-4">
                          <div className="portal-flex portal-items-center portal-justify-between portal-mb-2">
                            <h4 className="portal-font-medium">{event.description}</h4>
                            <span className="portal-text-sm portal-text-secondary">{event.timestamp}</span>
                          </div>
                          <p className="portal-text-sm portal-text-secondary portal-mb-2">{event.impact}</p>
                          <div className="portal-flex portal-gap-2">
                            <span className={`portal-px-2 portal-py-1 portal-rounded portal-text-xs portal-capitalize ${
                              event.severity === 'critical' ? 'portal-bg-error/20 portal-text-error' :
                              event.severity === 'error' ? 'portal-bg-error/20 portal-text-error' :
                              event.severity === 'warning' ? 'portal-bg-warning/20 portal-text-warning' :
                              'portal-bg-success/20 portal-text-success'
                            }`}>
                              {event.severity}
                            </span>
                            <span className="portal-px-2 portal-py-1 portal-bg-secondary/20 portal-rounded portal-text-xs portal-capitalize">
                              {event.type.replace('_', ' ')}
                            </span>
                            {event.duration && (
                              <span className="portal-px-2 portal-py-1 portal-bg-secondary/20 portal-rounded portal-text-xs">
                                {event.duration}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="portal-space-y-6">
              {/* Analytics Dashboard */}
              <div className="portal-grid portal-grid-cols-1 portal-lg:portal-grid-cols-2 portal-gap-6">
                <div className="portal-bg-surface portal-rounded-xl portal-p-6">
                  <h3 className="portal-text-xl portal-font-semibold portal-mb-6">Storage Trends</h3>
                  <div className="portal-h-64 portal-bg-secondary/10 portal-rounded-lg portal-flex portal-items-center portal-justify-center">
                    <TrendingUp size={48} className="portal-text-secondary" />
                    <span className="portal-ml-4 portal-text-secondary">Storage usage over time</span>
                  </div>
                </div>
                
                <div className="portal-bg-surface portal-rounded-xl portal-p-6">
                  <h3 className="portal-text-xl portal-font-semibold portal-mb-6">Performance Metrics</h3>
                  <div className="portal-space-y-4">
                    {[
                      { name: 'Snapshot Success Rate', value: '99.2%', trend: '+0.5%' },
                      { name: 'Average Rollback Time', value: '8.3 min', trend: '-1.2 min' },
                      { name: 'Data Integrity Score', value: '100%', trend: '0%' },
                      { name: 'Storage Efficiency', value: '87.4%', trend: '+2.1%' }
                    ].map(metric => (
                      <div key={metric.name} className="portal-flex portal-items-center portal-justify-between portal-p-3 portal-bg-secondary/10 portal-rounded">
                        <span className="portal-font-medium">{metric.name}</span>
                        <div className="portal-text-right">
                          <div className="portal-font-bold">{metric.value}</div>
                          <div className={`portal-text-xs ${
                            metric.trend.startsWith('+') ? 'portal-text-success' : 
                            metric.trend.startsWith('-') && metric.name.includes('Time') ? 'portal-text-success' :
                            metric.trend.startsWith('-') ? 'portal-text-error' : 'portal-text-secondary'
                          }`}>
                            {metric.trend}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="portal-bg-surface portal-rounded-xl portal-p-6">
                <h3 className="portal-text-xl portal-font-semibold portal-mb-6">Rollback Analysis</h3>
                <div className="portal-h-64 portal-bg-secondary/10 portal-rounded-lg portal-flex portal-items-center portal-justify-center">
                  <RotateCcw size={48} className="portal-text-secondary" />
                  <span className="portal-ml-4 portal-text-secondary">Rollback frequency and success rates</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Snapshot Detail Modal */}
      <AnimatePresence>
        {selectedSnapshot && (
          <motion.div
            className="portal-fixed portal-inset-0 portal-bg-black/50 portal-backdrop-blur-sm portal-z-50 portal-flex portal-items-center portal-justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedSnapshot(null)}
          >
            <motion.div
              className="portal-bg-surface portal-rounded-xl portal-p-6 portal-max-w-2xl portal-w-full portal-mx-4 portal-max-h-[80vh] portal-overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="portal-flex portal-justify-between portal-items-start portal-mb-6">
                <h3 className="portal-text-xl portal-font-semibold">Snapshot Details</h3>
                <button
                  onClick={() => setSelectedSnapshot(null)}
                  className="portal-text-secondary hover:portal-text-primary"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="portal-space-y-4">
                <div className="portal-grid portal-grid-cols-2 portal-gap-4">
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Snapshot ID</label>
                    <p className="portal-font-mono portal-text-sm">{selectedSnapshot.id}</p>
                  </div>
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Type</label>
                    <p className="portal-font-semibold portal-capitalize">{selectedSnapshot.type}</p>
                  </div>
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Size</label>
                    <p className="portal-font-semibold">{selectedSnapshot.size}</p>
                  </div>
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Status</label>
                    <p className={`portal-font-semibold portal-capitalize ${
                      selectedSnapshot.status === 'completed' ? 'portal-text-success' :
                      selectedSnapshot.status === 'in_progress' ? 'portal-text-info' :
                      selectedSnapshot.status === 'failed' ? 'portal-text-error' :
                      'portal-text-warning'
                    }`}>
                      {selectedSnapshot.status}
                    </p>
                  </div>
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Integrity</label>
                    <p className="portal-font-semibold">{selectedSnapshot.integrity}%</p>
                  </div>
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Retention</label>
                    <p className="portal-font-semibold">{selectedSnapshot.retentionDays} days</p>
                  </div>
                </div>
                
                <div>
                  <label className="portal-text-sm portal-font-medium portal-text-secondary">Description</label>
                  <p className="portal-mt-1">{selectedSnapshot.description}</p>
                </div>
                
                <div>
                  <label className="portal-text-sm portal-font-medium portal-text-secondary">Location</label>
                  <p className="portal-mt-1 portal-font-mono portal-text-sm">{selectedSnapshot.location}</p>
                </div>
                
                {selectedSnapshot.dependencies.length > 0 && (
                  <div>
                    <label className="portal-text-sm portal-font-medium portal-text-secondary">Dependencies</label>
                    <div className="portal-flex portal-gap-2 portal-mt-1">
                      {selectedSnapshot.dependencies.map(dep => (
                        <span key={dep} className="portal-px-2 portal-py-1 portal-bg-secondary/20 portal-rounded portal-text-xs portal-font-mono">
                          {dep}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="portal-flex portal-gap-3 portal-pt-4">
                  {selectedSnapshot.status === 'completed' && (
                    <>
                      <button
                        onClick={() => {
                          initiateRollback(selectedSnapshot.timestamp, 'Rollback from snapshot detail');
                          setSelectedSnapshot(null);
                        }}
                        className="portal-btn portal-btn-warning"
                      >
                        <RotateCcw size={16} />
                        Rollback to This Point
                      </button>
                      <button
                        onClick={() => {
                          verifyIntegrity(selectedSnapshot.id);
                          setSelectedSnapshot(null);
                        }}
                        className="portal-btn portal-btn-secondary"
                      >
                        <Eye size={16} />
                        Verify Integrity
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedSnapshot(null)}
                    className="portal-btn portal-btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TRDN;
