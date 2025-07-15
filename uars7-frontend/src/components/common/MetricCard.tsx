import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  icon?: React.ComponentType<any>;
  className?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  trendValue,
  icon: Icon,
  className = '',
  color = 'primary',
  subtitle
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp size={16} className="text-green-500" />;
      case 'down': return <TrendingDown size={16} className="text-red-500" />;
      default: return <Minus size={16} className="text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-500';
      case 'down': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className={`metric-card metric-card-${color} ${className}`}>
      <div className="metric-card-header">
        {Icon && (
          <div className="metric-card-icon">
            <Icon size={20} />
          </div>
        )}
        <h3 className="metric-card-title">{title}</h3>
      </div>
      
      <div className="metric-card-body">
        <div className="metric-card-value">{value}</div>
        
        {subtitle && (
          <div className="metric-card-subtitle">{subtitle}</div>
        )}
        
        {trend && trendValue && (
          <div className="metric-card-trend">
            {getTrendIcon()}
            <span className={getTrendColor()}>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
