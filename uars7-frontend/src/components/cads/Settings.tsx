import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Activity,
  Database,
  Network,
  Server,
  Lock,
  Eye,
  Bell,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  MemoryStick,
  HardDrive,
  RefreshCw,
  Monitor,
  Gauge,
  Zap,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Mail,
  Smartphone,
  Users,
  Key,
  Timer,
  Trash2,
  Upload,
  Download,
  FileText,
  Camera,
  Palette,
  Globe,
  Code,
  Terminal,
  Bug,
  Beaker
} from 'lucide-react';
import './cads.css';

// Type definitions
interface PoolSettings {
  maxPoolSize: number;
  minPoolSize: number;
  memoryLimitMB: number;
  timeoutMs: number;
  gcThreshold: number;
  autoScale: boolean;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
}

interface SecuritySettings {
  tokenTTL: number;
  requireMFA: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  enableAuditLog: boolean;
}

interface MonitoringSettings {
  metricsRetentionDays: number;
  alertingEnabled: boolean;
  thresholds: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  };
  notifications: {
    email: boolean;
    slack: boolean;
    webhook: boolean;
  };
}

interface ExperimentalSettings {
  enableQuantumOptimization: boolean;
  betaFeatures: boolean;
  debugMode: boolean;
  telemetryCollection: boolean;
}

interface LedgerSettings {
  fabricEndpoint: string;
  channelName: string;
  chaincodeId: string;
  enableTLS: boolean;
  mspId: string;
  connectionTimeout: number;
}

interface APISettings {
  maxRequestsPerMinute: number;
  enableCORS: boolean;
  allowedOrigins: string[];
  enableCompression: boolean;
  requestLogging: boolean;
}

