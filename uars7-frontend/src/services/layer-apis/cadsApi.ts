import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

const cadsApiClient = axios.create({
  baseURL: `${API_BASE_URL}/cads`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
cadsApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
cadsApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const cadsApi = {
  // Get CADS overview data
  getOverview: async (timeRange: string = '24h') => {
    const response = await cadsApiClient.get(`/overview?timeRange=${timeRange}`);
    return response.data;
  },

  // Get threat details
  getThreats: async (filters?: {
    severity?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    
    const response = await cadsApiClient.get(`/threats?${params.toString()}`);
    return response.data;
  },

  // Handle threat action
  handleThreat: async (threatId: string, action: 'block' | 'investigate' | 'dismiss') => {
    const response = await cadsApiClient.post(`/threats/${threatId}/action`, { action });
    return response.data;
  },

  // Get defense rules
  getDefenseRules: async () => {
    const response = await cadsApiClient.get('/rules');
    return response.data;
  },

  // Update defense rule
  updateRule: async (ruleId: string, updates: { enabled?: boolean; priority?: number }) => {
    const response = await cadsApiClient.patch(`/rules/${ruleId}`, updates);
    return response.data;
  },

  // Create new defense rule
  createRule: async (rule: {
    name: string;
    description: string;
    conditions: any[];
    actions: any[];
    priority: number;
  }) => {
    const response = await cadsApiClient.post('/rules', rule);
    return response.data;
  },

  // Delete defense rule
  deleteRule: async (ruleId: string) => {
    const response = await cadsApiClient.delete(`/rules/${ruleId}`);
    return response.data;
  },

  // Get threat intelligence
  getThreatIntelligence: async () => {
    const response = await cadsApiClient.get('/intelligence');
    return response.data;
  },

  // Export threat data
  exportThreats: async (timeRange: string = '24h', format: string = 'json') => {
    const response = await cadsApiClient.get(`/export/threats`, {
      params: { timeRange, format },
      responseType: 'blob'
    });
    return response.data;
  },

  // Get attack vectors
  getAttackVectors: async () => {
    const response = await cadsApiClient.get('/attack-vectors');
    return response.data;
  },

  // Get system metrics
  getMetrics: async (timeRange: string = '1h') => {
    const response = await cadsApiClient.get(`/metrics?timeRange=${timeRange}`);
    return response.data;
  },

  // Update system configuration
  updateConfig: async (config: Record<string, any>) => {
    const response = await cadsApiClient.put('/config', config);
    return response.data;
  },

  // Get system status
  getStatus: async () => {
    const response = await cadsApiClient.get('/status');
    return response.data;
  },

  // Trigger manual scan
  triggerScan: async (scanType: 'quick' | 'full' | 'targeted', targets?: string[]) => {
    const response = await cadsApiClient.post('/scan', { scanType, targets });
    return response.data;
  },

  // Get scan results
  getScanResults: async (scanId: string) => {
    const response = await cadsApiClient.get(`/scan/${scanId}/results`);
    return response.data;
  }
};

// MSES API
export const msesApi = {
  // Get MSES overview data
  getOverview: async () => {
    const response = await cadsApiClient.get('/mses/overview');
    return response.data;
  },

  // Get sensor data
  getSensors: async () => {
    const response = await cadsApiClient.get('/mses/sensors');
    return response.data;
  },

  // Update sensor configuration
  updateSensor: async (sensorId: string, config: { enabled?: boolean; threshold?: any }) => {
    const response = await cadsApiClient.patch(`/mses/sensors/${sensorId}`, config);
    return response.data;
  },

  // Get event stream
  getEvents: async (filters?: {
    category?: string;
    severity?: string;
    limit?: number;
    since?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.since) params.append('since', filters.since);
    
    const response = await cadsApiClient.get(`/mses/events?${params.toString()}`);
    return response.data;
  },

  // Create correlation rule
  createCorrelationRule: async (rule: any) => {
    const response = await cadsApiClient.post('/mses/correlation-rules', rule);
    return response.data;
  },

  // Get correlation rules
  getCorrelationRules: async () => {
    const response = await cadsApiClient.get('/mses/correlation-rules');
    return response.data;
  }
};
