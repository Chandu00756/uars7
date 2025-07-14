import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

export interface QVDMOverviewResponse {
  data: {
    quantumThreats: QuantumThreat[];
    variantAnalysis: VariantAnalysis[];
    detectionMatrix: DetectionMatrix;
    quantumMetrics: QuantumMetrics;
    cryptographicHealth: CryptographicHealth;
    quantumReadiness: QuantumReadiness;
  };
}

export interface QuantumThreat {
  id: string;
  type: 'quantum_interference' | 'entanglement_attack' | 'superposition_breach' | 'decoherence_exploit';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  timestamp: Date;
  source: string;
  target: string;
  description: string;
  quantumSignature: string;
  mitigation: string[];
  status: 'active' | 'mitigated' | 'investigating' | 'resolved';
  affectedQubits: number[];
  coherenceImpact: number;
  entanglementBreakage: number;
}

export interface VariantAnalysis {
  id: string;
  name: string;
  family: string;
  mutations: number;
  riskScore: number;
  prevalence: number;
  firstDetected: Date;
  lastSeen: Date;
  geographicSpread: string[];
  characteristics: {
    transmissibility: number;
    virulence: number;
    immuneEvasion: number;
    diagnosticEvasion: number;
  };
  genomicSequence: string;
  proteinChanges: string[];
  functionalImpact: string;
  classification: 'variant_of_interest' | 'variant_of_concern' | 'variant_under_monitoring';
}

export interface DetectionMatrix {
  sensitivity: number;
  specificity: number;
  accuracy: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  detectionThreshold: number;
  calibrationStatus: 'calibrated' | 'needs_calibration' | 'calibrating';
  lastCalibration: Date;
  sensorArray: QuantumSensor[];
}

export interface QuantumSensor {
  id: string;
  type: 'coherence' | 'entanglement' | 'superposition' | 'decoherence';
  status: 'online' | 'offline' | 'maintenance' | 'error';
  sensitivity: number;
  noiseLevel: number;
  temperature: number;
  magneticField: number;
  location: {
    x: number;
    y: number;
    z: number;
  };
  lastMaintenance: Date;
  operationalHours: number;
}

export interface QuantumMetrics {
  coherenceTime: number;
  entanglementFidelity: number;
  gateErrorRate: number;
  readoutFidelity: number;
  quantumVolume: number;
  crossTalk: number;
  thermalNoise: number;
  quantumEfficiency: number;
  state: {
    coherence: number;
    entanglement: number;
    superposition: number;
    decoherence: number;
    fidelity: number;
  };
  trends: {
    coherence: number[];
    entanglement: number[];
    superposition: number[];
    decoherence: number[];
    fidelity: number[];
  };
}

export interface CryptographicHealth {
  algorithms: CryptographicAlgorithm[];
  keyStrength: KeyStrengthAnalysis;
  quantumResistance: QuantumResistanceScore;
  vulnerabilities: CryptographicVulnerability[];
  recommendations: string[];
}

export interface CryptographicAlgorithm {
  name: string;
  type: 'symmetric' | 'asymmetric' | 'hash' | 'signature';
  keySize: number;
  quantumVulnerable: boolean;
  estimatedBreakTime: string;
  quantumResistanceScore: number;
  usage: number;
  recommendation: 'continue' | 'migrate' | 'deprecate' | 'urgent_replace';
}

export interface KeyStrengthAnalysis {
  averageKeySize: number;
  weakKeys: number;
  strongKeys: number;
  quantumResistantKeys: number;
  keyRotationFrequency: number;
  keyManagementScore: number;
}

export interface QuantumResistanceScore {
  overall: number;
  encryption: number;
  signatures: number;
  keyExchange: number;
  hashing: number;
  readinessLevel: 'not_ready' | 'partially_ready' | 'mostly_ready' | 'quantum_ready';
}

export interface CryptographicVulnerability {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  algorithm: string;
  description: string;
  impact: string;
  mitigation: string[];
  estimatedExploitTime: string;
}

export interface QuantumReadiness {
  overallScore: number;
  infrastructure: number;
  algorithms: number;
  keyManagement: number;
  protocols: number;
  training: number;
  compliance: number;
  timeline: {
    currentPhase: string;
    nextMilestone: string;
    estimatedCompletion: Date;
    criticalPath: string[];
  };
  gaps: string[];
  recommendations: string[];
}

export interface QuantumCalibrationRequest {
  sensorIds?: string[];
  calibrationType: 'full' | 'partial' | 'emergency';
  parameters?: {
    sensitivity?: number;
    threshold?: number;
    noiseReduction?: boolean;
  };
}

