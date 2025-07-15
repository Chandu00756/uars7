import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle, X } from 'lucide-react';

interface SecurityAlertProps {
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp?: Date;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  onDismiss?: () => void;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

const SecurityAlert: React.FC<SecurityAlertProps> = ({
  type,
  title,
  message,
  timestamp,
  severity = 'medium',
  onDismiss,
  actionButton
}) => {
  const getIcon = () => {
    switch (type) {
      case 'error': return <AlertCircle className="security-alert-icon" />;
      case 'warning': return <AlertTriangle className="security-alert-icon" />;
      case 'success': return <CheckCircle className="security-alert-icon" />;
      default: return <Info className="security-alert-icon" />;
    }
  };

  const getSeverityClass = () => {
    return `security-alert-${severity}`;
  };

  return (
    <div className={`security-alert security-alert-${type} ${getSeverityClass()}`}>
      <div className="security-alert-content">
        <div className="security-alert-header">
          {getIcon()}
          <div className="security-alert-title-section">
            <h4 className="security-alert-title">{title}</h4>
            {timestamp && (
              <span className="security-alert-timestamp">
                {timestamp.toLocaleString()}
              </span>
            )}
          </div>
          {onDismiss && (
            <button 
              onClick={onDismiss}
              className="security-alert-dismiss"
              aria-label="Dismiss alert"
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        <div className="security-alert-body">
          <p className="security-alert-message">{message}</p>
          
          {actionButton && (
            <div className="security-alert-actions">
              <button 
                onClick={actionButton.onClick}
                className="security-alert-action-btn"
              >
                {actionButton.label}
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className={`security-alert-severity-indicator severity-${severity}`}>
        <span className="severity-text">{severity.toUpperCase()}</span>
      </div>
    </div>
  );
};

export default SecurityAlert;
