import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Activity,
  Eye,
  Database,
  Zap,
  SettingsIcon,
  Bell,
  BarChart3,
  Key,
  Dna,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Server,
  Users,
  Clock,
  Target,
  Layers,
  Search,
  Menu,
  X,
  Home,
  Cpu,
  Lock,
  Scan,
  ShieldCheck,
  Radar,
  Bug,
  FileText,
  Cog,
  ChevronRight,
  Globe,
  Wifi
} from 'lucide-react';

// Import CADS components
import Overview from './Overview';
import LiveCells from './LiveCells';
import Policies from './Policies';
import IntentTokens from './IntentTokens';
import GenomeExplorer from './GenomeExplorer';
import Alerts from './Alerts';
import CADSSettings from './Settings';
import ThreatAnalysis from './ThreatAnalysis';
import SecurityOperations from './SecurityOperations';
import IncidentResponse from './IncidentResponse';
import ComplianceAudit from './ComplianceAudit';
import ThreatHunting from './ThreatHunting';
import VulnerabilityManagement from './VulnerabilityManagement';

// Import stub components that don't have individual files yet
import {
  PolicyRollout,
  TokenVault,
  TokenGenerator,
  TokenRevocation,
  FitnessMatrix,
  GenomeDiffViewer,
  CullQueue,
  AlertCorrelations,
  QuietHours,
  AlertAnalytics,
  MemoryManagement,
  LedgerConnectivity,
  ExperimentalFlags,
  APIKeyManagement,
  MetricsViewer,
  LogViewer
} from './ComponentStubs';

// Import CSS
import './cads.css';

interface CADSMetrics {
  totalCells: number;
  activeCells: number;
  poolUtilization: number;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  averageResponseTime: number;
  securityEvents: number;
  policyViolations: number;
  systemHealth: number;
}

type CADSTab = 'overview' | 'live-cells' | 'policies' | 'intent-tokens' | 'genome-explorer' | 'alerts' | 'settings' | 'threat-analysis' | 'security-ops' | 'incident-response' | 'compliance' | 'threat-hunting' | 'vulnerability';

