export interface SecurityMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: number[];
  lastUpdated: Date;
  threshold: {
    warning: number;
    critical: number;
  };
}

export interface ThreatEvent {
  id: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  source: string;
  target: string;
  description: string;
  status: 'active' | 'mitigated' | 'investigating' | 'resolved';
  confidence: number;
  riskScore: number;
  metadata: Record<string, any>;
}

export interface LayerHealth {
  layerId: string;
  status: 'online' | 'degraded' | 'offline' | 'maintenance';
  uptime: number;
  performance: number;
  lastCheck: Date;
  issues: string[];
  dependencies: string[];
}

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
  createdAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'regex';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface RuleAction {
  type: 'block' | 'alert' | 'log' | 'quarantine' | 'notify';
  parameters: Record<string, any>;
}
