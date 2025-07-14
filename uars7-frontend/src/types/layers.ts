// Base Types and Common Interfaces
export interface ThreatEvent {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  source: string;
  description: string;
  status: 'active' | 'resolved' | 'investigating';
}

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  priority: number;
  conditions: string[];
  actions: string[];
}

export interface ThreatIntelligence {
  id: string;
  source: string;
  type: 'strategic' | 'tactical' | 'operational' | 'technical';
  confidence: number;
  data: any;
  lastUpdated: number;
}

export interface AttackVector {
  id: string;
  name: string;
  type: string;
  description: string;
  severity: number;
  mitigationRequired: boolean;
}

export interface MitigationStrategy {
  id: string;
  name: string;
  description: string;
  applicableThreats: string[];
  effectiveness: number;
  cost: number;
  timeToImplement: number;
}

export interface CorrelationRule {
  id: string;
  name: string;
  description: string;
  conditions: string[];
  timeWindow: number;
  threshold: number;
  enabled: boolean;
}

export interface SecurityEvent {
  id: string;
  timestamp: number;
  type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  source: string;
  message: string;
  metadata: Record<string, any>;
}

export interface Alert {
  id: string;
  name: string;
  description: string;
  severity: 'info' | 'minor' | 'major' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  timestamp: number;
  source: string;
}

export interface SensorStatus {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'warning' | 'error';
  lastHeartbeat: number;
  location: string;
  metrics: Record<string, number>;
}

export interface EventMetrics {
  totalEvents: number;
  eventsPerSecond: number;
  averageProcessingTime: number;
  errorRate: number;
  lastUpdated: number;
}

export interface BlockchainHealth {
  status: 'healthy' | 'degraded' | 'critical';
  blockHeight: number;
  networkHashRate: number;
  averageBlockTime: number;
  pendingTransactions: number;
  lastBlockTimestamp: number;
}

