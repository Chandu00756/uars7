import './../components/pagecss/dashboard.css';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { 
  Search, 
  Command, 
  Bell, 
  User, 
  Shield, 
  Settings, 
  ChevronLeft,
  Filter,
  Clock,
  Activity,
  Zap,
  Database,
  Brain,
  Menu,
  X,
  Download,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Eye,
  Lock,
  Wifi,
  Server,
  Globe,
  Cpu,
  BarChart3,
  HardDrive,
  MemoryStick,
  Plus,
  Hash,
  Bot,
  Send,
  User as UserIcon
} from 'lucide-react';

// Import separate tab and layer components
import Incidents from './tabs/Incidents';
import Performance from './tabs/Performance';
import Ledger from './tabs/Ledger';
import AIAssist from './tabs/AIAssist';
import CADS from './layers/CADS';
import MSES from './layers/MSES';
import SHEL from './layers/SHEL';
import ILECG from './layers/ILECG';
import QVDM from './layers/QVDM';
import TRDN from './layers/TRDN';
import ADCF from './layers/ADCF';

// Import components
import { MiniTabBar } from '../components/MiniTabBar';
import CommandPalette from '../components/CommandPalette';

// Define proper types
interface ThreatDetails {
  type: string;
  sourceIP: string;
  confidence: number;
  sector: string;
  attackVector: string;
  riskScore: number;
  timestamp?: number;
}

interface HeatmapCell {
  x: number;
  y: number;
  threat: string;
  intensity: number;
  timestamp: number;
  details: ThreatDetails;
}

// Custom Hooks
const useCountUp = (end: number, duration: number = 2000, delay: number = 0) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(easeOutCubic * end));
        
        if (progress === 1) clearInterval(interval);
      }, 16);
      
      return () => clearInterval(interval);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [end, duration, delay]);
  
  return count;
};

const useRealTime = () => {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  return time;
};

