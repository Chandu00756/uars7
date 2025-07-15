import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Edit3,
  Play,
  Save,
  Upload,
  Download,
  Copy,
  Eye,
  GitBranch,
  CheckCircle,
  AlertTriangle,
  Clock,
  Settings,
  Code,
  TestTube,
  FileText,
  RefreshCw
} from 'lucide-react';

interface PolicyBundle {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  rules: PolicyRule[];
  lastModified: Date;
  author: string;
  rolloutPercentage: number;
  status: 'active' | 'draft' | 'deprecated' | 'testing';
}

interface PolicyRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  priority: number;
  enabled: boolean;
}

interface TestResult {
  rule: string;
  scenario: string;
  expected: string;
  actual: string;
  status: 'pass' | 'fail' | 'pending';
}

const Policies: React.FC = () => {
  const [bundles, setBundles] = useState<PolicyBundle[]>([]);
  const [selectedBundle, setSelectedBundle] = useState<PolicyBundle | null>(null);
  const [activeTab, setActiveTab] = useState<'bundles' | 'editor' | 'simulator' | 'rollout'>('bundles');
  const [editorContent, setEditorContent] = useState('');
  const [simulatorInput, setSimulatorInput] = useState('');
  const [simulatorResult, setSimulatorResult] = useState<any>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Sample Rego policy template
  const defaultPolicy = `package cads.security

import future.keywords.if
import future.keywords.in

# Default deny
default allow := false

# Allow if request meets security criteria
allow if {
    input.method == "POST"
    input.path == "/microcell/spawn"
    valid_intent_token
    risk_score_acceptable
}

# Validate intent token
valid_intent_token if {
    input.headers.authorization
    token := trim_prefix(input.headers.authorization, "Bearer ")
    io.jwt.verify_hs256(token, "secret-key")
    payload := io.jwt.decode(token)[1]
    payload.exp > time.now_ns() / 1000000000
}

# Check risk score
risk_score_acceptable if {
    input.risk_score < 70
}

# Log suspicious activity
log_suspicious if {
    input.risk_score > 80
}

# Quarantine high-risk requests
quarantine if {
    input.risk_score > 90
    input.source_ip != "127.0.0.1"
}`;

  useEffect(() => {
    const loadPolicies = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockBundles: PolicyBundle[] = [
          {
            id: 'cads-core-v1',
            name: 'CADS Core Security',
            version: '1.2.3',
            description: 'Core security policies for CADS micro-cell validation',
            enabled: true,
            rules: [
              { id: 'r1', name: 'Intent Token Validation', condition: 'valid_intent_token', action: 'allow', priority: 1, enabled: true },
              { id: 'r2', name: 'Risk Score Check', condition: 'risk_score < 70', action: 'allow', priority: 2, enabled: true },
              { id: 'r3', name: 'Source IP Validation', condition: 'valid_source_ip', action: 'allow', priority: 3, enabled: true }
            ],
            lastModified: new Date(Date.now() - 3600000),
            author: 'security-team',
            rolloutPercentage: 100,
            status: 'active'
          },
          {
            id: 'threat-detection-v2',
            name: 'Advanced Threat Detection',
            version: '2.1.0',
            description: 'Machine learning enhanced threat detection policies',
            enabled: true,
            rules: [
              { id: 'r4', name: 'ML Anomaly Detection', condition: 'ml_anomaly_score < 0.8', action: 'allow', priority: 1, enabled: true },
              { id: 'r5', name: 'Behavioral Analysis', condition: 'behavioral_analysis_passed', action: 'allow', priority: 2, enabled: true }
            ],
            lastModified: new Date(Date.now() - 7200000),
            author: 'ml-team',
            rolloutPercentage: 75,
            status: 'active'
          },
          {
            id: 'experimental-v3',
            name: 'Experimental Policies',
            version: '3.0.0-beta',
            description: 'Experimental policies for advanced threat mitigation',
            enabled: false,
            rules: [
              { id: 'r6', name: 'Quantum Entropy Check', condition: 'quantum_entropy_valid', action: 'allow', priority: 1, enabled: false }
            ],
            lastModified: new Date(Date.now() - 1800000),
            author: 'research-team',
            rolloutPercentage: 10,
            status: 'testing'
          }
        ];

        setBundles(mockBundles);
        setSelectedBundle(mockBundles[0]);
        setEditorContent(defaultPolicy);
      } catch (error) {
        console.error('Failed to load policies:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPolicies();
  }, []);

  const handleBundleSelect = (bundle: PolicyBundle) => {
    setSelectedBundle(bundle);
    // Load the actual policy content for editing
    setEditorContent(defaultPolicy);
  };

  const handleSavePolicy = async () => {
    if (!selectedBundle) return;

    try {
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setBundles(prev => prev.map(bundle => 
        bundle.id === selectedBundle.id 
          ? { ...bundle, lastModified: new Date(), version: incrementVersion(bundle.version) }
          : bundle
      ));

      alert('Policy saved successfully!');
    } catch (error) {
      console.error('Failed to save policy:', error);
      alert('Failed to save policy');
    }
  };

  const incrementVersion = (version: string): string => {
    const parts = version.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  };

  const runSimulator = async () => {
    if (!simulatorInput.trim()) return;

    try {
      setSimulatorResult({ loading: true });
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock simulation result
      const mockResult = {
        decision: Math.random() > 0.5 ? 'allow' : 'deny',
        reason: 'Intent token validation passed, risk score acceptable',
        executionTime: Math.round(Math.random() * 50) + 10,
        rulesEvaluated: [
          { rule: 'Intent Token Validation', result: 'pass', duration: 5 },
          { rule: 'Risk Score Check', result: 'pass', duration: 3 },
          { rule: 'Source IP Validation', result: 'pass', duration: 2 }
        ],
        metadata: {
          riskScore: Math.round(Math.random() * 100),
          sourceIP: '192.168.1.100',
          timestamp: new Date().toISOString()
        }
      };

      setSimulatorResult(mockResult);
    } catch (error) {
      setSimulatorResult({ error: 'Simulation failed' });
    }
  };

  const runTests = async () => {
    const mockTests: TestResult[] = [
      { rule: 'Intent Token Validation', scenario: 'Valid JWT token', expected: 'allow', actual: 'allow', status: 'pass' },
      { rule: 'Intent Token Validation', scenario: 'Expired token', expected: 'deny', actual: 'deny', status: 'pass' },
      { rule: 'Risk Score Check', scenario: 'Low risk (score: 25)', expected: 'allow', actual: 'allow', status: 'pass' },
      { rule: 'Risk Score Check', scenario: 'High risk (score: 85)', expected: 'deny', actual: 'deny', status: 'pass' },
      { rule: 'Source IP Validation', scenario: 'Whitelist IP', expected: 'allow', actual: 'allow', status: 'pass' }
    ];

    setTestResults([]);
    
    for (const test of mockTests) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setTestResults(prev => [...prev, test]);
    }
  };

  const updateRollout = (bundleId: string, percentage: number) => {
    setBundles(prev => prev.map(bundle =>
      bundle.id === bundleId ? { ...bundle, rolloutPercentage: percentage } : bundle
    ));
  };

  if (loading) {
    return (
      <div className="cads-content-wrapper">
        <div className="flex items-center justify-center h-64">
          <div className="cads-loading"></div>
          <span className="ml-3 text-white/70">Loading Policy Bundles...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="cads-content-wrapper cads-fade-in">
      {/* Tab Navigation */}
      <div className="cads-nav-tabs">
        <div className="cads-nav-list">
          {[
            { id: 'bundles', label: 'Policy Bundles', icon: Shield },
            { id: 'editor', label: 'Policy Editor', icon: Edit3 },
            { id: 'simulator', label: 'Dry-Run Simulator', icon: TestTube },
            { id: 'rollout', label: 'Rollout Control', icon: GitBranch }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`cads-nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'bundles' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Policy Bundles</h3>
                <div className="flex gap-2">
                  <button className="cads-action-button">
                    <Upload size={16} />
                    Import Bundle
                  </button>
                  <button className="cads-action-button">
                    <RefreshCw size={16} />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="grid gap-4">
                {bundles.map(bundle => (
                  <motion.div
                    key={bundle.id}
                    className={`cads-kpi-card cursor-pointer ${selectedBundle?.id === bundle.id ? 'cads-border-glow' : ''}`}
                    onClick={() => handleBundleSelect(bundle)}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold">{bundle.name}</h4>
                          <span className={`cads-status-badge ${bundle.status}`}>
                            {bundle.status === 'active' && <CheckCircle size={12} />}
                            {bundle.status === 'testing' && <TestTube size={12} />}
                            {bundle.status === 'draft' && <FileText size={12} />}
                            {bundle.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-white/70 text-sm mb-3">{bundle.description}</p>
                        <div className="flex items-center gap-4 text-sm text-white/60">
                          <span>Version: {bundle.version}</span>
                          <span>Rules: {bundle.rules.length}</span>
                          <span>Author: {bundle.author}</span>
                          <span>Modified: {bundle.lastModified.toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <div className="text-sm text-white/60">Rollout</div>
                          <div className="text-lg font-bold text-cyan-400">{bundle.rolloutPercentage}%</div>
                        </div>
                        <div className="w-20 bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-cyan-400 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${bundle.rolloutPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white/60">Rules:</span>
                          {bundle.rules.slice(0, 3).map(rule => (
                            <span key={rule.id} className="text-xs bg-white/10 px-2 py-1 rounded">
                              {rule.name}
                            </span>
                          ))}
                          {bundle.rules.length > 3 && (
                            <span className="text-xs text-white/60">+{bundle.rules.length - 3} more</span>
                          )}
                        </div>
                        <button className="cads-action-button">
                          <Eye size={14} />
                          View
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'editor' && (
            <div className="cads-policy-editor">
              <div className="cads-editor-toolbar">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold">
                    Policy Editor: {selectedBundle?.name || 'New Policy'}
                  </h3>
                  <span className="text-sm text-white/60">
                    Language: Rego (Open Policy Agent)
                  </span>
                </div>
                <div className="cads-editor-actions">
                  <button className="cads-editor-button">
                    <FileText size={16} />
                    New
                  </button>
                  <button onClick={runTests} className="cads-editor-button">
                    <TestTube size={16} />
                    Run Tests
                  </button>
                  <button className="cads-editor-button">
                    <Download size={16} />
                    Export
                  </button>
                  <button onClick={handleSavePolicy} className="cads-editor-button primary">
                    <Save size={16} />
                    Save Policy
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <textarea
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    className="cads-editor-textarea"
                    placeholder="Write your Rego policy here..."
                    spellCheck={false}
                  />
                </div>

                <div className="space-y-4">
                  <div className="cads-chart-container">
                    <h4 className="cads-chart-title">Syntax Validation</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle size={16} />
                        <span>Syntax: Valid</span>
                      </div>
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle size={16} />
                        <span>Imports: Valid</span>
                      </div>
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle size={16} />
                        <span>Rules: 4 defined</span>
                      </div>
                    </div>
                  </div>

                  {testResults.length > 0 && (
                    <div className="cads-chart-container">
                      <h4 className="cads-chart-title">Test Results</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {testResults.map((test, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            {test.status === 'pass' ? (
                              <CheckCircle size={14} className="text-green-400" />
                            ) : (
                              <AlertTriangle size={14} className="text-red-400" />
                            )}
                            <span className="text-white/80">{test.scenario}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="cads-chart-container">
                    <h4 className="cads-chart-title">Policy Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Lines of Code:</span>
                        <span className="font-mono">{editorContent.split('\n').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rules Defined:</span>
                        <span className="font-mono">4</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Complexity:</span>
                        <span className="text-green-400">Low</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'simulator' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Policy Simulator</h3>
                <button onClick={runSimulator} className="cads-action-button">
                  <Play size={16} />
                  Run Simulation
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="cads-chart-container">
                    <h4 className="cads-chart-title">Input Request</h4>
                    <textarea
                      value={simulatorInput}
                      onChange={(e) => setSimulatorInput(e.target.value)}
                      className="w-full h-64 p-3 bg-black/50 border border-white/20 rounded font-mono text-sm text-white resize-none"
                      placeholder={`{
  "method": "POST",
  "path": "/microcell/spawn",
  "headers": {
    "authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  },
  "risk_score": 25,
  "source_ip": "192.168.1.100",
  "intent": "execute.wasm.sandbox",
  "user_id": "user-123"
}`}
                      spellCheck={false}
                    />
                  </div>

                  <div className="cads-chart-container">
                    <h4 className="cads-chart-title">Quick Scenarios</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setSimulatorInput('{"method":"POST","path":"/microcell/spawn","risk_score":25}')}
                        className="cads-action-button text-sm"
                      >
                        Low Risk Request
                      </button>
                      <button 
                        onClick={() => setSimulatorInput('{"method":"POST","path":"/microcell/spawn","risk_score":95}')}
                        className="cads-action-button text-sm"
                      >
                        High Risk Request
                      </button>
                      <button 
                        onClick={() => setSimulatorInput('{"method":"GET","path":"/unauthorized"}')}
                        className="cads-action-button text-sm"
                      >
                        Invalid Method
                      </button>
                      <button 
                        onClick={() => setSimulatorInput('{"method":"POST","path":"/microcell/spawn","headers":{"authorization":"Bearer expired.token"}}')}
                        className="cads-action-button text-sm"
                      >
                        Expired Token
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="cads-chart-container">
                    <h4 className="cads-chart-title">Simulation Result</h4>
                    {simulatorResult?.loading ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="cads-loading"></div>
                        <span className="ml-3">Running simulation...</span>
                      </div>
                    ) : simulatorResult ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${simulatorResult.decision === 'allow' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                          <span className="text-lg font-semibold">
                            Decision: {simulatorResult.decision?.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="text-sm space-y-2">
                          <div><strong>Reason:</strong> {simulatorResult.reason}</div>
                          <div><strong>Execution Time:</strong> {simulatorResult.executionTime}ms</div>
                          <div><strong>Risk Score:</strong> {simulatorResult.metadata?.riskScore}</div>
                        </div>

                        <div>
                          <h5 className="font-semibold mb-2">Rule Evaluation:</h5>
                          <div className="space-y-1">
                            {simulatorResult.rulesEvaluated?.map((rule: any, index: number) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span>{rule.rule}</span>
                                <div className="flex items-center gap-2">
                                  <span className={rule.result === 'pass' ? 'text-green-400' : 'text-red-400'}>
                                    {rule.result}
                                  </span>
                                  <span className="text-white/60">{rule.duration}ms</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-white/60 py-8">
                        Enter a request and click "Run Simulation" to see results
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rollout' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold">Blue/Green Rollout Control</h3>
              
              <div className="space-y-6">
                {bundles.map(bundle => (
                  <div key={bundle.id} className="cads-chart-container">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="cads-chart-title">{bundle.name}</h4>
                        <p className="text-white/60 text-sm">Version {bundle.version}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-cyan-400">{bundle.rolloutPercentage}%</div>
                        <div className="text-sm text-white/60">Traffic</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Rollout Percentage: {bundle.rolloutPercentage}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={bundle.rolloutPercentage}
                          onChange={(e) => updateRollout(bundle.id, parseInt(e.target.value))}
                          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                          aria-label={`Rollout percentage for ${bundle.name}`}
                        />
                        <div className="flex justify-between text-xs text-white/60 mt-1">
                          <span>0%</span>
                          <span>25%</span>
                          <span>50%</span>
                          <span>75%</span>
                          <span>100%</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-white/60">Current Traffic</div>
                          <div className="font-semibold">{bundle.rolloutPercentage}%</div>
                        </div>
                        <div>
                          <div className="text-white/60">Canary Traffic</div>
                          <div className="font-semibold">{100 - bundle.rolloutPercentage}%</div>
                        </div>
                        <div>
                          <div className="text-white/60">Status</div>
                          <div className={`font-semibold ${bundle.rolloutPercentage === 100 ? 'text-green-400' : 'text-yellow-400'}`}>
                            {bundle.rolloutPercentage === 100 ? 'Full Rollout' : 'Gradual Rollout'}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => updateRollout(bundle.id, 0)}
                          className="cads-action-button"
                        >
                          Full Rollback
                        </button>
                        <button 
                          onClick={() => updateRollout(bundle.id, 50)}
                          className="cads-action-button"
                        >
                          50/50 Split
                        </button>
                        <button 
                          onClick={() => updateRollout(bundle.id, 100)}
                          className="cads-action-button"
                        >
                          Full Rollout
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Policies;