const CADS: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CADSTab>('overview');
  const [metrics, setMetrics] = useState<CADSMetrics>({
    totalCells: 0,
    activeCells: 0,
    poolUtilization: 0,
    threatLevel: 'low',
    averageResponseTime: 0,
    securityEvents: 0,
    policyViolations: 0,
    systemHealth: 0
  });
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');

  useEffect(() => {
    const initializeCADS = async () => {
      setLoading(true);
      try {
        // Simulate initialization delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock metrics
        setMetrics({
          totalCells: 847,
          activeCells: 623,
          poolUtilization: 73.6,
          threatLevel: 'medium',
          averageResponseTime: 156,
          securityEvents: 12,
          policyViolations: 3,
          systemHealth: 94.2
        });

        setConnectionStatus('connected');
      } catch (error) {
        console.error('Failed to initialize CADS:', error);
        setConnectionStatus('disconnected');
      } finally {
        setLoading(false);
      }
    };

    initializeCADS();

    // Simulate real-time metric updates
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        activeCells: prev.activeCells + Math.floor((Math.random() - 0.5) * 10),
        poolUtilization: Math.max(0, Math.min(100, prev.poolUtilization + (Math.random() - 0.5) * 5)),
        averageResponseTime: Math.max(50, prev.averageResponseTime + (Math.random() - 0.5) * 20),
        systemHealth: Math.max(80, Math.min(100, prev.systemHealth + (Math.random() - 0.5) * 2))
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getThreatLevelColor = (level: CADSMetrics['threatLevel']) => {
    switch (level) {
      case 'low': return 'text-green-400 bg-green-400/20 border-green-400/50';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/50';
      case 'high': return 'text-orange-400 bg-orange-400/20 border-orange-400/50';
      case 'critical': return 'text-red-400 bg-red-400/20 border-red-400/50';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/50';
    }
  };

  const getConnectionStatusColor = (status: typeof connectionStatus) => {
    switch (status) {
      case 'connected': return 'text-green-400';
      case 'connecting': return 'text-yellow-400';
      case 'disconnected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const tabConfig = [
    {
      id: 'overview' as CADSTab,
      label: 'Overview',
      icon: BarChart3,
      component: Overview,
      description: 'System overview and key metrics'
    },
    {
      id: 'live-cells' as CADSTab,
      label: 'Live Cells',
      icon: Activity,
      component: LiveCells,
      description: 'Real-time microcell monitoring'
    },
    {
      id: 'policies' as CADSTab,
      label: 'Policies',
      icon: Shield,
      component: Policies,
      description: 'Security policy management'
    },
    {
      id: 'intent-tokens' as CADSTab,
      label: 'Intent Tokens',
      icon: Key,
      component: IntentTokens,
      description: 'Token vault and generation'
    },
    {
      id: 'genome-explorer' as CADSTab,
      label: 'Genome Explorer',
      icon: Dna,
      component: GenomeExplorer,
      description: 'Genetic algorithm analysis'
    },
    {
      id: 'alerts' as CADSTab,
      label: 'Alerts',
      icon: Bell,
      component: Alerts,
      description: 'Alert stream and correlations'
    },
    {
      id: 'threat-analysis' as CADSTab,
      label: 'Threat Analysis',
      icon: Scan,
      component: ThreatAnalysis,
      description: 'Advanced threat detection'
    },
    {
      id: 'security-ops' as CADSTab,
      label: 'Security Ops',
      icon: ShieldCheck,
      component: SecurityOperations,
      description: 'Security operations center'
    },
    {
      id: 'incident-response' as CADSTab,
      label: 'Incident Response',
      icon: Radar,
      component: IncidentResponse,
      description: 'Incident management and response'
    },
    {
      id: 'compliance' as CADSTab,
      label: 'Compliance',
      icon: FileText,
      component: ComplianceAudit,
      description: 'Compliance audit and reporting'
    },
    {
      id: 'threat-hunting' as CADSTab,
      label: 'Threat Hunting',
      icon: Search,
      component: ThreatHunting,
      description: 'Proactive threat hunting'
    },
    {
      id: 'vulnerability' as CADSTab,
      label: 'Vulnerability',
      icon: Bug,
      component: VulnerabilityManagement,
      description: 'Vulnerability assessment'
    },
    {
      id: 'settings' as CADSTab,
      label: 'Settings',
      icon: SettingsIcon,
      component: CADSSettings,
      description: 'System configuration'
    }
  ];

  const renderActiveComponent = () => {
    const activeConfig = tabConfig.find(tab => tab.id === activeTab);
    if (!activeConfig) return null;

    const Component = activeConfig.component;
    return <Component />;
  };

  if (loading) {
    return (
      <div className="cads-container">
        <div className="cads-loading-screen">
          <motion.div
            className="cads-loading-logo"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <Shield size={64} className="text-cyan-400" />
          </motion.div>
          <motion.h2
            className="cads-loading-title"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            CADS Initializing
          </motion.h2>
          <motion.p
            className="cads-loading-subtitle"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Convergent Autonomic Defense Sphere
          </motion.p>
          <div className="cads-loading-bar">
            <motion.div
              className="cads-loading-progress"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: 1, duration: 1.5 }}
            />
          </div>
          <motion.div
            className="cads-loading-steps"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <div className="step completed">✓ Microcell Pool Initialized</div>
            <div className="step completed">✓ Security Policies Loaded</div>
            <div className="step completed">✓ Genome Database Connected</div>
            <div className="step active">◐ Establishing Threat Intelligence Feed</div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="cads-container">
      {/* Header */}
      <motion.header
        className="cads-header"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="cads-header-content">
          <div className="cads-header-left">
            <div className="cads-logo">
              <Shield size={32} className="text-cyan-400" />
              <div className="cads-logo-text">
                <h1>CADS</h1>
                <span>Convergent Autonomic Defense Sphere</span>
              </div>
            </div>
          </div>

          <div className="cads-header-center">
            <div className="cads-status-indicators">
              <div className="cads-status-item">
                <span className={`cads-status-dot ${getConnectionStatusColor(connectionStatus)}`}></span>
                <span>System {connectionStatus}</span>
              </div>
              <div className="cads-status-item">
                <span className={`cads-threat-indicator ${getThreatLevelColor(metrics.threatLevel)}`}>
                  {metrics.threatLevel === 'critical' && <AlertTriangle size={14} />}
                  {metrics.threatLevel === 'high' && <AlertTriangle size={14} />}
                  {metrics.threatLevel === 'medium' && <Target size={14} />}
                  {metrics.threatLevel === 'low' && <CheckCircle size={14} />}
                  Threat: {metrics.threatLevel.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="cads-header-right">
            <div className="cads-quick-metrics">
              <div className="metric">
                <Server size={16} />
                <span>{metrics.activeCells}/{metrics.totalCells}</span>
              </div>
              <div className="metric">
                <Activity size={16} />
                <span>{metrics.poolUtilization.toFixed(1)}%</span>
              </div>
              <div className="metric">
                <Clock size={16} />
                <span>{metrics.averageResponseTime}ms</span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Navigation */}
      <motion.nav
        className="cads-navigation"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <div className="cads-nav-container">
          {tabConfig.map((tab, index) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`cads-nav-button ${activeTab === tab.id ? 'active' : ''}`}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <tab.icon size={20} />
              <span className="nav-label">{tab.label}</span>
              <span className="nav-description">{tab.description}</span>
            </motion.button>
          ))}
        </div>
      </motion.nav>

      {/* Main Content */}
      <motion.main
        className="cads-main-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="cads-tab-content"
          >
            {renderActiveComponent()}
          </motion.div>
        </AnimatePresence>
      </motion.main>

      {/* Footer Status Bar */}
      <motion.footer
        className="cads-footer"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
      >
        <div className="cads-footer-content">
          <div className="cads-footer-left">
            <span className="version">CADS v7.2.1</span>
            <span className="uptime">Uptime: 47d 12h 34m</span>
          </div>
          
          <div className="cads-footer-center">
            <div className="system-metrics">
              <div className="metric-item">
                <span className="metric-label">System Health:</span>
                <span className={`metric-value ${metrics.systemHealth >= 90 ? 'text-green-400' : metrics.systemHealth >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {metrics.systemHealth.toFixed(1)}%
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Security Events:</span>
                <span className="metric-value text-yellow-400">{metrics.securityEvents}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Policy Violations:</span>
                <span className="metric-value text-red-400">{metrics.policyViolations}</span>
              </div>
            </div>
          </div>

          <div className="cads-footer-right">
            <span className="timestamp">{new Date().toLocaleTimeString()}</span>
            <span className="timezone">UTC-5</span>
          </div>
        </div>
      </motion.footer>

      {/* Background Effects */}
      <div className="cads-background-effects">
        <div className="grid-overlay"></div>
        <div className="particle-system">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="particle"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                opacity: 0
              }}
              animate={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                opacity: [0, 0.3, 0]
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                repeatType: 'loop',
                ease: 'linear'
              }}
            />
          ))}
        </div>
      </div>

      {/* Emergency Alert Overlay */}
      <AnimatePresence>
        {metrics.threatLevel === 'critical' && (
          <motion.div
            className="cads-emergency-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="emergency-alert">
              <AlertTriangle size={48} className="text-red-400" />
              <h2>CRITICAL THREAT DETECTED</h2>
              <p>Immediate action required. Contact security operations center.</p>
              <div className="emergency-actions">
                <button className="emergency-button primary">
                  View Threat Details
                </button>
                <button className="emergency-button secondary">
                  Initiate Lockdown
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CADS;
