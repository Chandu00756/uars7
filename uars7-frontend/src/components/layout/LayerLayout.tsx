import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Shield, 
  Activity, 
  Database, 
  Zap, 
  Brain, 
  Clock, 
  Settings,
  BarChart3,
  ChevronLeft,
  CheckCircle,
  Bell,
  User,
  Menu
} from 'lucide-react';
import '../pagecss/dashboard.css';

interface LayerLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

const LayerLayout: React.FC<LayerLayoutProps> = ({ children, pageTitle }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();

  const sevenLayers = [
    { id: 'cads', label: 'CADS', icon: Shield, status: 'online', description: 'Cyber Attack Defense System', route: '/layers/cads' },
    { id: 'mses', label: 'M-SES', icon: Activity, status: 'warning', description: 'Multi-Sensor Event System', route: '/layers/mses' },
    { id: 'shel', label: 'SHEL', icon: Database, status: 'online', description: 'Secure Hyperledger', route: '/layers/shel' },
    { id: 'ilecg', label: 'ILECG', icon: Zap, status: 'online', description: 'Intelligent Log Event Correlation', route: '/layers/ilecg' },
    { id: 'qvdm', label: 'QVDM', icon: Brain, status: 'offline', description: 'Quantum Variant Detection Matrix', route: '/layers/qvdm' },
    { id: 'trdn', label: 'TRDN', icon: Clock, status: 'online', description: 'Time-Reversible Data Network', route: '/layers/trdn' },
    { id: 'adcf', label: 'ADCF', icon: Settings, status: 'online', description: 'Autonomous Defense Control Framework', route: '/layers/adcf' }
  ];

  const managementItems = [
    { id: 'governance', label: 'Governance', icon: Shield, route: '/governance' },
    { id: 'compliance', label: 'Compliance', icon: CheckCircle, route: '/compliance' },
    { id: 'settings', label: 'Settings', icon: Settings, route: '/settings' }
  ];

  const handleLayerClick = (route: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Multiple fallback methods to ensure new tab opening
    const fullUrl = `${window.location.origin}${route}`;
    
    // Method 1: Try window.open first
    try {
      const newWindow = window.open(fullUrl, '_blank', 'noopener,noreferrer,width=1200,height=800');
      if (newWindow) {
        newWindow.focus();
        console.log(`Successfully opened ${fullUrl} in new tab via window.open`);
        return;
      }
    } catch (e) {
      console.warn('window.open failed:', e);
    }
    
    // Method 2: Create anchor with download and immediate click
    const link = document.createElement('a');
    link.href = fullUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    
    // Force user interaction context
    document.body.appendChild(link);
    
    // Trigger with user event context
    const clickEvent = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
      ctrlKey: true  // This simulates Ctrl+Click which forces new tab
    });
    
    link.dispatchEvent(clickEvent);
    document.body.removeChild(link);
    
    console.log(`Fallback: Opened ${fullUrl} using simulated Ctrl+Click`);
  };

  return (
    <div className={`portal-dashboard ${darkMode ? 'dark' : ''}`}>
      {/* Global Header */}
      <header className="portal-header portal-z-50">
        <div className="portal-header-content">
          <div className="portal-header-left">
            <button 
              className="portal-menu-toggle portal-lg:portal-hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              <Menu size={20} />
            </button>
            
            <div className="portal-logo">
              <div className="portal-logo-icon portal-holographic-glow">VII</div>
              <div className="portal-logo-text">
                <span className="portal-brand">Portal</span>
                <span className="portal-version">VII</span>
              </div>
            </div>
            
            {pageTitle && (
              <div className="portal-page-breadcrumb">
                <span className="portal-breadcrumb-separator">/</span>
                <span className="portal-current-page">{pageTitle}</span>
              </div>
            )}
          </div>

          <div className="portal-header-right">
            <button 
              className="portal-theme-toggle portal-ripple"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? '🌙' : '☀️'}
            </button>
            <button 
              className="portal-notifications portal-ripple"
              title="View Notifications"
            >
              <Bell size={18} />
              <span className="portal-notification-badge portal-pulse">12</span>
            </button>
            
            <div className="portal-user-avatar">
              <User size={18} />
              <div className="portal-fido2-status portal-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="portal-fixed portal-inset-0 portal-bg-primary portal-z-40 portal-lg:portal-hidden portal-mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Primary Sidebar */}
      <nav className={`portal-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${sidebarOpen ? 'open' : ''}`}>
        <button 
          className="portal-sidebar-toggle portal-hidden portal-lg:portal-flex"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft size={16} style={{ 
            transform: sidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
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
              {!sidebarCollapsed && (
                <span className="portal-flex-1 portal-text-left">Dashboard</span>
              )}
            </Link>
          </div>
          
          <div className="portal-nav-section">
            <h3 className="portal-nav-title">Dimensions</h3>
            {sevenLayers.map((item) => (
              <div
                key={item.id}
                className={`portal-nav-item ${location.pathname === item.route ? 'active' : ''} portal-holo-border`}
                title={`${item.description} - Click to open in new tab`}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const fullUrl = window.location.origin + item.route;
                  
                  // Always open in new tab for any click
                  const newWindow = window.open(fullUrl, '_blank', 'noopener,noreferrer');
                  if (newWindow) {
                    newWindow.focus();
                  }
                  
                  console.log(`Opening ${item.route} in new tab`);
                }}
              >
                <item.icon size={18} />
                {!sidebarCollapsed && (
                  <>
                    <span className="portal-flex-1 portal-text-left">{item.label}</span>
                    <div className={`portal-status-indicator ${item.status}`}></div>
                  </>
                )}
              </div>
            ))}
          </div>
          
          {!sidebarCollapsed && (
            <div className="portal-nav-section">
              <h3 className="portal-nav-title">Management</h3>
              {managementItems.map(item => (
                <Link 
                  key={item.id}
                  to={item.route}
                  className={`portal-nav-item ${location.pathname === item.route ? 'active' : ''}`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="portal-main-content">
        {children}
      </main>
    </div>
  );
};

export default LayerLayout;