interface BrandingSettings {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  organizationName: string;
  supportEmail: string;
  customCSS: string;
}

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pool' | 'security' | 'monitoring' | 'experimental' | 'ledger' | 'api' | 'branding'>('pool');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Settings state
  const [poolSettings, setPoolSettings] = useState<PoolSettings>({
    maxPoolSize: 50,
    minPoolSize: 5,
    memoryLimitMB: 256,
    timeoutMs: 30000,
    gcThreshold: 0.8,
    autoScale: true,
    scaleUpThreshold: 0.8,
    scaleDownThreshold: 0.3
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    tokenTTL: 3600,
    requireMFA: true,
    sessionTimeout: 1800,
    maxLoginAttempts: 5,
    lockoutDuration: 900,
    enableAuditLog: true
  });

  const [monitoringSettings, setMonitoringSettings] = useState<MonitoringSettings>({
    metricsRetentionDays: 30,
    alertingEnabled: true,
    thresholds: {
      cpuUsage: 80,
      memoryUsage: 85,
      diskUsage: 90
    },
    notifications: {
      email: true,
      slack: true,
      webhook: false
    }
  });

  const [experimentalSettings, setExperimentalSettings] = useState<ExperimentalSettings>({
    enableQuantumOptimization: false,
    betaFeatures: false,
    debugMode: false,
    telemetryCollection: true
  });

  const [ledgerSettings, setLedgerSettings] = useState<LedgerSettings>({
    fabricEndpoint: 'peer0.org1.example.com:7051',
    channelName: 'mychannel',
    chaincodeId: 'cads-chaincode',
    enableTLS: true,
    mspId: 'Org1MSP',
    connectionTimeout: 10000
  });

  const [apiSettings, setAPISettings] = useState<APISettings>({
    maxRequestsPerMinute: 1000,
    enableCORS: true,
    allowedOrigins: ['https://localhost:3000', 'https://portal.uars7.com'],
    enableCompression: true,
    requestLogging: true
  });

  const [brandingSettings, setBrandingSettings] = useState<BrandingSettings>({
    logoUrl: '/assets/logo.svg',
    primaryColor: '#0066cc',
    secondaryColor: '#00cc66',
    organizationName: 'PortalVII Security',
    supportEmail: 'support@portalvii.com',
    customCSS: ''
  });

  // Connection status
  const [connectionStatus, setConnectionStatus] = useState({
    database: 'connected',
    fabric: 'connected',
    redis: 'connected',
    prometheus: 'connected'
  });

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUnsavedChanges(false);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      // Reset to defaults logic
      setUnsavedChanges(true);
    }
  };

  const handleTestConnection = async (service: string) => {
    setConnectionStatus(prev => ({ ...prev, [service]: 'testing' }));
    // Simulate connection test
    setTimeout(() => {
      setConnectionStatus(prev => ({ 
        ...prev, 
        [service]: Math.random() > 0.2 ? 'connected' : 'error'
      }));
    }, 2000);
  };

  const tabs = [
    { id: 'pool', label: 'Pool & Resources', icon: Server },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'monitoring', label: 'Monitoring', icon: Activity },
    { id: 'ledger', label: 'Ledger', icon: Database },
    { id: 'api', label: 'API Settings', icon: Network },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'experimental', label: 'Experimental', icon: Beaker }
  ];

  const renderPoolSettings = () => (
    <div className="cads-settings-section">
      <div className="cads-settings-header">
        <h3 className="cads-section-title">
          <Server className="cads-icon" />
          Pool & Resource Management
        </h3>
        <p className="cads-section-description">
          Configure WASM micro-cell pool sizing, memory limits, and auto-scaling behavior.
        </p>
      </div>

      <div className="cads-settings-grid">
        <div className="cads-setting-card">
          <h4 className="cads-card-title">Pool Size Configuration</h4>
          <div className="cads-setting-controls">
            <div className="cads-control-group">
              <label htmlFor="max-pool-size" className="cads-control-label">Maximum Pool Size</label>
              <input
                id="max-pool-size"
                type="number"
                min="1"
                max="200"
                value={poolSettings.maxPoolSize}
                onChange={(e) => {
                  setPoolSettings(prev => ({ ...prev, maxPoolSize: parseInt(e.target.value) || 0 }));
                  setUnsavedChanges(true);
                }}
                className="cads-number-input"
                aria-label="Maximum Pool Size"
              />
              <span className="cads-input-help">Maximum number of concurrent micro-cells</span>
            </div>

            <div className="cads-control-group">
              <label htmlFor="min-pool-size" className="cads-control-label">Minimum Pool Size</label>
              <input
                id="min-pool-size"
                type="number"
                min="1"
                max="50"
                value={poolSettings.minPoolSize}
                onChange={(e) => {
                  setPoolSettings(prev => ({ ...prev, minPoolSize: parseInt(e.target.value) || 0 }));
                  setUnsavedChanges(true);
                }}
                className="cads-number-input"
                aria-label="Minimum Pool Size"
              />
              <span className="cads-input-help">Minimum number of pre-warmed instances</span>
            </div>

            <div className="cads-control-group">
              <label htmlFor="memory-limit" className="cads-control-label">Memory Limit (MB)</label>
              <input
                id="memory-limit"
                type="number"
                min="64"
                max="2048"
                value={poolSettings.memoryLimitMB}
                onChange={(e) => {
                  setPoolSettings(prev => ({ ...prev, memoryLimitMB: parseInt(e.target.value) || 0 }));
                  setUnsavedChanges(true);
                }}
                className="cads-number-input"
                aria-label="Memory Limit in MB"
              />
              <span className="cads-input-help">Memory limit per micro-cell instance</span>
            </div>

            <div className="cads-control-group">
              <label htmlFor="timeout-ms" className="cads-control-label">Execution Timeout (ms)</label>
              <input
                id="timeout-ms"
                type="number"
                min="1000"
                max="300000"
                value={poolSettings.timeoutMs}
                onChange={(e) => {
                  setPoolSettings(prev => ({ ...prev, timeoutMs: parseInt(e.target.value) || 0 }));
                  setUnsavedChanges(true);
                }}
                className="cads-number-input"
                aria-label="Execution Timeout in milliseconds"
              />
              <span className="cads-input-help">Maximum execution time before termination</span>
            </div>
          </div>
        </div>

        <div className="cads-setting-card">
          <h4 className="cads-card-title">Auto-Scaling</h4>
          <div className="cads-setting-controls">
            <div className="cads-toggle-group">
              <label htmlFor="auto-scale" className="cads-toggle-label">
                <input
                  id="auto-scale"
                  type="checkbox"
                  checked={poolSettings.autoScale}
                  onChange={(e) => {
                    setPoolSettings(prev => ({ ...prev, autoScale: e.target.checked }));
                    setUnsavedChanges(true);
                  }}
                  className="cads-toggle-input"
                  aria-label="Enable Auto-scaling"
                />
                <span className="cads-toggle-slider"></span>
                Enable Auto-scaling
              </label>
            </div>

            {poolSettings.autoScale && (
              <>
                <div className="cads-control-group">
                  <label htmlFor="scale-up-threshold" className="cads-control-label">Scale Up Threshold</label>
                  <input
                    id="scale-up-threshold"
                    type="range"
                    min="0.5"
                    max="1"
                    step="0.1"
                    value={poolSettings.scaleUpThreshold}
                    onChange={(e) => {
                      setPoolSettings(prev => ({ ...prev, scaleUpThreshold: parseFloat(e.target.value) }));
                      setUnsavedChanges(true);
                    }}
                    className="cads-range-input"
                    aria-label="Scale Up Threshold"
                  />
                  <span className="cads-input-help">{(poolSettings.scaleUpThreshold * 100).toFixed(0)}% utilization</span>
                </div>

                <div className="cads-control-group">
                  <label htmlFor="scale-down-threshold" className="cads-control-label">Scale Down Threshold</label>
                  <input
                    id="scale-down-threshold"
                    type="range"
                    min="0.1"
                    max="0.8"
                    step="0.1"
                    value={poolSettings.scaleDownThreshold}
                    onChange={(e) => {
                      setPoolSettings(prev => ({ ...prev, scaleDownThreshold: parseFloat(e.target.value) }));
                      setUnsavedChanges(true);
                    }}
                    className="cads-range-input"
                    aria-label="Scale Down Threshold"
                  />
                  <span className="cads-input-help">{(poolSettings.scaleDownThreshold * 100).toFixed(0)}% utilization</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="cads-settings-section">
      <div className="cads-settings-header">
        <h3 className="cads-section-title">
          <Shield className="cads-icon" />
          Security Configuration
        </h3>
        <p className="cads-section-description">
          Configure authentication, authorization, and security policies.
        </p>
      </div>

      <div className="cads-settings-grid">
        <div className="cads-setting-card">
          <h4 className="cads-card-title">Authentication</h4>
          <div className="cads-setting-controls">
            <div className="cads-control-group">
              <label htmlFor="token-ttl" className="cads-control-label">Token TTL (seconds)</label>
              <input
                id="token-ttl"
                type="number"
                min="300"
                max="86400"
                value={securitySettings.tokenTTL}
                onChange={(e) => {
                  setSecuritySettings(prev => ({ ...prev, tokenTTL: parseInt(e.target.value) || 0 }));
                  setUnsavedChanges(true);
                }}
                className="cads-number-input"
                aria-label="Token Time To Live in seconds"
              />
              <span className="cads-input-help">How long tokens remain valid</span>
            </div>

            <div className="cads-toggle-group">
              <label htmlFor="require-mfa" className="cads-toggle-label">
                <input
                  id="require-mfa"
                  type="checkbox"
                  checked={securitySettings.requireMFA}
                  onChange={(e) => {
                    setSecuritySettings(prev => ({ ...prev, requireMFA: e.target.checked }));
                    setUnsavedChanges(true);
                  }}
                  className="cads-toggle-input"
                  aria-label="Require Multi-Factor Authentication"
                />
                <span className="cads-toggle-slider"></span>
                Require Multi-Factor Authentication
              </label>
            </div>

            <div className="cads-control-group">
              <label htmlFor="session-timeout" className="cads-control-label">Session Timeout (seconds)</label>
              <input
                id="session-timeout"
                type="number"
                min="300"
                max="7200"
                value={securitySettings.sessionTimeout}
                onChange={(e) => {
                  setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) || 0 }));
                  setUnsavedChanges(true);
                }}
                className="cads-number-input"
                aria-label="Session Timeout in seconds"
              />
              <span className="cads-input-help">Idle session timeout</span>
            </div>
          </div>
        </div>

        <div className="cads-setting-card">
          <h4 className="cads-card-title">Access Control</h4>
          <div className="cads-setting-controls">
            <div className="cads-control-group">
              <label htmlFor="max-login-attempts" className="cads-control-label">Max Login Attempts</label>
              <input
                id="max-login-attempts"
                type="number"
                min="3"
                max="10"
                value={securitySettings.maxLoginAttempts}
                onChange={(e) => {
                  setSecuritySettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) || 0 }));
                  setUnsavedChanges(true);
                }}
                className="cads-number-input"
                aria-label="Maximum Login Attempts"
              />
              <span className="cads-input-help">Failed attempts before lockout</span>
            </div>

            <div className="cads-control-group">
              <label htmlFor="lockout-duration" className="cads-control-label">Lockout Duration (seconds)</label>
              <input
                id="lockout-duration"
                type="number"
                min="300"
                max="3600"
                value={securitySettings.lockoutDuration}
                onChange={(e) => {
                  setSecuritySettings(prev => ({ ...prev, lockoutDuration: parseInt(e.target.value) || 0 }));
                  setUnsavedChanges(true);
                }}
                className="cads-number-input"
                aria-label="Account Lockout Duration in seconds"
              />
              <span className="cads-input-help">Account lockout duration</span>
            </div>

            <div className="cads-toggle-group">
              <label htmlFor="enable-audit-log" className="cads-toggle-label">
                <input
                  id="enable-audit-log"
                  type="checkbox"
                  checked={securitySettings.enableAuditLog}
                  onChange={(e) => {
                    setSecuritySettings(prev => ({ ...prev, enableAuditLog: e.target.checked }));
                    setUnsavedChanges(true);
                  }}
                  className="cads-toggle-input"
                  aria-label="Enable Audit Logging"
                />
                <span className="cads-toggle-slider"></span>
                Enable Audit Logging
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMonitoringSettings = () => (
    <div className="cads-settings-section">
      <div className="cads-settings-header">
        <h3 className="cads-section-title">
          <Activity className="cads-icon" />
          Monitoring & Alerting
        </h3>
        <p className="cads-section-description">
          Configure monitoring thresholds, alerting, and metric retention.
        </p>
      </div>

      <div className="cads-settings-grid">
        <div className="cads-setting-card">
          <h4 className="cads-card-title">Metrics Configuration</h4>
          <div className="cads-setting-controls">
            <div className="cads-control-group">
              <label htmlFor="metrics-retention" className="cads-control-label">Metrics Retention (days)</label>
              <input
                id="metrics-retention"
                type="number"
                min="7"
                max="365"
                value={monitoringSettings.metricsRetentionDays}
                onChange={(e) => {
                  setMonitoringSettings(prev => ({ ...prev, metricsRetentionDays: parseInt(e.target.value) || 0 }));
                  setUnsavedChanges(true);
                }}
                className="cads-number-input"
                aria-label="Metrics Retention in days"
              />
              <span className="cads-input-help">How long to keep historical metrics</span>
            </div>

            <div className="cads-toggle-group">
              <label htmlFor="alerting-enabled" className="cads-toggle-label">
                <input
                  id="alerting-enabled"
                  type="checkbox"
                  checked={monitoringSettings.alertingEnabled}
                  onChange={(e) => {
                    setMonitoringSettings(prev => ({ ...prev, alertingEnabled: e.target.checked }));
                    setUnsavedChanges(true);
                  }}
                  className="cads-toggle-input"
                  aria-label="Enable Alerting"
                />
                <span className="cads-toggle-slider"></span>
                Enable Alerting
              </label>
            </div>
          </div>
        </div>

        <div className="cads-setting-card">
          <h4 className="cads-card-title">Alert Thresholds</h4>
          <div className="cads-setting-controls">
            <div className="cads-control-group">
              <label htmlFor="cpu-threshold" className="cads-control-label">CPU Usage Threshold (%)</label>
              <input
                id="cpu-threshold"
                type="range"
                min="50"
                max="95"
                value={monitoringSettings.thresholds.cpuUsage}
                onChange={(e) => {
                  setMonitoringSettings(prev => ({ 
                    ...prev, 
                    thresholds: { ...prev.thresholds, cpuUsage: parseInt(e.target.value) }
                  }));
                  setUnsavedChanges(true);
                }}
                className="cads-range-input"
                aria-label="CPU Usage Alert Threshold"
              />
              <span className="cads-input-help">{monitoringSettings.thresholds.cpuUsage}%</span>
            </div>

            <div className="cads-control-group">
              <label htmlFor="memory-threshold" className="cads-control-label">Memory Usage Threshold (%)</label>
              <input
                id="memory-threshold"
                type="range"
                min="50"
                max="95"
                value={monitoringSettings.thresholds.memoryUsage}
                onChange={(e) => {
                  setMonitoringSettings(prev => ({ 
                    ...prev, 
                    thresholds: { ...prev.thresholds, memoryUsage: parseInt(e.target.value) }
                  }));
                  setUnsavedChanges(true);
                }}
                className="cads-range-input"
                aria-label="Memory Usage Alert Threshold"
              />
              <span className="cads-input-help">{monitoringSettings.thresholds.memoryUsage}%</span>
            </div>

            <div className="cads-control-group">
              <label htmlFor="disk-threshold" className="cads-control-label">Disk Usage Threshold (%)</label>
              <input
                id="disk-threshold"
                type="range"
                min="70"
                max="98"
                value={monitoringSettings.thresholds.diskUsage}
                onChange={(e) => {
                  setMonitoringSettings(prev => ({ 
                    ...prev, 
                    thresholds: { ...prev.thresholds, diskUsage: parseInt(e.target.value) }
                  }));
                  setUnsavedChanges(true);
                }}
                className="cads-range-input"
                aria-label="Disk Usage Alert Threshold"
              />
              <span className="cads-input-help">{monitoringSettings.thresholds.diskUsage}%</span>
            </div>
          </div>
        </div>

        <div className="cads-setting-card">
          <h4 className="cads-card-title">Notification Channels</h4>
          <div className="cads-setting-controls">
            <div className="cads-toggle-group">
              <label htmlFor="email-notifications" className="cads-toggle-label">
                <input
                  id="email-notifications"
                  type="checkbox"
                  checked={monitoringSettings.notifications.email}
                  onChange={(e) => {
                    setMonitoringSettings(prev => ({ 
                      ...prev, 
                      notifications: { ...prev.notifications, email: e.target.checked }
                    }));
                    setUnsavedChanges(true);
                  }}
                  className="cads-toggle-input"
                  aria-label="Enable Email Notifications"
                />
                <span className="cads-toggle-slider"></span>
                Email Notifications
              </label>
            </div>

            <div className="cads-toggle-group">
              <label htmlFor="slack-notifications" className="cads-toggle-label">
                <input
                  id="slack-notifications"
                  type="checkbox"
                  checked={monitoringSettings.notifications.slack}
                  onChange={(e) => {
                    setMonitoringSettings(prev => ({ 
                      ...prev, 
                      notifications: { ...prev.notifications, slack: e.target.checked }
                    }));
                    setUnsavedChanges(true);
                  }}
                  className="cads-toggle-input"
                  aria-label="Enable Slack Notifications"
                />
                <span className="cads-toggle-slider"></span>
                Slack Notifications
              </label>
            </div>

            <div className="cads-toggle-group">
              <label htmlFor="webhook-notifications" className="cads-toggle-label">
                <input
                  id="webhook-notifications"
                  type="checkbox"
                  checked={monitoringSettings.notifications.webhook}
                  onChange={(e) => {
                    setMonitoringSettings(prev => ({ 
                      ...prev, 
                      notifications: { ...prev.notifications, webhook: e.target.checked }
                    }));
                    setUnsavedChanges(true);
                  }}
                  className="cads-toggle-input"
                  aria-label="Enable Webhook Notifications"
                />
                <span className="cads-toggle-slider"></span>
                Webhook Notifications
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLedgerSettings = () => (
    <div className="cads-settings-section">
      <div className="cads-settings-header">
        <h3 className="cads-section-title">
          <Database className="cads-icon" />
          Blockchain Ledger Configuration
        </h3>
        <p className="cads-section-description">
          Configure Hyperledger Fabric connectivity and ledger parameters.
        </p>
      </div>

      <div className="cads-settings-grid">
        <div className="cads-setting-card">
          <h4 className="cads-card-title">Fabric Network</h4>
          <div className="cads-setting-controls">
            <div className="cads-control-group">
              <label htmlFor="fabric-endpoint" className="cads-control-label">Fabric Endpoint</label>
              <input
                id="fabric-endpoint"
                type="text"
                value={ledgerSettings.fabricEndpoint}
                onChange={(e) => {
                  setLedgerSettings(prev => ({ ...prev, fabricEndpoint: e.target.value }));
                  setUnsavedChanges(true);
                }}
                className="cads-text-input"
                placeholder="peer0.org1.example.com:7051"
                aria-label="Hyperledger Fabric Endpoint"
              />
              <span className="cads-input-help">Fabric peer endpoint address</span>
            </div>

            <div className="cads-control-group">
              <label htmlFor="channel-name" className="cads-control-label">Channel Name</label>
              <input
                id="channel-name"
                type="text"
                value={ledgerSettings.channelName}
                onChange={(e) => {
                  setLedgerSettings(prev => ({ ...prev, channelName: e.target.value }));
                  setUnsavedChanges(true);
                }}
                className="cads-text-input"
                placeholder="mychannel"
                aria-label="Fabric Channel Name"
              />
              <span className="cads-input-help">Fabric channel to connect to</span>
            </div>

            <div className="cads-control-group">
              <label htmlFor="chaincode-id" className="cads-control-label">Chaincode ID</label>
              <input
                id="chaincode-id"
                type="text"
                value={ledgerSettings.chaincodeId}
                onChange={(e) => {
                  setLedgerSettings(prev => ({ ...prev, chaincodeId: e.target.value }));
                  setUnsavedChanges(true);
                }}
                className="cads-text-input"
                placeholder="cads-chaincode"
                aria-label="Chaincode ID"
              />
              <span className="cads-input-help">Smart contract identifier</span>
            </div>

            <div className="cads-toggle-group">
              <label htmlFor="enable-tls" className="cads-toggle-label">
                <input
                  id="enable-tls"
                  type="checkbox"
                  checked={ledgerSettings.enableTLS}
                  onChange={(e) => {
                    setLedgerSettings(prev => ({ ...prev, enableTLS: e.target.checked }));
                    setUnsavedChanges(true);
                  }}
                  className="cads-toggle-input"
                  aria-label="Enable TLS Encryption"
                />
                <span className="cads-toggle-slider"></span>
                Enable TLS
              </label>
            </div>
          </div>
        </div>

        <div className="cads-setting-card">
          <h4 className="cads-card-title">Connection Status</h4>
          <div className="cads-setting-controls">
            <div className="cads-status-grid">
              {Object.entries(connectionStatus).map(([service, status]) => (
                <div key={service} className="cads-status-item">
                  <div className="cads-status-indicator">
                    <div className={`cads-status-dot cads-status-${status}`}></div>
                    <span className="cads-status-label">{service.toUpperCase()}</span>
                  </div>
                  <button
                    onClick={() => handleTestConnection(service)}
                    className="cads-test-button"
                    disabled={status === 'testing'}
                    aria-label={`Test ${service} connection`}
                  >
                    {status === 'testing' ? <RefreshCw className="animate-spin" size={16} /> : 'Test'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderExperimentalSettings = () => (
    <div className="cads-settings-section">
      <div className="cads-settings-header">
        <h3 className="cads-section-title">
          <Beaker className="cads-icon" />
          Experimental Features
        </h3>
        <p className="cads-section-description">
          Enable experimental features and beta functionality. Use with caution in production.
        </p>
      </div>

      <div className="cads-settings-grid">
        <div className="cads-setting-card">
          <h4 className="cads-card-title">Beta Features</h4>
          <div className="cads-setting-controls">
            <div className="cads-toggle-group">
              <label htmlFor="quantum-optimization" className="cads-toggle-label">
                <input
                  id="quantum-optimization"
                  type="checkbox"
                  checked={experimentalSettings.enableQuantumOptimization}
                  onChange={(e) => {
                    setExperimentalSettings(prev => ({ ...prev, enableQuantumOptimization: e.target.checked }));
                    setUnsavedChanges(true);
                  }}
                  className="cads-toggle-input"
                  aria-label="Enable Quantum Optimization"
                />
                <span className="cads-toggle-slider"></span>
                Quantum Optimization
              </label>
              <span className="cads-feature-badge">EXPERIMENTAL</span>
            </div>

            <div className="cads-toggle-group">
              <label htmlFor="beta-features" className="cads-toggle-label">
                <input
                  id="beta-features"
                  type="checkbox"
                  checked={experimentalSettings.betaFeatures}
                  onChange={(e) => {
                    setExperimentalSettings(prev => ({ ...prev, betaFeatures: e.target.checked }));
                    setUnsavedChanges(true);
                  }}
                  className="cads-toggle-input"
                  aria-label="Enable Beta Features"
                />
                <span className="cads-toggle-slider"></span>
                Beta Features
              </label>
              <span className="cads-feature-badge">BETA</span>
            </div>

            <div className="cads-toggle-group">
              <label htmlFor="debug-mode" className="cads-toggle-label">
                <input
                  id="debug-mode"
                  type="checkbox"
                  checked={experimentalSettings.debugMode}
                  onChange={(e) => {
                    setExperimentalSettings(prev => ({ ...prev, debugMode: e.target.checked }));
                    setUnsavedChanges(true);
                  }}
                  className="cads-toggle-input"
                  aria-label="Enable Debug Mode"
                />
                <span className="cads-toggle-slider"></span>
                Debug Mode
              </label>
            </div>

            <div className="cads-toggle-group">
              <label htmlFor="telemetry-collection" className="cads-toggle-label">
                <input
                  id="telemetry-collection"
                  type="checkbox"
                  checked={experimentalSettings.telemetryCollection}
                  onChange={(e) => {
                    setExperimentalSettings(prev => ({ ...prev, telemetryCollection: e.target.checked }));
                    setUnsavedChanges(true);
                  }}
                  className="cads-toggle-input"
                  aria-label="Enable Telemetry Collection"
                />
                <span className="cads-toggle-slider"></span>
                Telemetry Collection
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'pool': return renderPoolSettings();
      case 'security': return renderSecuritySettings();
      case 'monitoring': return renderMonitoringSettings();
      case 'ledger': return renderLedgerSettings();
      case 'experimental': return renderExperimentalSettings();
      default: return renderPoolSettings();
    }
  };

  return (
    <div className="cads-settings">
      <div className="cads-settings-header-main">
        <div className="cads-settings-title">
          <SettingsIcon className="cads-icon" />
          <h2>System Configuration</h2>
        </div>
        
        <div className="cads-settings-actions">
          {unsavedChanges && (
            <div className="cads-unsaved-indicator">
              <AlertTriangle size={16} />
              Unsaved changes
            </div>
          )}
          
          {lastSaved && (
            <div className="cads-last-saved">
              <Clock size={16} />
              Last saved: {lastSaved.toLocaleTimeString()}
            </div>
          )}
          
          <div className="cads-action-buttons">
            <button
              onClick={handleResetSettings}
              className="cads-button cads-button-secondary"
              disabled={saving}
              aria-label="Reset all settings to defaults"
            >
              <RotateCcw size={16} />
              Reset
            </button>
            
            <button
              onClick={handleSaveSettings}
              className="cads-button cads-button-primary"
              disabled={!unsavedChanges || saving}
              aria-label="Save all settings"
            >
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>

      <div className="cads-settings-container">
        <div className="cads-settings-sidebar">
          <nav className="cads-settings-nav" role="navigation" aria-label="Settings navigation">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`cads-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  <IconComponent className="cads-nav-icon" />
                  <span className="cads-nav-label">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="cads-settings-content">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;
