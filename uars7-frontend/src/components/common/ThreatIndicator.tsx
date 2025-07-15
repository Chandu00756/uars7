import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Shield, Target } from 'lucide-react';

interface ThreatIndicatorProps {
  level: 'low' | 'medium' | 'high' | 'critical';
  count: number;
  type: string;
  trend?: 'up' | 'down' | 'stable';
  className?: string;
  onClick?: () => void;
}

const ThreatIndicator: React.FC<ThreatIndicatorProps> = ({
  level,
  count,
  type,
  trend = 'stable',
  className = '',
  onClick
}) => {
  const getIcon = () => {
    switch (level) {
      case 'critical': return <AlertTriangle className="threat-icon" />;
      case 'high': return <Shield className="threat-icon" />;
      case 'medium': return <Target className="threat-icon" />;
      default: return <Shield className="threat-icon" />;
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp size={14} className="threat-trend-icon trend-up" />;
      case 'down': return <TrendingDown size={14} className="threat-trend-icon trend-down" />;
      default: return null;
    }
  };

  const getLevelColor = () => {
    switch (level) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      default: return '#65a30d';
    }
  };

  return (
    <div 
      className={`threat-indicator threat-level-${level} ${className} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      style={{ borderLeftColor: getLevelColor() }}
    >
      <div className="threat-indicator-icon">
        {getIcon()}
      </div>
      
      <div className="threat-indicator-content">
        <div className="threat-indicator-header">
          <span className="threat-type">{type}</span>
          {getTrendIcon()}
        </div>
        
        <div className="threat-indicator-count">
          <span className="threat-count">{count}</span>
          <span className="threat-level-text">{level.toUpperCase()}</span>
        </div>
      </div>
      
      <div 
        className="threat-indicator-pulse"
        style={{ backgroundColor: getLevelColor() }}
      />
    </div>
  );
};

export default ThreatIndicator;