const useKeyboardShortcuts = (shortcuts: Record<string, () => void>) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key;
      const isCmd = event.metaKey || event.ctrlKey;
      
      if (isCmd && key === 'k') {
        event.preventDefault();
        shortcuts.search?.();
      }
      
      if (!isCmd && ['1', '2', '3', '4', '5'].includes(key)) {
        event.preventDefault();
        shortcuts[`tab${key}`]?.();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

// Component Definitions
const GlobalHeader: React.FC<{
  onSearchToggle: () => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}> = ({ onSearchToggle, darkMode, onDarkModeToggle, sidebarOpen, onSidebarToggle }) => {
  const [notifications] = useState(12);
  const [environment, setEnvironment] = useState('PROD');
  
  return (
    <header className="portal-header">
      <div className="portal-header-content">
        <div className="portal-header-left">
          <button 
            className="portal-sidebar-toggle portal-lg:portal-hidden"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSidebarToggle();
            }}
            title={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div className="portal-logo">
            <span className="portal-logo-text portal-text-gradient">UARS VII</span>
            <span className="portal-logo-version">Unified Autonomous Resilience Stack 1.0</span>
          </div>
        </div>
        
        <div className="portal-header-center">
          <button 
            className="portal-search portal-ripple"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSearchToggle();
            }}
          >
            <Search size={16} />
            <span>Search everything...</span>
            <div className="portal-search-shortcut">
              <Command size={12} />
              <span>K</span>
            </div>
          </button>
        </div>
        
        <div className="portal-header-right">
          <div className="portal-environment-selector">
            {['PROD', 'STAGE', 'EDGE'].map(env => (
              <button
                key={env}
                className={`${env === environment ? 'portal-env-active' : 'portal-env-inactive'}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEnvironment(env);
                }}
              >
                {env}
              </button>
            ))}
          </div>
          <button 
            className="portal-theme-toggle portal-ripple"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDarkModeToggle();
            }}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? '🌙' : '☀️'}
          </button>
          <button 
            className="portal-notifications portal-ripple"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            title="View Notifications"
          >
            <Bell size={18} />
            {notifications > 0 && (
              <span className="portal-notification-badge portal-pulse">
                {notifications}
              </span>
            )}
          </button>
          
          <div className="portal-user-avatar">
            <User size={18} />
            <div className="portal-fido2-status portal-pulse"></div>
          </div>
        </div>
      </div>
    </header>
  );
};

const PrimarySidebar: React.FC<{
  isOpen: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}> = ({ isOpen, isCollapsed, onToggle, activeSection, onSectionChange }) => {
  const location = useLocation();
  
  const sevenLayers = [
    { id: 'cads', label: 'CADS', icon: Shield, status: 'online', description: 'Cyber Attack Defense System', route: '/layers/cads' },
    { id: 'm-ses', label: 'M-SES', icon: Activity, status: 'warning', description: 'Multi-Sensor Event System', route: '/layers/mses' },
    { id: 'shel', label: 'SHEL', icon: Database, status: 'online', description: 'Secure Hyperledger', route: '/layers/shel' },
    { id: 'ilecg', label: 'ILECG', icon: Zap, status: 'online', description: 'Intelligent Log Event Correlation', route: '/layers/ilecg' },
    { id: 'qvdm', label: 'QVDM', icon: Brain, status: 'offline', description: 'Quantum Variant Detection Matrix', route: '/layers/qvdm' },
    { id: 'trdn', label: 'TRDN', icon: Clock, status: 'online', description: 'Time-Reversible Data Network', route: '/layers/trdn' },
    { id: 'adcf', label: 'ADCF', icon: Settings, status: 'online', description: 'Autonomous Defense Control Framework', route: '/layers/adcf' }
  ];
  
  const managementItems = [
    { id: 'governance', label: 'Governance', icon: Shield },
    { id: 'compliance', label: 'Compliance', icon: CheckCircle },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];
  
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="portal-fixed portal-inset-0 portal-bg-primary portal-z-40 portal-lg:portal-hidden portal-mobile-overlay"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggle();
          }}
        />
      )}
      
      <nav className={`portal-sidebar ${isCollapsed ? 'collapsed' : ''} ${isOpen ? 'open' : ''}`}>
        <button 
          className="portal-sidebar-toggle portal-hidden portal-lg:portal-flex"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggle();
          }}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft size={16} style={{ 
            transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease'
          }} />
        </button>
        
        <div className="portal-sidebar-content">
          {/* Dashboard Link */}
          <div className="portal-nav-section">
            <Link
              to="/dashboard"
              className={`portal-nav-item ${location.pathname === '/dashboard' ? 'active' : ''} portal-holo-border`}
              title="Dashboard Overview"
            >
              <BarChart3 size={18} />
              {!isCollapsed && (
                <span className="portal-flex-1 portal-text-left">Dashboard</span>
              )}
            </Link>
          </div>
          
          <div className="portal-nav-section">
            <h3 className="portal-nav-title">Dimensions</h3>
            {sevenLayers.map((item, index) => (
              <Link
                key={item.id}
                to={item.route}
                className={`portal-nav-item ${location.pathname === item.route ? 'active' : ''} portal-holo-border`}
                title={item.description}
              >
                <item.icon size={18} />
                {!isCollapsed && (
                  <>
                    <span className="portal-flex-1 portal-text-left">{item.label}</span>
                    <div className={`portal-status-indicator ${item.status}`}></div>
                  </>
                )}
              </Link>
            ))}
          </div>
          
          {!isCollapsed && (
            <div className="portal-nav-section">
              <h3 className="portal-nav-title">Management</h3>
              {managementItems.map(item => (
                <button 
                  key={item.id}
                  className={`portal-nav-item ${activeSection === item.id ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSectionChange(item.id);
                  }}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

const ContextRail: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [timeRange, setTimeRange] = useState('24h');
  const [environment, setEnvironment] = useState('PROD');
  const [activeFilters, setActiveFilters] = useState(['Critical', 'High', 'Medium']);
  
  const removeFilter = (filter: string) => {
    setActiveFilters(prev => prev.filter(f => f !== filter));
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  
  return (
    <div className="portal-context-rail-overlay">
      <div 
        className="portal-context-rail-backdrop"
        onClick={onClose}
      />
      
      <div
        className="portal-context-rail-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="portal-filters-header">
          <h3 className="portal-filters-title">Filters</h3>
          <button 
            onClick={onClose}
            className="portal-close-button"
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label="Close filters"
            title="Close filters"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="portal-filter-section">
          <h4 className="portal-filter-section-title">
            Time Range
          </h4>
          <div className="portal-filter-button-group">
            {['1h', '6h', '24h', '7d', '30d'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`portal-filter-button ${timeRange === range ? 'active' : ''}`}
                onMouseEnter={(e) => {
                  if (timeRange !== range) {
                    e.currentTarget.style.backgroundColor = '#4b5563';
                  }
                }}
                onMouseLeave={(e) => {
                  if (timeRange !== range) {
                    e.currentTarget.style.backgroundColor = '#374151';
                  }
                }}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        
        <div className="portal-filter-section">
          <h4 className="portal-filter-section-title">
            Environment
          </h4>
          <div className="portal-filter-button-group">
            {['PROD', 'STAGE', 'EDGE'].map(env => (
              <button 
                key={env}
                onClick={() => setEnvironment(env)}
                className={`portal-filter-button ${environment === env ? 'active' : ''}`}
                onMouseEnter={(e) => {
                  if (environment !== env) {
                    e.currentTarget.style.backgroundColor = '#059669';
                  }
                }}
                onMouseLeave={(e) => {
                  if (environment !== env) {
                    e.currentTarget.style.backgroundColor = '#6b7280';
                  }
                }}
              >
                {env}
              </button>
            ))}
          </div>
        </div>
        
        <div className="portal-filter-section">
          <h4 className="portal-filter-section-title">
            Threat Levels
          </h4>
          <div className="portal-filter-button-group">
            {activeFilters.map(filter => (
              <span 
                key={filter}
                className="portal-filter-chip"
              >
                {filter}
                <button 
                  onClick={() => removeFilter(filter)}
                  className="portal-remove-filter-button"
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
        
        <div className="portal-quick-actions-section">
          <h4 className="portal-filter-section-title">
            Quick Actions
          </h4>
          <div className="portal-quick-actions-buttons">
            {[
              { icon: Download, label: 'Export Report' },
              { icon: AlertTriangle, label: 'Create Alert' },
              { icon: Eye, label: 'Run Scan' }
            ].map(({ icon: Icon, label }) => (
              <button 
                key={label}
                onClick={() => {
                  console.log(`${label} clicked`);
                  alert(`${label} action triggered!`);
                }}
                className="portal-quick-action-button"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#374151'}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const SevenLayerHealthRibbon: React.FC = () => {
  const layers = [
    { name: 'CADS', status: 'healthy', value: 98.7, trend: [95, 97, 98, 99, 98] },
    { name: 'M-SES', status: 'warning', value: 85.3, trend: [88, 86, 85, 87, 85] },
    { name: 'SHEL', status: 'healthy', value: 99.2, trend: [98, 99, 99, 100, 99] },
    { name: 'ILECG', status: 'healthy', value: 97.8, trend: [96, 97, 98, 98, 98] },
    { name: 'QVDM', status: 'error', value: 73.1, trend: [80, 78, 75, 74, 73] },
    { name: 'TRDN', status: 'healthy', value: 96.4, trend: [95, 96, 97, 96, 96] },
    { name: 'ADCF', status: 'healthy', value: 99.1, trend: [98, 99, 99, 100, 99] }
  ];
  
  return (
    <section className="portal-health-ribbon portal-mb-6">
      <div className="portal-ribbon-content">
        {layers.map((layer, index) => (
          <div
            key={layer.name}
            className={`portal-health-pill ${layer.status} portal-holo-border portal-slide-up portal-animation-delay-${index * 100}`}
          >
            <div className="portal-pill-header">
              <span className="portal-pill-name portal-font-mono">{layer.name}</span>
              <div className={`portal-pill-status ${layer.status} portal-pulse`}></div>
            </div>
            <div className="portal-pill-value portal-text-2xl portal-font-bold portal-mb-2">
              {layer.value}%
            </div>
            <div className="portal-pill-sparkline">
              <svg viewBox="0 0 60 20" className="portal-w-full portal-h-full">
                <polyline
                  points={layer.trend.map((val, i) => `${i * 15},${20 - (val - 70) / 2}`).join(' ')}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="portal-text-accent"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const RiskHorizonHeatmap: React.FC = () => {
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);
  const [timePosition, setTimePosition] = useState(100);
  const [isRealTime, setIsRealTime] = useState(true);
  const [threatFilter, setThreatFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  const [pulseOpacity, setPulseOpacity] = useState(1);
  
  useEffect(() => {
    if (!isRealTime) return;
    
    const pulseInterval = setInterval(() => {
      setPulseOpacity(prev => prev === 1 ? 0.3 : 1);
    }, 800);
    
    return () => clearInterval(pulseInterval);
  }, [isRealTime]);

  const generateThreatDetails = (x: number, y: number, threat: string, intensity: number): ThreatDetails => {
    const threatTypes = {
      high: ['SQL Injection', 'Zero-day Exploit', 'Advanced Persistent Threat', 'Ransomware'],
      medium: ['Brute Force', 'Phishing Attempt', 'Malware Detection', 'Suspicious Traffic'],
      low: ['Port Scan', 'Failed Login', 'Policy Violation', 'Anomalous Behavior']
    };
    
    const type = threatTypes[threat as keyof typeof threatTypes][Math.floor(Math.random() * 4)];
    const sourceIP = `192.168.${Math.floor(x/3)}.${y * 15 + Math.floor(Math.random() * 15)}`;
    const confidence = Math.floor(intensity * 100);
    
    return {
      type,
      sourceIP,
      confidence,
      sector: `Zone-${Math.floor(x/4)}-${Math.floor(y/4)}`,
      attackVector: x < 12 ? 'External' : 'Internal',
      riskScore: Math.floor(intensity * 1000),
      timestamp: Date.now()
    };
  };

  const generateRealisticHeatmapData = useCallback((): HeatmapCell[] => {
    const data: HeatmapCell[] = [];
    const currentTime = Date.now();
    
    for (let x = 0; x < 24; x++) {
      for (let y = 0; y < 16; y++) {
        const distanceFromCenter = Math.sqrt(Math.pow(x - 12, 2) + Math.pow(y - 8, 2));
        const timeBasedVariation = Math.sin(currentTime / 10000 + x * 0.1 + y * 0.1) * 0.3;
        
        let baseIntensity = 0.2;
        if (x < 6 || x > 18) baseIntensity = 0.6;
        if (y < 4 || y > 12) baseIntensity = 0.4;
        if (x >= 10 && x <= 14 && y >= 6 && y <= 10) baseIntensity = 0.1;
        
        const intensity = Math.max(0, Math.min(1, 
          baseIntensity + 
          (Math.random() - 0.5) * 0.4 + 
          timeBasedVariation +
          (distanceFromCenter > 8 ? 0.2 : 0)
        ));
        
        const threat = intensity > 0.7 ? 'high' : intensity > 0.4 ? 'medium' : 'low';
        
        data.push({ 
          x, 
          y, 
          intensity, 
          threat,
          timestamp: currentTime,
          details: generateThreatDetails(x, y, threat, intensity)
        });
      }
    }
    return data;
  }, []);

  useEffect(() => {
    const updateData = () => {
      setHeatmapData(generateRealisticHeatmapData());
      setLastUpdate(new Date());
    };

    updateData();

    if (isRealTime) {
      const interval = setInterval(updateData, 2000);
      return () => clearInterval(interval);
    }
  }, [generateRealisticHeatmapData, isRealTime]);

  const handleCellClick = (cell: HeatmapCell) => {
    setSelectedCell(cell);
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleCellHover = (cell: HeatmapCell) => {
    setHoveredCell(cell);
  };

  const handleCellLeave = () => {
    setHoveredCell(null);
  };

  const filteredData = heatmapData.filter(cell => 
    threatFilter === 'all' || cell.threat === threatFilter
  );

  return (
    <motion.div 
      className="portal-risk-heatmap portal-bg-surface portal-rounded-xl portal-p-6 portal-shadow-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="portal-heatmap-header portal-flex portal-justify-between portal-items-center portal-mb-6">
        <div>
          <h3 className="portal-text-xl portal-font-semibold portal-mb-2">
            Risk Horizon - Threat Forecast
          </h3>
          <div className="portal-risk-heatmap-header">
            <span>Last Update: {lastUpdate.toLocaleTimeString()}</span>
          </div>
        </div>
        
        <div className="portal-flex portal-items-center portal-gap-4">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsRealTime(!isRealTime);
            }}
            className={`portal-risk-heatmap-controls ${isRealTime ? 'portal-realtime-active' : 'portal-realtime-inactive'}`}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <div 
              className={`portal-realtime-indicator ${isRealTime ? 'active pulse-active' : 'inactive pulse-inactive'}`}
              style={isRealTime ? { '--pulse-opacity': pulseOpacity } as React.CSSProperties : {}}
            />
            <span className="portal-realtime-text">
              {isRealTime ? 'LIVE' : 'PAUSED'}
            </span>
          </button>

          <select
            value={threatFilter}
            onChange={(e) => {
              e.preventDefault();
              setThreatFilter(e.target.value as any);
            }}
            className="portal-px-3 portal-py-1 portal-rounded portal-bg-white portal-text-white portal-text-sm"
            aria-label="Filter threats by risk level"
            title="Filter threats by risk level"
          >
            <option value="all">All Threats</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>

          <div className="portal-heatmap-legend portal-flex portal-gap-4">
            <div className="portal-legend-item low portal-flex portal-items-center portal-gap-2">
              <div className="portal-w-3 portal-h-3 portal-bg-success portal-rounded"></div>
              <span className="portal-text-sm">Low</span>
            </div>
            <div className="portal-legend-item medium portal-flex portal-items-center portal-gap-2">
              <div className="portal-w-3 portal-h-3 portal-bg-warning portal-rounded"></div>
              <span className="portal-text-sm">Medium</span>
            </div>
            <div className="portal-legend-item high portal-flex portal-items-center portal-gap-2">
              <div className="portal-w-3 portal-h-3 portal-bg-error portal-rounded"></div>
              <span className="portal-text-sm">High</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="portal-heatmap-container portal-relative">
        <div className="portal-heatmap-grid portal-relative portal-cursor-crosshair">
          {filteredData.map((cell, index) => (
            <motion.div
              key={`${cell.x}-${cell.y}`}
              className={`portal-heatmap-cell portal-heatmap-cell-${cell.threat} portal-cursor-pointer portal-transition-all portal-duration-200`}
              style={{
                gridColumn: cell.x + 1,
                gridRow: cell.y + 1,
                opacity: 0.4 + (cell.intensity * 0.6),
                transform: hoveredCell?.x === cell.x && hoveredCell?.y === cell.y ? 'scale(1.2)' : 'scale(1)',
                zIndex: hoveredCell?.x === cell.x && hoveredCell?.y === cell.y ? 10 : 1,
                boxShadow: selectedCell?.x === cell.x && selectedCell?.y === cell.y 
                  ? '0 0 0 2px #FF7F50, 0 0 20px rgba(255, 127, 80, 0.5)' 
                  : 'none'
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.4 + (cell.intensity * 0.6) }}
              transition={{ delay: index * 0.001, duration: 0.3 }}
              onClick={() => handleCellClick(cell)}
              onMouseEnter={() => handleCellHover(cell)}
              onMouseLeave={handleCellLeave}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.95 }}
            />
          ))}
        </div>
        
        <AnimatePresence>
          {hoveredCell && (
            <motion.div 
              className="portal-chart-tooltip portal-absolute portal-z-20 portal-bg-surface portal-border portal-rounded-lg portal-p-4 portal-shadow-lg"
              style={{
                left: `${(hoveredCell.x / 24) * 100}%`,
                top: `${(hoveredCell.y / 16) * 100}%`,
                transform: 'translate(-50%, -120%)'
              }}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="portal-font-mono portal-text-xs portal-mb-2">
                <div className="portal-font-bold portal-text-accent">
                  Grid: [{hoveredCell.x}, {hoveredCell.y}]
                </div>
                <div className="portal-text-secondary">
                  Time: {new Date(hoveredCell.details.timestamp || Date.now()).toLocaleTimeString()}
                </div>
              </div>
              
              <div className="portal-space-y-1">
                <div className="portal-flex portal-justify-between">
                  <span className="portal-text-sm">Threat Level:</span>
                  <span className={`portal-font-bold portal-text-sm ${
                    hoveredCell.threat === 'high' ? 'portal-text-error' :
                    hoveredCell.threat === 'medium' ? 'portal-text-warning' :
                    'portal-text-success'
                  }`}>
                    {hoveredCell.threat.toUpperCase()}
                  </span>
                </div>
                
                <div className="portal-flex portal-justify-between">
                  <span className="portal-text-sm">Type:</span>
                  <span className="portal-text-sm portal-font-medium">{hoveredCell.details.type}</span>
                </div>
                
                <div className="portal-flex portal-justify-between">
                  <span className="portal-text-sm">Source:</span>
                  <span className="portal-text-sm portal-font-mono">{hoveredCell.details.sourceIP}</span>
                </div>
                
                <div className="portal-flex portal-justify-between">
                  <span className="portal-text-sm">Confidence:</span>
                  <span className="portal-text-sm portal-font-bold">{hoveredCell.details.confidence}%</span>
                </div>
                
                <div className="portal-flex portal-justify-between">
                  <span className="portal-text-sm">Risk Score:</span>
                  <span className="portal-text-sm portal-font-bold portal-text-accent">{hoveredCell.details.riskScore}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="portal-time-scrubber portal-mt-6">
        <div className="portal-flex portal-items-center portal-justify-between portal-mb-2">
          <span className="portal-text-sm portal-font-medium">Time Range Analysis</span>
          <span className="portal-text-sm portal-text-secondary">
            {Math.floor((timePosition / 100) * 24)}h ago to now
          </span>
        </div>
        
        <div className="portal-relative">
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={timePosition}
            onChange={(e) => setTimePosition(Number(e.target.value))}
            className="portal-scrubber-input portal-w-full portal-h-2 portal-bg-secondary portal-rounded-lg portal-appearance-none portal-cursor-pointer portal-time-scrubber"
            aria-label="Time position scrubber"
            title="Adjust time position"
          />
          <div 
            className="portal-scrubber-thumb portal-scrubber-thumb-dynamic"
            style={{ '--thumb-position': `calc(${timePosition}% - 8px)` } as React.CSSProperties}
          />
        </div>
        
        <div className="portal-scrubber-labels portal-flex portal-justify-between portal-mt-2">
          <span className="portal-text-xs portal-text-secondary">24h ago</span>
          <span className="portal-text-xs portal-text-secondary">12h ago</span>
          <span className="portal-text-xs portal-text-secondary">6h ago</span>
          <span className="portal-text-xs portal-text-secondary">Now</span>
        </div>
      </div>

      <AnimatePresence>
        {selectedCell && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="portal-threat-details"
          >
            <div className="portal-threat-details-header">
              <h4>
                Threat Analysis - Grid [{selectedCell.x}, {selectedCell.y}]
              </h4>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedCell(null);
                }}
                className="portal-threat-details-close"
                onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
              >
                ✕
              </button>
            </div>
            
            <div className="portal-threat-grid">
              <div>
                <h5>
                  Threat Details
                </h5>
                <div className="portal-detail-column">
                  <div className="portal-detail-row">
                    <span className="portal-detail-label">Type:</span> {selectedCell.details.type}
                  </div>
                  <div className="portal-detail-row">
                    <span className="portal-detail-label">Sector:</span> {selectedCell.details.sector}
                  </div>
                  <div className="portal-detail-row">
                    <span className="portal-detail-label">Vector:</span> {selectedCell.details.attackVector}
                  </div>
                  <div className="portal-detail-row">
                    <span className="portal-detail-label">Source IP:</span> 
                    <code className="portal-source-ip-code">
                      {selectedCell.details.sourceIP}
                    </code>
                  </div>
                </div>
              </div>
              
              <div>
                <h5>
                  Risk Assessment
                </h5>
                <div className="portal-detail-column">
                  <div className="portal-detail-row">
                    <span className="portal-detail-label">Risk Score:</span> {selectedCell.details.riskScore}/1000
                  </div>
                  <div className="portal-detail-row">
                    <span className="portal-detail-label">Confidence:</span> {selectedCell.details.confidence}%
                  </div>
                  <div className="portal-detail-row">
                    <span className="portal-detail-label">Intensity:</span> {Math.floor(selectedCell.intensity * 100)}%
                  </div>
                  <div className="portal-detail-row">
                    <span className="portal-detail-label">Classification:</span>
                    <span className={`portal-threat-classification portal-threat-${selectedCell.threat}`}>
                      {selectedCell.threat.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="portal-action-buttons">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Investigate clicked for cell:', selectedCell);
                  alert('Investigate action triggered!');
                }}
                className="portal-action-button portal-action-primary"
              >
                Investigate
              </button>
              
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Block Source clicked for:', selectedCell.details.sourceIP);
                  alert(`Block Source ${selectedCell.details.sourceIP} action triggered!`);
                }}
                className="portal-action-button portal-action-warning"
              >
                Block Source
              </button>
              
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Create Rule clicked for threat type:', selectedCell.details.type);
                  alert(`Create Rule for ${selectedCell.details.type} action triggered!`);
                }}
                className="portal-action-button portal-action-outline"
              >
                Create Rule
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const LedgerThroughputCard: React.FC = () => {
  const blocksPerSecond = useCountUp(1247, 2000, 500);
  const hashLatency = useCountUp(23, 2000, 700);
  const activePeers = useCountUp(156, 2000, 900);
  const throughputPercentage = 75;
  
  const recentTransactions = [
    { hash: '0xa7f3b2c1', status: 'verified', timestamp: '14:32:15' },
    { hash: '0x9e4d8f6a', status: 'verified', timestamp: '14:32:14' },
    { hash: '0x5c2b9e7f', status: 'pending', timestamp: '14:32:13' },
    { hash: '0x8f1a4d3c', status: 'verified', timestamp: '14:32:12' },
    { hash: '0x3e7b5a9d', status: 'verified', timestamp: '14:32:11' }
  ];
  
  return (
    <div className="portal-ledger-card portal-bg-surface portal-rounded-xl portal-p-6 portal-shadow-md">
      <div className="portal-card-header">
        <h3 className="portal-text-xl portal-font-semibold">
          Ledger Throughput
        </h3>
        <div className="portal-card-status active portal-pulse">
          HYPERLEDGER FABRIC
        </div>
      </div>
      
      <div className="portal-ledger-metrics portal-mb-6">
        <div className="portal-donut-chart portal-relative">
          <svg viewBox="0 0 120 120" className="portal-w-32 portal-h-32">
            <defs>
              <linearGradient id="donutGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF7F50" />
                <stop offset="100%" stopColor="#415A77" />
              </linearGradient>
            </defs>
            <circle 
              cx="60" cy="60" r="45" 
              fill="none" 
              stroke="rgba(65, 90, 119, 0.2)" 
              strokeWidth="8" 
            />
            <circle
              cx="60" cy="60" r="45" 
              fill="none" 
              stroke="url(#donutGradient)" 
              strokeWidth="8"
              strokeDasharray="283"
              strokeDashoffset={283 - (283 * throughputPercentage / 100)}
              className="portal-transition-all portal-duration-1000"
            />
          </svg>
          <div className="portal-donut-center portal-absolute portal-inset-0 portal-flex portal-flex-col portal-items-center portal-justify-center">
            <span className="portal-text-2xl portal-font-bold portal-text-accent">
              {blocksPerSecond}
            </span>
            <span className="portal-text-xs portal-text-secondary portal-font-mono">
              blocks/sec
            </span>
          </div>
        </div>
        
        <div className="portal-metric-secondary portal-grid portal-grid-cols-2 portal-gap-4 portal-mt-4">
          <div className="portal-metric-item portal-text-center">
            <div className="portal-text-lg portal-font-bold portal-text-warning">
              {hashLatency}ms
            </div>
            <div className="portal-text-xs portal-text-secondary">Hash Latency</div>
          </div>
          <div className="portal-metric-item portal-text-center">
            <div className="portal-text-lg portal-font-bold portal-text-success">
              {activePeers}
            </div>
            <div className="portal-text-xs portal-text-secondary">Active Peers</div>
          </div>
        </div>
      </div>
      
      <div className="portal-transaction-stream">
        <h4 className="portal-text-sm portal-font-semibold portal-mb-3">
          Live Transaction Stream
        </h4>
        <div className="portal-stream-items portal-space-y-2 portal-max-h-32 portal-overflow-y-auto">
          {recentTransactions.map((tx, i) => (
            <div 
              key={tx.hash}
              className={`portal-stream-item portal-flex portal-items-center portal-justify-between portal-p-2 portal-bg-primary portal-bg-opacity-5 portal-rounded portal-slide-left portal-animation-delay-${i * 100}`}
            >
              <div className="portal-flex portal-items-center portal-gap-2">
                <code className="portal-text-xs portal-font-mono portal-text-secondary">
                  {tx.hash}
                </code>
                <span className="portal-text-xs portal-text-secondary">
                  {tx.timestamp}
                </span>
              </div>
              <div className={`portal-stream-status ${tx.status === 'verified' ? 'portal-text-success' : 'portal-text-warning'}`}>
                {tx.status === 'verified' ? <CheckCircle size={14} /> : <Clock size={14} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const BottomTiles: React.FC = () => {
  const time = useRealTime();
  
  const intentTokens = [
    { name: 'AUTH_VERIFY', usage: 89, expires: '2h 15m', color: 'portal-bg-accent' },
    { name: 'DATA_ACCESS', usage: 76, expires: '4h 32m', color: 'portal-bg-secondary' },
    { name: 'CRYPTO_SIGN', usage: 68, expires: '1h 45m', color: 'portal-bg-warning' },
    { name: 'NET_TUNNEL', usage: 54, expires: '6h 18m', color: 'portal-bg-success' },
    { name: 'SYS_ADMIN', usage: 43, expires: '3h 27m', color: 'portal-bg-error' }
  ];
  
  const securityEvents = [
    { severity: 'high', event: 'BREACH:FIREWALL_001', timestamp: '14:32:15', icon: AlertTriangle },
    { severity: 'medium', event: 'ALERT:SUSPICIOUS_IP', timestamp: '14:31:42', icon: Eye },
    { severity: 'high', event: 'BLOCK:MALWARE_DETECTED', timestamp: '14:30:18', icon: Shield },
    { severity: 'low', event: 'INFO:ROUTINE_SCAN', timestamp: '14:29:55', icon: CheckCircle },
    { severity: 'high', event: 'CRITICAL:DATA_EXFIL', timestamp: '14:28:33', icon: AlertTriangle },
    { severity: 'medium', event: 'WARN:HIGH_TRAFFIC', timestamp: '14:27:21', icon: TrendingUp }
  ];
  
  const systemResources = [
    { name: 'CPU', value: 73, icon: Cpu, color: 'portal-text-warning' },
    { name: 'RAM', value: 45, icon: MemoryStick, color: 'portal-text-success' },
    { name: 'DISK', value: 89, icon: HardDrive, color: 'portal-text-error' },
    { name: 'NET', value: 62, icon: Wifi, color: 'portal-text-accent' }
  ];
  
  return (
    <div className="portal-bottom-grid portal-grid-auto-fit portal-gap-6">
      <div className="portal-tile portal-holo-border">
        <h4 className="portal-text-lg portal-font-semibold portal-mb-4">
          Top 5 Intent Tokens
        </h4>
        <div className="portal-intent-list portal-space-y-3">
          {intentTokens.map((token, index) => (
            <div 
              key={token.name}
              className={`portal-intent-item portal-slide-left portal-animation-delay-${index * 100}`}
            >
              <div className="portal-intent-info portal-flex-1">
                <div className="portal-flex portal-items-center portal-justify-between portal-mb-1">
                  <span className="portal-font-mono portal-text-sm portal-font-semibold">
                    {token.name}
                  </span>
                  <span className="portal-text-xs portal-text-secondary">
                    {token.expires}
                  </span>
                </div>
                <div className="portal-intent-bar portal-relative portal-h-2 portal-bg-primary portal-bg-opacity-10 portal-rounded-full portal-overflow-hidden">
                  <div 
                    className={`portal-intent-fill portal-intent-fill-dynamic portal-h-full ${token.color} portal-rounded-full portal-transition-all portal-duration-1000 portal-animation-delay-${500 + index * 100}`}
                    style={{ '--progress-width': `${token.usage}%` } as React.CSSProperties}
                  />
                </div>
              </div>
              <span className="portal-font-mono portal-text-sm portal-font-bold portal-ml-3">
                {token.usage}%
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="portal-tile portal-holo-border">
        <h4 className="portal-text-lg portal-font-semibold portal-mb-4">
          QVDM Consensus Health
        </h4>
        <div className="portal-gauge-container portal-flex portal-flex-col portal-items-center portal-justify-center portal-h-48">
          <div className="portal-relative portal-w-48 portal-h-32 portal-mb-4">
            <div className="portal-gauge-semicircle">
              <div className="portal-gauge-background" />
              
              <div className="portal-gauge-fill" />
              
              <div className="portal-gauge-labels">
                <span className="portal-gauge-value">
                  73%
                </span>
                <span className="portal-gauge-label">
                  CONSENSUS
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="portal-tile portal-holo-border">
        <h4 className="portal-text-lg portal-font-semibold portal-mb-4">
          TRDN Rollback Ready
        </h4>
        <div className="portal-flip-clock portal-flex portal-flex-col portal-items-center portal-justify-center portal-h-40">
          <div className="portal-clock-display portal-text-3xl portal-font-bold portal-font-mono portal-text-accent portal-mb-2">
            {time.toLocaleTimeString('en-US', { 
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
          <div className="portal-clock-label portal-text-xs portal-text-secondary portal-font-mono">
            SNAPSHOT DELTA
          </div>
          <div className="portal-flex portal-items-center portal-gap-2 portal-mt-3">
            <div className="portal-status-indicator online portal-pulse"></div>
            <span className="portal-text-sm portal-font-semibold portal-text-success">
              SYNCHRONIZED
            </span>
          </div>
        </div>
      </div>
      
      <div className="portal-tile portal-holo-border">
        <h4 className="portal-text-lg portal-font-semibold portal-mb-4">
          Security Events
        </h4>
        <div className="portal-events-container portal-h-40 portal-overflow-hidden">
          <div className="portal-events-scroll portal-space-y-2">
            {securityEvents.map((event, idx) => (
              <div 
                key={idx}
                className={`portal-event-item portal-flex portal-items-center portal-gap-3 portal-p-2 portal-bg-primary portal-bg-opacity-5 portal-rounded portal-slide-left portal-animation-delay-${idx * 100}`}
              >
                <div className="portal-flex portal-items-center portal-gap-2">
                  <event.icon 
                    size={14} 
                    className={`${
                      event.severity === 'high' ? 'portal-text-error' : 
                      event.severity === 'medium' ? 'portal-text-warning' : 
                      'portal-text-success'
                    }`}
                  />
                  <span className="portal-text-xs portal-text-secondary portal-font-mono">
                    {event.timestamp}
                  </span>
                </div>
                <code className="portal-text-xs portal-font-mono portal-text-accent portal-flex-1">
                  {event.event}
                </code>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="portal-tile portal-holo-border">
        <h4 className="portal-text-lg portal-font-semibold portal-mb-4">
          System Resources
        </h4>
        <div className="portal-resource-grid portal-space-y-3">
          {systemResources.map((resource, index) => (
            <div 
              key={resource.name}
              className={`portal-resource-item portal-slide-left portal-animation-delay-${index * 100}`}
            >
              <div className="portal-flex portal-items-center portal-justify-between portal-mb-2">
                <div className="portal-flex portal-items-center portal-gap-2">
                  <resource.icon size={16} className={resource.color} />
                  <span className="portal-text-sm portal-font-semibold">
                    {resource.name}
                  </span>
                </div>
                <span className="portal-text-sm portal-font-mono portal-font-bold">
                  {resource.value}%
                </span>
              </div>
              <div className="portal-relative portal-h-2 portal-bg-primary portal-bg-opacity-10 portal-rounded-full portal-overflow-hidden">
                <div 
                  className={`portal-h-full portal-intent-fill-dynamic ${
                    resource.value > 80 ? 'portal-bg-error' :
                    resource.value > 60 ? 'portal-bg-warning' :
                    'portal-bg-success'
                  } portal-rounded-full portal-transition-all portal-duration-1000 portal-animation-delay-${500 + index * 100}`}
                  style={{ '--progress-width': `${resource.value}%` } as React.CSSProperties}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="portal-tile portal-holo-border">
        <h4 className="portal-text-lg portal-font-semibold portal-mb-4">
          Network Status
        </h4>
        <div className="portal-network-stats portal-space-y-4">
          <div className="portal-stat-item portal-text-center">
            <div className="portal-flex portal-items-center portal-justify-center portal-gap-2 portal-mb-2">
              <Globe size={20} className="portal-text-accent" />
              <span className="portal-text-lg portal-font-bold portal-text-accent">
                {useCountUp(1247)} GB
              </span>
            </div>
            <div className="portal-text-xs portal-text-secondary">INBOUND TRAFFIC</div>
          </div>
          <div className="portal-stat-item portal-text-center">
            <div className="portal-flex portal-items-center portal-justify-center portal-gap-2 portal-mb-2">
              <Server size={20} className="portal-text-success" />
              <span className="portal-text-lg portal-font-bold portal-text-success">
                {useCountUp(892)} GB
              </span>
            </div>
            <div className="portal-text-xs portal-text-secondary">OUTBOUND TRAFFIC</div>
          </div>
          <div className="portal-status-grid portal-grid portal-grid-cols-3 portal-gap-2 portal-mt-4">
            <div className="portal-status-item">
              <div className="portal-status-indicator online"></div>
              <span className="portal-status-label">NODES</span>
            </div>
            <div className="portal-status-item">
              <div className="portal-status-indicator warning"></div>
              <span className="portal-status-label">PEERS</span>
            </div>
            <div className="portal-status-item">
              <div className="portal-status-indicator online"></div>
              <span className="portal-status-label">GATEWAYS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Content renderer function
const renderContent = (activeTab: string, activeSection: string) => {
  // If a layer is selected, show layer content
  if (['cads', 'm-ses', 'shel', 'ilecg', 'qvdm', 'trdn', 'adcf'].includes(activeSection)) {
    switch (activeSection) {
      case 'cads': return <CADS />;
      case 'm-ses': return <MSES />;
      case 'shel': return <SHEL />;
      case 'ilecg': return <ILECG />;
      case 'qvdm': return <QVDM />;
      case 'trdn': return <TRDN />;
      case 'adcf': return <ADCF />;
      default: return renderOverviewContent();
    }
  }
  
  // Otherwise show tab content
  switch (activeTab) {
    case 'incidents': return <Incidents />;
    case 'performance': return <Performance />;
    case 'ledger': return <Ledger />;
    case 'ai-assist': return <AIAssist />;
    case 'overview':
    default: return renderOverviewContent();
  }
};

// Overview content (your current dashboard)
const renderOverviewContent = () => {
  return (
    <>
      <SevenLayerHealthRibbon />
      
      <div className="portal-primary-grid portal-grid portal-grid-cols-1 portal-lg:portal-grid-cols-3 portal-gap-6 portal-mb-6">
        <div className="portal-lg:portal-col-span-2">
          <RiskHorizonHeatmap />
        </div>
        <div>
          <LedgerThroughputCard />
        </div>
      </div>
      
      <BottomTiles />
    </>
  );
};

// Main Dashboard Component
const PortalVIIDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [contextRailOpen, setContextRailOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Keyboard shortcuts
  useKeyboardShortcuts({
    search: () => setCommandPaletteOpen(true),
    tab1: () => {
      setActiveTab('overview');
      setActiveSection('overview');
    },
    tab2: () => {
      setActiveTab('incidents');
      setActiveSection('overview');
    },
    tab3: () => {
      setActiveTab('performance');
      setActiveSection('overview');
    },
    tab4: () => {
      setActiveTab('ledger');
      setActiveSection('overview');
    },
    tab5: () => {
      setActiveTab('ai-assist');
      setActiveSection('overview');
    }
  });
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    if (sidebarOpen || contextRailOpen) {
      document.body.classList.add('portal-no-scroll');
    } else {
      document.body.classList.remove('portal-no-scroll');
    }
    
    return () => document.body.classList.remove('portal-no-scroll');
  }, [sidebarOpen, contextRailOpen]);

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setActiveSection('overview');
  };

  // Handle section change
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setSidebarOpen(false);
  };
  
  return (
    <div className={`portal-dashboard ${isLoaded ? 'portal-fade-in' : ''}`}>
      <GlobalHeader 
        onSearchToggle={() => setCommandPaletteOpen(true)}
        darkMode={darkMode}
        onDarkModeToggle={() => setDarkMode(!darkMode)}
        sidebarOpen={sidebarOpen}
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className="portal-layout">
        <PrimarySidebar 
          isOpen={sidebarOpen}
          isCollapsed={sidebarCollapsed}
          onToggle={() => {
            setSidebarCollapsed(!sidebarCollapsed);
            setSidebarOpen(false);
          }}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />

        <main className={`portal-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <MiniTabBar
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          <div className="portal-content">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeTab}-${activeSection}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderContent(activeTab, activeSection)}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <ContextRail
          isOpen={contextRailOpen}
          onClose={() => setContextRailOpen(false)}
        />
      </div>

      <button
        className="portal-fab portal-ripple"
        onClick={() => setContextRailOpen(!contextRailOpen)}
        title="Toggle Filters"
      >
        <Filter size={24} />
      </button>

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
};

export default PortalVIIDashboard;