export interface ThreatMitigationRequest {
  action: 'isolate' | 'neutralize' | 'analyze';
  priority: 'low' | 'medium' | 'high' | 'critical';
  parameters?: {
    isolationLevel?: number;
    analysisDepth?: 'surface' | 'deep' | 'quantum';
    neutralizationMethod?: 'quantum_interference' | 'entanglement_break' | 'decoherence_induction';
  };
}

export interface VariantClassificationRequest {
  classification: 'variant_of_interest' | 'variant_of_concern' | 'variant_under_monitoring';
  confidence: number;
  evidence: string[];
  riskAssessment: {
    transmissibility: number;
    virulence: number;
    immuneEvasion: number;
    diagnosticEvasion: number;
  };
}

class QVDMApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/qvdm`;
  }

  // Overview and Dashboard Data
  async getOverview(timeRange: string = '24h'): Promise<AxiosResponse<QVDMOverviewResponse['data']>> {
    return axios.get(`${this.baseURL}/overview`, {
      params: { timeRange }
    });
  }

  async getQuantumMetrics(timeRange: string = '1h'): Promise<AxiosResponse<QuantumMetrics>> {
    return axios.get(`${this.baseURL}/metrics`, {
      params: { timeRange }
    });
  }

  async getDetectionMatrix(): Promise<AxiosResponse<DetectionMatrix>> {
    return axios.get(`${this.baseURL}/detection-matrix`);
  }

  // Quantum Threat Management
  async getQuantumThreats(filters?: {
    severity?: string;
    type?: string;
    status?: string;
    timeRange?: string;
  }): Promise<AxiosResponse<QuantumThreat[]>> {
    return axios.get(`${this.baseURL}/threats`, {
      params: filters
    });
  }

  async getThreatDetails(threatId: string): Promise<AxiosResponse<QuantumThreat>> {
    return axios.get(`${this.baseURL}/threats/${threatId}`);
  }

  async mitigateThreat(
    threatId: string, 
    action: 'isolate' | 'neutralize' | 'analyze',
    request?: ThreatMitigationRequest
  ): Promise<AxiosResponse<{ success: boolean; message: string }>> {
    return axios.post(`${this.baseURL}/threats/${threatId}/mitigate`, {
      action,
      ...request
    });
  }

  async updateThreatStatus(
    threatId: string, 
    status: 'active' | 'mitigated' | 'investigating' | 'resolved'
  ): Promise<AxiosResponse<{ success: boolean }>> {
    return axios.patch(`${this.baseURL}/threats/${threatId}/status`, {
      status
    });
  }

  // Variant Analysis
  async getVariantAnalysis(filters?: {
    family?: string;
    riskLevel?: string;
    timeRange?: string;
  }): Promise<AxiosResponse<VariantAnalysis[]>> {
    return axios.get(`${this.baseURL}/variants`, {
      params: filters
    });
  }

  async getVariantDetails(variantId: string): Promise<AxiosResponse<VariantAnalysis>> {
    return axios.get(`${this.baseURL}/variants/${variantId}`);
  }

  async classifyVariant(
    variantId: string, 
    classification: string,
    request?: VariantClassificationRequest
  ): Promise<AxiosResponse<{ success: boolean; message: string }>> {
    return axios.post(`${this.baseURL}/variants/${variantId}/classify`, {
      classification,
      ...request
    });
  }

  async analyzeVariantGenome(
    variantId: string,
    genomicData: string
  ): Promise<AxiosResponse<{
    mutations: string[];
    proteinChanges: string[];
    functionalImpact: string;
    riskAssessment: any;
  }>> {
    return axios.post(`${this.baseURL}/variants/${variantId}/analyze-genome`, {
      genomicData
    });
  }

  // Quantum Sensor Management
  async getQuantumSensors(): Promise<AxiosResponse<QuantumSensor[]>> {
    return axios.get(`${this.baseURL}/sensors`);
  }

  async getSensorDetails(sensorId: string): Promise<AxiosResponse<QuantumSensor>> {
    return axios.get(`${this.baseURL}/sensors/${sensorId}`);
  }

  async calibrateQuantumSensors(request?: QuantumCalibrationRequest): Promise<AxiosResponse<{
    success: boolean;
    calibrationId: string;
    estimatedDuration: number;
  }>> {
    return axios.post(`${this.baseURL}/sensors/calibrate`, request || {
      calibrationType: 'full'
    });
  }

  async updateSensorConfiguration(
    sensorId: string,
    config: Partial<QuantumSensor>
  ): Promise<AxiosResponse<{ success: boolean }>> {
    return axios.patch(`${this.baseURL}/sensors/${sensorId}/config`, config);
  }

  async runSensorDiagnostics(sensorId: string): Promise<AxiosResponse<{
    status: string;
    issues: string[];
    recommendations: string[];
    performanceMetrics: any;
  }>> {
    return axios.post(`${this.baseURL}/sensors/${sensorId}/diagnostics`);
  }

  // Cryptographic Analysis
  async getCryptographicHealth(): Promise<AxiosResponse<CryptographicHealth>> {
    return axios.get(`${this.baseURL}/cryptography/health`);
  }

  async analyzeAlgorithmSecurity(algorithm: string): Promise<AxiosResponse<{
    quantumVulnerability: number;
    recommendedKeySize: number;
    migrationPriority: string;
    alternatives: string[];
  }>> {
    return axios.post(`${this.baseURL}/cryptography/analyze`, {
      algorithm
    });
  }

  async getQuantumReadiness(): Promise<AxiosResponse<QuantumReadiness>> {
    return axios.get(`${this.baseURL}/quantum-readiness`);
  }

  async updateQuantumReadinessAssessment(assessment: Partial<QuantumReadiness>): Promise<AxiosResponse<{
    success: boolean;
    updatedScore: number;
  }>> {
    return axios.post(`${this.baseURL}/quantum-readiness/update`, assessment);
  }

  // Data Export and Import
  async exportQuantumData(timeRange: string = '24h', format: 'json' | 'csv' | 'xml' = 'json'): Promise<Blob> {
    const response = await axios.get(`${this.baseURL}/export`, {
      params: { timeRange, format },
      responseType: 'blob'
    });
    return response.data;
  }

  async importThreatIntelligence(file: File): Promise<AxiosResponse<{
    success: boolean;
    imported: number;
    errors: string[];
  }>> {
    const formData = new FormData();
    formData.append('file', file);
    
    return axios.post(`${this.baseURL}/import/threat-intelligence`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  async importVariantData(file: File): Promise<AxiosResponse<{
    success: boolean;
    imported: number;
    errors: string[];
  }>> {
    const formData = new FormData();
    formData.append('file', file);
    
    return axios.post(`${this.baseURL}/import/variants`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  // Real-time Monitoring
  async getRealtimeMetrics(): Promise<AxiosResponse<{
    quantumState: QuantumMetrics['state'];
    threats: number;
    variants: number;
    sensorStatus: { online: number; offline: number; maintenance: number };
  }>> {
    return axios.get(`${this.baseURL}/realtime/metrics`);
  }

  async subscribeToAlerts(callback: (alert: any) => void): Promise<() => void> {
    // WebSocket subscription for real-time alerts
    const ws = new WebSocket(`${this.baseURL.replace('http', 'ws')}/alerts`);
    
    ws.onmessage = (event) => {
      const alert = JSON.parse(event.data);
      callback(alert);
    };
    
    return () => ws.close();
  }

  // System Configuration
  async getSystemConfiguration(): Promise<AxiosResponse<{
    detectionSensitivity: number;
    autoCalibration: boolean;
    alertThresholds: any;
    quantumParameters: any;
  }>> {
    return axios.get(`${this.baseURL}/config`);
  }

  async updateSystemConfiguration(config: {
    detectionSensitivity?: number;
    autoCalibration?: boolean;
    alertThresholds?: any;
    quantumParameters?: any;
  }): Promise<AxiosResponse<{ success: boolean }>> {
    return axios.patch(`${this.baseURL}/config`, config);
  }

  // Analytics and Reporting
  async getAnalytics(timeRange: string = '7d'): Promise<AxiosResponse<{
    threatTrends: any[];
    variantEvolution: any[];
    quantumPerformance: any[];
    detectionAccuracy: any[];
  }>> {
    return axios.get(`${this.baseURL}/analytics`, {
      params: { timeRange }
    });
  }

  async generateReport(type: 'threats' | 'variants' | 'quantum' | 'comprehensive', timeRange: string = '30d'): Promise<AxiosResponse<{
    reportId: string;
    downloadUrl: string;
    generatedAt: Date;
  }>> {
    return axios.post(`${this.baseURL}/reports/generate`, {
      type,
      timeRange
    });
  }

  async getReportStatus(reportId: string): Promise<AxiosResponse<{
    status: 'generating' | 'completed' | 'failed';
    progress: number;
    downloadUrl?: string;
    error?: string;
  }>> {
    return axios.get(`${this.baseURL}/reports/${reportId}/status`);
  }
}

export const qvdmApi = new QVDMApiService();
export default qvdmApi;
