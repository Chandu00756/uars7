import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye, 
  Filter,
  TrendingUp,
  Zap,
  Shield,
  Server,
  Wifi,
  Database,
  Settings,
  RefreshCw,
  Play,
  Pause,
  Download
} from 'lucide-react';

interface SensorData {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'warning' | 'error';
  value: number;
  unit: string;
  lastUpdate: string;
  location: string;
  threshold: {
    min: number;
    max: number;
  };
}

interface EventData {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  type: string;
  description: string;
  status: 'active' | 'investigating' | 'resolved';
  affectedSystems: string[];
}

const MSES: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [isRealTime, setIsRealTime] = useState(true);
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('1h');

  // Mock sensor data
  const [sensors] = useState<SensorData[]>([
    {
      id: 'sensor-001',
      name: 'Network Traffic Monitor',
      type: 'Network',
      status: 'online',
      value: 847.3,
      unit: 'Mbps',
      lastUpdate: '2 seconds ago',
      location: 'DMZ Gateway',
      threshold: { min: 0, max: 1000 }
    },
    {
      id: 'sensor-002',
      name: 'CPU Temperature Sensor',
      type: 'Hardware',
      status: 'warning',
      value: 78.5,
      unit: '°C',
      lastUpdate: '5 seconds ago',
      location: 'Server Rack A1',
      threshold: { min: 20, max: 80 }
    },
    {
      id: 'sensor-003',
      name: 'Authentication Events',
      type: 'Security',
      status: 'online',
      value: 234,
      unit: 'events/min',
      lastUpdate: '1 second ago',
      location: 'Identity Server',
      threshold: { min: 0, max: 500 }
    },
    {
      id: 'sensor-004',
      name: 'Database Connections',
      type: 'Application',
      status: 'online',
      value: 156,
      unit: 'connections',
      lastUpdate: '3 seconds ago',
      location: 'DB Cluster',
      threshold: { min: 0, max: 200 }
    },
    {
      id: 'sensor-005',
      name: 'Firewall Blocks',
      type: 'Security',
      status: 'error',
      value: 1247,
      unit: 'blocks/min',
      lastUpdate: '1 second ago',
      location: 'Perimeter Firewall',
      threshold: { min: 0, max: 1000 }
    },
    {
      id: 'sensor-006',
      name: 'Memory Usage',
      type: 'Hardware',
      status: 'online',
      value: 67.8,
      unit: '%',
      lastUpdate: '4 seconds ago',
      location: 'Application Servers',
      threshold: { min: 0, max: 90 }
    }
  ]);

  // Mock event data
  const [events] = useState<EventData[]>([
    {
      id: 'evt-001',
      timestamp: '2025-01-11 22:45:30',
      severity: 'high',
      source: 'Firewall Sensor',
      type: 'Security Breach',
      description: 'Unusual spike in blocked connection attempts detected',
      status: 'investigating',
      affectedSystems: ['Perimeter Firewall', 'DMZ Gateway']
    },
    {
      id: 'evt-002',
      timestamp: '2025-01-11 22:42:15',
      severity: 'medium',
      source: 'Temperature Sensor',
      type: 'Hardware Warning',
      description: 'CPU temperature approaching threshold limits',
      status: 'active',
      affectedSystems: ['Server Rack A1']
    },
    {
      id: 'evt-003',
      timestamp: '2025-01-11 22:38:45',
      severity: 'low',
      source: 'Network Monitor',
      type: 'Performance',
      description: 'Network traffic pattern anomaly detected',
      status: 'resolved',
      affectedSystems: ['DMZ Gateway']
    },
    {
      id: 'evt-004',
      timestamp: '2025-01-11 22:35:20',
      severity: 'critical',
      source: 'Authentication System',
      type: 'Security Alert',
      description: 'Multiple failed authentication attempts from suspicious IP',
      status: 'resolved',
      affectedSystems: ['Identity Server', 'Application Servers']
    }
  ]);

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'Network': return Wifi;
      case 'Hardware': return Server;
      case 'Security': return Shield;
      case 'Application': return Database;
      default: return Activity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-success';
      case 'warning': return 'text-warning';
      case 'error': return 'text-error';
      case 'offline': return 'text-secondary';
      default: return 'text-secondary';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-error';
      case 'high': return 'text-error';
      case 'medium': return 'text-warning';
      case 'low': return 'text-success';
      default: return 'text-secondary';
    }
  };

  const filteredSensors = sensors.filter(sensor => 
    activeFilter === 'all' || sensor.type.toLowerCase() === activeFilter
  );

  const filteredEvents = events.filter(event =>
    activeFilter === 'all' || event.severity === activeFilter
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="portal-mses-page"
    >
      {/* Header Section */}
      <div className="portal-page-header portal-mb-6">
        <div className="portal-flex portal-items-center portal-gap-3 portal-mb-4">
          <Activity size={32} className="portal-text-accent" />
          <div>
            <h1 className="portal-text-3xl portal-font-bold">Multi-Sensor Event System (M-SES)</h1>
            <p className="portal-text-secondary">Real-time monitoring and event correlation across all system sensors</p>
          </div>
        </div>

        {/* Control Panel */}
        <div className="portal-flex portal-flex-wrap portal-items-center portal-gap-4 portal-p-4 portal-bg-surface portal-rounded-lg">
          <div className="portal-flex portal-items-center portal-gap-2">
            <button
              onClick={() => setIsRealTime(!isRealTime)}
              className={`portal-flex portal-items-center portal-gap-2 portal-px-3 portal-py-2 portal-rounded portal-transition-colors ${
                isRealTime ? 'portal-bg-success portal-text-white' : 'portal-bg-secondary portal-text-white'
              }`}
            >
              {isRealTime ? <Play size={16} /> : <Pause size={16} />}
              {isRealTime ? 'Live' : 'Paused'}
            </button>
            
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="portal-px-3 portal-py-2 portal-rounded portal-border"
            >
              <option value="5m">Last 5 minutes</option>
              <option value="15m">Last 15 minutes</option>
              <option value="1h">Last 1 hour</option>
              <option value="6h">Last 6 hours</option>
              <option value="24h">Last 24 hours</option>
            </select>
          </div>

          <div className="portal-flex portal-items-center portal-gap-2">
            <Filter size={16} className="portal-text-secondary" />
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="portal-px-3 portal-py-2 portal-rounded portal-border"
            >
              <option value="all">All Sensors</option>
              <option value="network">Network</option>
              <option value="hardware">Hardware</option>
              <option value="security">Security</option>
              <option value="application">Application</option>
            </select>
          </div>

          <button className="portal-flex portal-items-center portal-gap-2 portal-px-3 portal-py-2 portal-bg-accent portal-text-white portal-rounded portal-transition-colors hover:portal-bg-accent-dark">
            <Download size={16} />
            Export Data
          </button>
        </div>
      </div>

      {/* System Overview Stats */}
      <div className="portal-grid portal-grid-cols-1 portal-md:portal-grid-cols-4 portal-gap-6 portal-mb-8">
        <motion.div
          className="portal-stat-card portal-bg-surface portal-rounded-lg portal-p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          <div className="portal-flex portal-items-center portal-gap-3 portal-mb-2">
            <Activity size={24} className="portal-text-success" />
            <h3 className="portal-text-lg portal-font-semibold">Active Sensors</h3>
          </div>
          <p className="portal-text-3xl portal-font-bold">
            {sensors.filter(s => s.status === 'online').length}
          </p>
          <p className="portal-text-sm portal-text-success">↑ 2 from yesterday</p>
        </motion.div>

        <motion.div
          className="portal-stat-card portal-bg-surface portal-rounded-lg portal-p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="portal-flex portal-items-center portal-gap-3 portal-mb-2">
            <AlertTriangle size={24} className="portal-text-warning" />
            <h3 className="portal-text-lg portal-font-semibold">Warnings</h3>
          </div>
          <p className="portal-text-3xl portal-font-bold">
            {sensors.filter(s => s.status === 'warning').length}
          </p>
          <p className="portal-text-sm portal-text-warning">Requires attention</p>
        </motion.div>

        <motion.div
          className="portal-stat-card portal-bg-surface portal-rounded-lg portal-p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="portal-flex portal-items-center portal-gap-3 portal-mb-2">
            <Zap size={24} className="portal-text-accent" />
            <h3 className="portal-text-lg portal-font-semibold">Events/Hour</h3>
          </div>
          <p className="portal-text-3xl portal-font-bold">1,247</p>
          <p className="portal-text-sm portal-text-accent">Processing rate</p>
        </motion.div>

        <motion.div
          className="portal-stat-card portal-bg-surface portal-rounded-lg portal-p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="portal-flex portal-items-center portal-gap-3 portal-mb-2">
            <TrendingUp size={24} className="portal-text-success" />
            <h3 className="portal-text-lg portal-font-semibold">Correlation Rate</h3>
          </div>
          <p className="portal-text-3xl portal-font-bold">94.7%</p>
          <p className="portal-text-sm portal-text-success">Event correlation accuracy</p>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="portal-grid portal-grid-cols-1 portal-lg:portal-grid-cols-2 portal-gap-8">
        
        {/* Sensor Status Panel */}
        <div className="portal-bg-surface portal-rounded-lg portal-p-6">
          <div className="portal-flex portal-items-center portal-justify-between portal-mb-6">
            <h2 className="portal-text-xl portal-font-semibold">Sensor Status</h2>
            <button className="portal-p-2 portal-rounded portal-hover:portal-bg-secondary portal-transition-colors">
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="portal-space-y-4 portal-max-h-96 portal-overflow-y-auto">
            {filteredSensors.map((sensor, index) => {
              const SensorIcon = getSensorIcon(sensor.type);
              const isSelected = selectedSensor === sensor.id;
              
              return (
                <motion.div
                  key={sensor.id}
                  className={`portal-sensor-card portal-p-4 portal-rounded-lg portal-border portal-cursor-pointer portal-transition-all ${
                    isSelected ? 'portal-border-accent portal-bg-accent portal-bg-opacity-10' : 'portal-border-secondary hover:portal-border-accent'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  onClick={() => setSelectedSensor(isSelected ? null : sensor.id)}
                >
                  <div className="portal-flex portal-items-center portal-justify-between portal-mb-3">
                    <div className="portal-flex portal-items-center portal-gap-3">
                      <SensorIcon size={20} className="portal-text-accent" />
                      <div>
                        <h3 className="portal-font-semibold">{sensor.name}</h3>
                        <p className="portal-text-sm portal-text-secondary">{sensor.location}</p>
                      </div>
                    </div>
                    <div className={`portal-status-indicator ${getStatusColor(sensor.status)}`}>
                      {sensor.status === 'online' && <CheckCircle size={16} />}
                      {sensor.status === 'warning' && <AlertTriangle size={16} />}
                      {sensor.status === 'error' && <AlertTriangle size={16} />}
                      {sensor.status === 'offline' && <Clock size={16} />}
                    </div>
                  </div>

                  <div className="portal-flex portal-items-center portal-justify-between portal-mb-2">
                    <span className="portal-text-2xl portal-font-bold">
                      {sensor.value} {sensor.unit}
                    </span>
                    <span className="portal-text-xs portal-text-secondary">{sensor.lastUpdate}</span>
                  </div>

                  {/* Progress bar for threshold visualization */}
                  <div className="portal-w-full portal-bg-secondary portal-rounded-full portal-h-2">
                    <div
                      className={`portal-h-2 portal-rounded-full portal-transition-all portal-duration-300 ${
                        sensor.value > sensor.threshold.max * 0.8 ? 'portal-bg-error' :
                        sensor.value > sensor.threshold.max * 0.6 ? 'portal-bg-warning' :
                        'portal-bg-success'
                      }`}
                      style={{ 
                        width: `${Math.min((sensor.value / sensor.threshold.max) * 100, 100)}%` 
                      }}
                    />
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="portal-mt-4 portal-pt-4 portal-border-t portal-border-secondary"
                      >
                        <div className="portal-grid portal-grid-cols-2 portal-gap-4 portal-text-sm">
                          <div>
                            <span className="portal-text-secondary">Type:</span>
                            <span className="portal-ml-2 portal-font-medium">{sensor.type}</span>
                          </div>
                          <div>
                            <span className="portal-text-secondary">Status:</span>
                            <span className={`portal-ml-2 portal-font-medium ${getStatusColor(sensor.status)}`}>
                              {sensor.status.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <span className="portal-text-secondary">Min Threshold:</span>
                            <span className="portal-ml-2 portal-font-medium">{sensor.threshold.min} {sensor.unit}</span>
                          </div>
                          <div>
                            <span className="portal-text-secondary">Max Threshold:</span>
                            <span className="portal-ml-2 portal-font-medium">{sensor.threshold.max} {sensor.unit}</span>
                          </div>
                        </div>
                        
                        <div className="portal-flex portal-gap-2 portal-mt-4">
                          <button className="portal-px-3 portal-py-1 portal-bg-accent portal-text-white portal-rounded portal-text-sm">
                            Configure
                          </button>
                          <button className="portal-px-3 portal-py-1 portal-border portal-border-secondary portal-rounded portal-text-sm">
                            View History
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Recent Events Panel */}
        <div className="portal-bg-surface portal-rounded-lg portal-p-6">
          <div className="portal-flex portal-items-center portal-justify-between portal-mb-6">
            <h2 className="portal-text-xl portal-font-semibold">Recent Events</h2>
            <div className="portal-flex portal-items-center portal-gap-2">
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="portal-px-2 portal-py-1 portal-rounded portal-border portal-text-sm"
              >
                <option value="all">All Events</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="portal-space-y-4 portal-max-h-96 portal-overflow-y-auto">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                className="portal-event-card portal-p-4 portal-rounded-lg portal-border portal-border-secondary hover:portal-border-accent portal-transition-all"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <div className="portal-flex portal-items-start portal-justify-between portal-mb-3">
                  <div className="portal-flex portal-items-center portal-gap-3">
                    <div className={`portal-w-3 portal-h-3 portal-rounded-full ${
                      event.severity === 'critical' ? 'portal-bg-error' :
                      event.severity === 'high' ? 'portal-bg-error' :
                      event.severity === 'medium' ? 'portal-bg-warning' :
                      'portal-bg-success'
                    }`} />
                    <div>
                      <h3 className="portal-font-semibold">{event.type}</h3>
                      <p className="portal-text-sm portal-text-secondary">{event.source}</p>
                    </div>
                  </div>
                  <span className={`portal-px-2 portal-py-1 portal-rounded portal-text-xs portal-font-medium ${
                    event.status === 'active' ? 'portal-bg-error portal-text-white' :
                    event.status === 'investigating' ? 'portal-bg-warning portal-text-white' :
                    'portal-bg-success portal-text-white'
                  }`}>
                    {event.status}
                  </span>
                </div>

                <p className="portal-text-sm portal-mb-3">{event.description}</p>

                <div className="portal-flex portal-items-center portal-justify-between portal-text-xs portal-text-secondary">
                  <span>{event.timestamp}</span>
                  <div className="portal-flex portal-items-center portal-gap-1">
                    <Eye size={12} />
                    <span>{event.affectedSystems.length} systems</span>
                  </div>
                </div>

                {/* Affected Systems */}
                <div className="portal-flex portal-flex-wrap portal-gap-1 portal-mt-2">
                  {event.affectedSystems.map((system, idx) => (
                    <span
                      key={idx}
                      className="portal-px-2 portal-py-1 portal-bg-secondary portal-bg-opacity-20 portal-rounded portal-text-xs"
                    >
                      {system}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Correlation Matrix */}
      <div className="portal-mt-8 portal-bg-surface portal-rounded-lg portal-p-6">
        <h2 className="portal-text-xl portal-font-semibold portal-mb-6">Event Correlation Matrix</h2>
        
        <div className="portal-grid portal-grid-cols-1 portal-md:portal-grid-cols-3 portal-gap-6">
          <div className="portal-text-center">
            <div className="portal-text-3xl portal-font-bold portal-text-success portal-mb-2">94.7%</div>
            <div className="portal-text-sm portal-text-secondary">Correlation Accuracy</div>
          </div>
          <div className="portal-text-center">
            <div className="portal-text-3xl portal-font-bold portal-text-accent portal-mb-2">1,247</div>
            <div className="portal-text-sm portal-text-secondary">Events Processed</div>
          </div>
          <div className="portal-text-center">
            <div className="portal-text-3xl portal-font-bold portal-text-warning portal-mb-2">23</div>
            <div className="portal-text-sm portal-text-secondary">Active Correlations</div>
          </div>
        </div>

        <div className="portal-mt-6 portal-p-4 portal-bg-secondary portal-bg-opacity-10 portal-rounded-lg">
          <div className="portal-flex portal-items-center portal-gap-2 portal-mb-2">
            <Zap size={16} className="portal-text-accent" />
            <span className="portal-font-semibold">Latest Correlation</span>
          </div>
          <p className="portal-text-sm portal-text-secondary">
            High correlation detected between firewall blocks and authentication failures. 
            Potential coordinated attack pattern identified across 3 network segments.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default MSES;