export interface Transaction {
  id: string;
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  gasUsed: number;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface SmartContract {
  address: string;
  name: string;
  version: string;
  abi: any[];
  bytecode: string;
  deployedAt: number;
  verified: boolean;
}

export interface ConsensusMetrics {
  consensusAlgorithm: string;
  participationRate: number;
  finalityTime: number;
  validatorCount: number;
  slashingEvents: number;
}

export interface NodeStatus {
  id: string;
  address: string;
  status: 'active' | 'inactive' | 'syncing' | 'error';
  blockHeight: number;
  peerCount: number;
  lastSeen: number;
  version: string;
}

export interface IntegrityCheck {
  id: string;
  type: string;
  status: 'passed' | 'failed' | 'pending';
  timestamp: number;
  checksum: string;
  details: string;
}

export interface LogSource {
  id: string;
  name: string;
  type: string;
  location: string;
  status: 'active' | 'inactive' | 'error';
  lastEvent: number;
  eventCount: number;
}

export interface CorrelationMatrix {
  sources: string[];
  correlations: number[][];
  confidence: number;
  lastUpdated: number;
}

export interface EventPattern {
  id: string;
  name: string;
  pattern: string;
  frequency: number;
  confidence: number;
  lastSeen: number;
}

export interface IntelligenceFeed {
  id: string;
  name: string;
  source: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  lastUpdate: number;
  recordCount: number;
}

export interface CorrelationResult {
  id: string;
  ruleId: string;
  events: string[];
  confidence: number;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AnomalyDetection {
  id: string;
  type: string;
  confidence: number;
  baseline: number;
  currentValue: number;
  deviation: number;
  timestamp: number;
}

export interface QuantumThreat {
  id: string;
  type: string;
  severity: number;
  probability: number;
  description: string;
  affectedSystems: string[];
  mitigationStatus: string;
}

export interface VariantAnalysis {
  id: string;
  originalThreat: string;
  variants: string[];
  similarity: number;
  riskScore: number;
  analysisDate: number;
}

export interface DetectionMatrix {
  algorithms: string[];
  accuracy: number[];
  falsePositiveRate: number;
  falseNegativeRate: number;
  lastCalibration: number;
}

export interface QuantumMetrics {
  quantumSupremacyThreat: number;
  cryptographicVulnerability: number;
  quantumReadinessScore: number;
  lastAssessment: number;
}

export interface CryptographicHealth {
  algorithms: Record<string, number>;
  keyStrength: number;
  quantumResistance: number;
  lastAudit: number;
  recommendations: string[];
}

export interface QuantumReadiness {
  score: number;
  preparationLevel: 'none' | 'basic' | 'intermediate' | 'advanced' | 'quantum-safe';
  migrationsRequired: string[];
  timeline: number;
}

export interface DataSnapshot {
  id: string;
  timestamp: number;
  size: number;
  checksum: string;
  location: string;
  metadata: Record<string, any>;
}

export interface RollbackCapability {
  available: boolean;
  maxRollbackTime: number;
  snapshotCount: number;
  lastRollback: number;
  integrityVerified: boolean;
}

export interface TimelineIntegrity {
  status: 'intact' | 'compromised' | 'unknown';
  lastVerification: number;
  inconsistencies: number;
  verificationMethod: string;
}

export interface ReversalOperation {
  id: string;
  type: string;
  targetTimestamp: number;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  affectedSystems: string[];
  initiatedBy: string;
}

export interface ConsistencyCheck {
  id: string;
  type: string;
  status: 'passed' | 'failed' | 'pending';
  timestamp: number;
  details: string;
  affectedData: string[];
}

export interface TemporalMetrics {
  timeAccuracy: number;
  synchronizationDrift: number;
  lastSyncTime: number;
  clockSources: string[];
  reliability: number;
}

export interface AutonomousAction {
  id: string;
  type: string;
  trigger: string;
  action: string;
  timestamp: number;
  success: boolean;
  impact: string;
}

export interface ControlPolicy {
  id: string;
  name: string;
  description: string;
  rules: string[];
  enabled: boolean;
  priority: number;
  lastModified: number;
}

export interface SystemAdaptation {
  id: string;
  type: string;
  trigger: string;
  adaptation: string;
  effectiveness: number;
  timestamp: number;
}

export interface LearningMetrics {
  modelAccuracy: number;
  trainingDataSize: number;
  lastTraining: number;
  predictionConfidence: number;
  adaptationRate: number;
}

export interface DecisionTree {
  id: string;
  name: string;
  nodes: any[];
  accuracy: number;
  lastUpdated: number;
  version: string;
}

export interface FrameworkHealth {
  status: 'healthy' | 'degraded' | 'critical';
  componentStatus: Record<string, string>;
  performanceMetrics: Record<string, number>;
  lastHealthCheck: number;
}

// Main Layer Data Interfaces
export interface CADSData {
  attacksBlocked: number;
  activeThreats: ThreatEvent[];
  defenseRules: SecurityRule[];
  threatIntelligence: ThreatIntelligence[];
  attackVectors: AttackVector[];
  mitigationStrategies: MitigationStrategy[];
}

export interface MSESData {
  eventSources: EventSource[];
  correlationRules: CorrelationRule[];
  eventStream: SecurityEvent[];
  alertQueue: Alert[];
  sensorHealth: SensorStatus[];
  eventMetrics: EventMetrics;
}

export interface SHELData {
  blockchainHealth: BlockchainHealth;
  transactions: Transaction[];
  smartContracts: SmartContract[];
  consensusMetrics: ConsensusMetrics;
  nodeStatus: NodeStatus[];
  ledgerIntegrity: IntegrityCheck[];
}

export interface ILECGData {
  logSources: LogSource[];
  correlationMatrix: CorrelationMatrix;
  eventPatterns: EventPattern[];
  intelligenceFeeds: IntelligenceFeed[];
  correlationResults: CorrelationResult[];
  anomalyDetection: AnomalyDetection;
}

export interface QVDMData {
  quantumThreats: QuantumThreat[];
  variantAnalysis: VariantAnalysis[];
  detectionMatrix: DetectionMatrix;
  quantumMetrics: QuantumMetrics;
  cryptographicHealth: CryptographicHealth;
  quantumReadiness: QuantumReadiness;
}

export interface TRDNData {
  snapshots: DataSnapshot[];
  rollbackCapability: RollbackCapability;
  timelineIntegrity: TimelineIntegrity;
  reversalOperations: ReversalOperation[];
  dataConsistency: ConsistencyCheck[];
  temporalMetrics: TemporalMetrics;
}

export interface ADCFData {
  autonomousActions: AutonomousAction[];
  controlPolicies: ControlPolicy[];
  systemAdaptations: SystemAdaptation[];
  learningMetrics: LearningMetrics;
  decisionTree: DecisionTree;
  frameworkHealth: FrameworkHealth;
}
