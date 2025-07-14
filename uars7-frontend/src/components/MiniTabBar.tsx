import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  Database,
  Brain,
} from 'lucide-react';

interface MiniTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  showLabels?: boolean;
  compact?: boolean;
  disabled?: boolean;
}

const TAB_DEFINITIONS = [
  { id: 'overview', icon: Activity, label: 'Overview', key: '1', color: 'blue' },
  { id: 'incidents', icon: AlertTriangle, label: 'Incidents', key: '2', color: 'red' },
  { id: 'performance', icon: TrendingUp, label: 'Performance', key: '3', color: 'green' },
  { id: 'ledger', icon: Database, label: 'Ledger', key: '4', color: 'purple' },
  { id: 'ai-assist', icon: Brain, label: 'AI Assist', key: '5', color: 'orange' },
];

export const MiniTabBar: React.FC<MiniTabBarProps> = ({
  activeTab,
  onTabChange,
  showLabels = true,
  compact = false,
  disabled = false,
}) => {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  /* ---- Enhanced keyboard shortcuts with modifier support ---- */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (disabled) return;
      
      // Support both direct number keys and Ctrl+number for better UX
      const isDirectKey = TAB_DEFINITIONS.find((t) => t.key === e.key);
      const isCtrlKey = e.ctrlKey && TAB_DEFINITIONS.find((t) => t.key === e.key);
      
      const hit = isDirectKey || isCtrlKey;
      if (hit) {
        e.preventDefault();
        onTabChange(hit.id);
      }
    };
    
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onTabChange, disabled]);

  const getTabClasses = (id: string, color: string) => {
    const baseClasses = `
      portal-tab portal-ripple portal-relative portal-transition-all portal-duration-200
      portal-flex portal-items-center portal-justify-center portal-gap-2
      portal-px-3 portal-py-2 portal-rounded-lg portal-border
      portal-bg-white portal-border-gray-200 portal-text-gray-600
      hover:portal-border-gray-300 hover:portal-bg-gray-50
      focus:portal-outline-none focus:portal-ring-2 focus:portal-ring-blue-500 focus:portal-ring-offset-1
      disabled:portal-opacity-50 disabled:portal-cursor-not-allowed
      ${compact ? 'portal-px-2 portal-py-1' : ''}
    `;
    
    const activeClasses = `
      portal-bg-${color}-50 portal-border-${color}-200 portal-text-${color}-700
      hover:portal-bg-${color}-100 hover:portal-border-${color}-300
    `;
    
    return `${baseClasses} ${activeTab === id ? activeClasses : ''}`.trim();
  };

  return (
    <nav 
      className={`
        portal-mini-tabs portal-flex portal-gap-2 portal-p-4 
        portal-bg-surface portal-border-b portal-border-gray-200
        ${compact ? 'portal-p-2' : ''}
      `}
      role="tablist"
      aria-label="Navigation tabs"
    >
      {TAB_DEFINITIONS.map(({ id, icon: Icon, label, key, color }) => (
        <button
          key={id}
          className={getTabClasses(id, color)}
          onClick={() => !disabled && onTabChange(id)}
          onMouseEnter={() => setHoveredTab(id)}
          onMouseLeave={() => setHoveredTab(null)}
          title={`${label} (Press ${key})`}
          disabled={disabled}
          role="tab"
          aria-selected={activeTab === id}
          aria-controls={`panel-${id}`}
        >
          <Icon 
            size={compact ? 14 : 16} 
            className={`
              portal-transition-transform portal-duration-200
              ${hoveredTab === id ? 'portal-scale-110' : ''}
              ${activeTab === id ? `portal-text-${color}-600` : ''}
            `}
          />
          
          {showLabels && (
            <span 
              className={`
                portal-text-sm portal-font-medium portal-transition-all
                ${compact ? 'portal-hidden md:portal-inline' : 'portal-inline'}
                ${activeTab === id ? 'portal-font-semibold' : ''}
              `}
            >
              {label}
            </span>
          )}
          
          <kbd 
            className={`
              portal-tab-shortcut portal-text-xs portal-px-1 portal-py-0.5 
              portal-bg-gray-100 portal-border portal-border-gray-300 portal-rounded
              portal-font-mono portal-transition-all
              ${activeTab === id ? `portal-bg-${color}-100 portal-border-${color}-300` : ''}
              ${compact ? 'portal-hidden lg:portal-inline-block' : ''}
            `}
          >
            {key}
          </kbd>
          
          {/* Active indicator */}
          {activeTab === id && (
            <div 
              className={`
                portal-absolute portal-bottom-0 portal-left-0 portal-right-0 
                portal-h-0.5 portal-bg-${color}-500 portal-rounded-full
              `}
            />
          )}
        </button>
      ))}
      
      {/* Keyboard shortcut hint */}
      <div className="portal-ml-auto portal-flex portal-items-center portal-text-xs portal-text-gray-400">
        <span className="portal-hidden lg:portal-inline">
          Press 1-5 or Ctrl+1-5 for quick navigation
        </span>
      </div>
    </nav>
  );
};
