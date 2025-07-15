import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Square,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  Eye,
  Code,
  Database,
  Shield,
  Activity
} from 'lucide-react';

interface SimulationInput {
  intentToken?: string;
  user?: {
    id: string;
    role: string;
    authenticated: boolean;
    mfa_verified?: boolean;
  };
  device?: {
    id: string;
    compliance: number;
    trusted: boolean;
  };
  intent?: {
    operation: string;
    resource: string;
    valid: boolean;
  };
  context?: {
    time: string;
    location: string;
    network: string;
  };
}

interface SimulationResult {
  decision: 'allow' | 'deny';
  executionTime: number;
  rulesEvaluated: number;
  trace: Array<{
    rule: string;
    result: boolean;
    time: number;
    details: string;
  }>;
  warnings: string[];
  errors: string[];
}

interface PolicySimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  policyContent?: string;
}

const PolicySimulator: React.FC<PolicySimulatorProps> = ({ isOpen, onClose, policyContent }) => {
  const [input, setInput] = useState<string>('');
  const [policy, setPolicy] = useState<string>('');
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'input' | 'policy' | 'result' | 'trace'>('input');

  useEffect(() => {
    if (policyContent) {
      setPolicy(policyContent);
    } else {
      setPolicy(`package cads.policy

import rego.v1

# Default policy - deny all by default
default allow := false

# Allow authenticated users with valid devices
allow if {
    input.user.authenticated == true
    input.device.compliance >= 90
    input.intent.valid == true
}

# Special permissions for admins
allow if {
    input.user.role == "admin"
    input.user.mfa_verified == true
}`);
    }

    // Set default input
    setInput(JSON.stringify({
      user: {
        id: "user123",
        role: "analyst",
        authenticated: true,
        mfa_verified: false
      },
      device: {
        id: "device456",
        compliance: 95,
        trusted: true
      },
      intent: {
        operation: "read",
        resource: "microcell-data",
        valid: true
      },
      context: {
        time: new Date().toISOString(),
        location: "office",
        network: "corporate"
      }
    }, null, 2));
  }, [policyContent]);

  const runSimulation = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate OPA evaluation
      
      const inputData = JSON.parse(input);
      
      // Mock simulation result
      const mockResult: SimulationResult = {
        decision: inputData.user?.authenticated && inputData.device?.compliance >= 90 ? 'allow' : 'deny',
        executionTime: Math.floor(Math.random() * 50) + 10,
        rulesEvaluated: 7,
        trace: [
          {
            rule: 'default allow := false',
            result: false,
            time: 2,
            details: 'Default deny policy activated'
          },
          {
            rule: 'input.user.authenticated == true',
            result: inputData.user?.authenticated || false,
            time: 5,
            details: `User authentication status: ${inputData.user?.authenticated}`
          },
          {
            rule: 'input.device.compliance >= 90',
            result: (inputData.device?.compliance || 0) >= 90,
            time: 8,
            details: `Device compliance: ${inputData.device?.compliance}%`
          },
          {
            rule: 'input.intent.valid == true',
            result: inputData.intent?.valid || false,
            time: 12,
            details: `Intent validation: ${inputData.intent?.valid}`
          },
          {
            rule: 'allow if {...}',
            result: inputData.user?.authenticated && inputData.device?.compliance >= 90 && inputData.intent?.valid,
            time: 15,
            details: 'Main allow rule evaluation'
          },
          {
            rule: 'input.user.role == "admin"',
            result: inputData.user?.role === 'admin',
            time: 18,
            details: `User role check: ${inputData.user?.role}`
          },
          {
            rule: 'Final Decision',
            result: inputData.user?.authenticated && inputData.device?.compliance >= 90 && inputData.intent?.valid,
            time: 20,
            details: 'Policy evaluation complete'
          }
        ],
        warnings: inputData.device?.compliance < 95 ? ['Device compliance below recommended 95%'] : [],
        errors: []
      };

      setResult(mockResult);
      setActiveTab('result');
    } catch (error) {
      setResult({
        decision: 'deny',
        executionTime: 0,
        rulesEvaluated: 0,
        trace: [],
        warnings: [],
        errors: ['Invalid JSON input or policy syntax error']
      });
      setActiveTab('result');
    } finally {
      setLoading(false);
    }
  };

  const resetSimulation = () => {
    setResult(null);
    setActiveTab('input');
  };

  const loadPreset = (preset: string) => {
    const presets = {
      validUser: {
        user: { id: "user123", role: "analyst", authenticated: true, mfa_verified: false },
        device: { id: "device456", compliance: 95, trusted: true },
        intent: { operation: "read", resource: "microcell-data", valid: true },
        context: { time: new Date().toISOString(), location: "office", network: "corporate" }
      },
      invalidUser: {
        user: { id: "user789", role: "guest", authenticated: false, mfa_verified: false },
        device: { id: "device789", compliance: 65, trusted: false },
        intent: { operation: "write", resource: "sensitive-data", valid: true },
        context: { time: new Date().toISOString(), location: "remote", network: "public" }
      },
      adminUser: {
        user: { id: "admin001", role: "admin", authenticated: true, mfa_verified: true },
        device: { id: "secure-device", compliance: 98, trusted: true },
        intent: { operation: "delete", resource: "system-config", valid: true },
        context: { time: new Date().toISOString(), location: "datacenter", network: "management" }
      }
    };

    const selectedPreset = presets[preset as keyof typeof presets];
    if (selectedPreset) {
      setInput(JSON.stringify(selectedPreset, null, 2));
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gray-900/95 backdrop-blur border border-white/20 rounded-lg w-full max-w-6xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="cads-kpi-icon bg-blue-500/20">
              <Play size={24} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Policy Simulator</h2>
              <p className="text-white/60 text-sm">Test policy decisions with sample inputs</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={runSimulation}
              disabled={loading}
              className="cads-action-button"
              aria-label="Run Simulation"
            >
              <Play size={16} />
              {loading ? 'Running...' : 'Run Simulation'}
            </button>
            <button
              onClick={resetSimulation}
              className="cads-action-button"
              aria-label="Reset Simulation"
            >
              <RotateCcw size={16} />
              Reset
            </button>
            <button
              onClick={onClose}
              className="cads-action-button"
              aria-label="Close Simulator"
            >
              <Square size={16} />
              Close
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-white/10">
          <div className="flex px-6">
            {[
              { id: 'input', label: 'Input Data', icon: Database },
              { id: 'policy', label: 'Policy', icon: Shield },
              { id: 'result', label: 'Result', icon: CheckCircle },
              { id: 'trace', label: 'Execution Trace', icon: Activity }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-400 text-blue-400'
                    : 'border-transparent text-white/60 hover:text-white'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'input' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Input Data</h3>
                <div className="flex items-center gap-2">
                  <label htmlFor="presetSelect" className="text-sm">Quick Presets:</label>
                  <select 
                    id="presetSelect"
                    onChange={(e) => loadPreset(e.target.value)}
                    className="cads-form-select text-sm"
                    defaultValue=""
                  >
                    <option value="">Select preset...</option>
                    <option value="validUser">Valid User</option>
                    <option value="invalidUser">Invalid User</option>
                    <option value="adminUser">Admin User</option>
                  </select>
                </div>
              </div>
              
              <div className="cads-chart-container">
                <h4 className="cads-chart-title">JSON Input</h4>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full h-96 bg-black/40 border border-white/10 rounded p-4 font-mono text-sm text-white resize-none focus:border-blue-400 focus:outline-none"
                  placeholder="Enter JSON input data..."
                  spellCheck={false}
                  aria-label="JSON Input Data"
                />
              </div>
            </div>
          )}

          {activeTab === 'policy' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Policy Content</h3>
              
              <div className="cads-chart-container">
                <h4 className="cads-chart-title">Rego Policy</h4>
                <textarea
                  value={policy}
                  onChange={(e) => setPolicy(e.target.value)}
                  className="w-full h-96 bg-black/40 border border-white/10 rounded p-4 font-mono text-sm text-white resize-none focus:border-blue-400 focus:outline-none"
                  placeholder="Enter Rego policy content..."
                  spellCheck={false}
                  aria-label="Policy Content"
                />
              </div>
            </div>
          )}

          {activeTab === 'result' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Simulation Result</h3>
              
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="cads-loading"></div>
                  <span className="ml-3 text-white/70">Evaluating policy...</span>
                </div>
              ) : result ? (
                <div className="space-y-6">
                  {/* Decision */}
                  <div className="cads-kpi-card">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold">Decision</h4>
                      <span className={`cads-status-badge text-lg ${
                        result.decision === 'allow' 
                          ? 'text-green-400 bg-green-400/20 border-green-400/50'
                          : 'text-red-400 bg-red-400/20 border-red-400/50'
                      }`}>
                        {result.decision === 'allow' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                        {result.decision.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="cads-kpi-card text-center">
                      <div className="text-2xl font-bold text-cyan-400 mb-1">{result.executionTime}ms</div>
                      <div className="text-sm text-white/60">Execution Time</div>
                    </div>
                    <div className="cads-kpi-card text-center">
                      <div className="text-2xl font-bold text-green-400 mb-1">{result.rulesEvaluated}</div>
                      <div className="text-sm text-white/60">Rules Evaluated</div>
                    </div>
                    <div className="cads-kpi-card text-center">
                      <div className="text-2xl font-bold text-yellow-400 mb-1">{result.warnings.length}</div>
                      <div className="text-sm text-white/60">Warnings</div>
                    </div>
                  </div>

                  {/* Warnings and Errors */}
                  {(result.warnings.length > 0 || result.errors.length > 0) && (
                    <div className="space-y-3">
                      {result.warnings.length > 0 && (
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded">
                          <h5 className="font-semibold text-yellow-400 mb-2">Warnings</h5>
                          <ul className="space-y-1">
                            {result.warnings.map((warning, index) => (
                              <li key={index} className="text-sm text-yellow-300">• {warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {result.errors.length > 0 && (
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded">
                          <h5 className="font-semibold text-red-400 mb-2">Errors</h5>
                          <ul className="space-y-1">
                            {result.errors.map((error, index) => (
                              <li key={index} className="text-sm text-red-300">• {error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-white/60 py-12">
                  <Play size={48} className="mx-auto mb-4" />
                  <p>No simulation results yet</p>
                  <p className="text-sm mt-2">Run a simulation to see the results</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'trace' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Execution Trace</h3>
              
              {result?.trace ? (
                <div className="space-y-3">
                  {result.trace.map((step, index) => (
                    <motion.div
                      key={index}
                      className="cads-kpi-card"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm text-white/60">Step {index + 1}</span>
                            <span className={`cads-status-badge text-xs ${
                              step.result ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {step.result ? 'TRUE' : 'FALSE'}
                            </span>
                            <span className="text-xs text-white/40">{step.time}ms</span>
                          </div>
                          <div className="font-mono text-sm bg-black/20 p-2 rounded border border-white/10 mb-2">
                            {step.rule}
                          </div>
                          <p className="text-white/80 text-sm">{step.details}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-white/60 py-12">
                  <Activity size={48} className="mx-auto mb-4" />
                  <p>No execution trace available</p>
                  <p className="text-sm mt-2">Run a simulation to see the trace</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PolicySimulator;
