import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Code,
  Play,
  Save,
  FileText,
  CheckCircle,
  AlertTriangle,
  Copy,
  Download,
  Upload,
  Zap,
  Eye,
  Settings,
  GitBranch,
  Clock,
  X
} from 'lucide-react';

interface PolicyBundle {
  id: string;
  name: string;
  version: string;
  description: string;
  content: string;
  status: 'draft' | 'active' | 'deprecated';
  createdAt: Date;
  updatedAt: Date;
  author: string;
  testCases: Array<{
    name: string;
    input: any;
    expectedResult: 'allow' | 'deny';
    actualResult?: 'allow' | 'deny';
    passed?: boolean;
  }>;
}

interface PolicyEditorProps {
  bundleId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (bundle: PolicyBundle) => void;
}

const PolicyEditor: React.FC<PolicyEditorProps> = ({ bundleId, isOpen, onClose, onSave }) => {
  const [bundle, setBundle] = useState<PolicyBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'test' | 'docs'>('editor');
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    if (bundleId && isOpen) {
      loadBundle(bundleId);
    } else if (isOpen) {
      // Create new bundle
      setBundle({
        id: `bundle_${Date.now()}`,
        name: 'New Policy Bundle',
        version: '1.0.0',
        description: '',
        content: `package cads.policy

import rego.v1

# Default policy - deny all by default
default allow := false

# Allow authenticated users with valid devices
allow if {
    input.user.authenticated == true
    input.device.compliance >= 90
    input.intent.valid == true
}

# Test cases (comments starting with //test:)
# //test:allow {"user": {"authenticated": true}, "device": {"compliance": 95}, "intent": {"valid": true}}
# //test:deny {"user": {"authenticated": false}, "device": {"compliance": 95}, "intent": {"valid": true}}`,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: 'current-user',
        testCases: []
      });
    }
  }, [bundleId, isOpen]);

  const loadBundle = async (id: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockBundle: PolicyBundle = {
        id,
        name: 'User Authentication Policy',
        version: '2.1.3',
        description: 'Comprehensive authentication and authorization policy for microcell access',
        content: `package cads.policy

import rego.v1

# Default policy - deny all by default
default allow := false

# Allow authenticated users with valid devices
allow if {
    input.user.authenticated == true
    input.device.compliance >= 90
    input.intent.valid == true
    not high_risk_user
}

# Check for high risk users
high_risk_user if {
    input.user.id in data.high_risk_users
}

# Special permissions for admins
allow if {
    input.user.role == "admin"
    input.user.mfa_verified == true
}

# Restrict certain operations during maintenance
deny if {
    input.intent.operation in ["delete", "modify"]
    data.maintenance_mode == true
    input.user.role != "admin"
}

# Log all policy decisions for audit
log_decision := {
    "user": input.user.id,
    "intent": input.intent.operation,
    "decision": allow,
    "timestamp": time.now_ns()
}

# Test cases
# //test:allow {"user": {"authenticated": true, "role": "analyst"}, "device": {"compliance": 95}, "intent": {"valid": true, "operation": "read"}}
# //test:deny {"user": {"authenticated": false}, "device": {"compliance": 95}, "intent": {"valid": true}}
# //test:allow {"user": {"authenticated": true, "role": "admin", "mfa_verified": true}, "device": {"compliance": 80}, "intent": {"valid": true, "operation": "delete"}}`,
        status: 'active',
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(Date.now() - 3600000),
        author: 'policy-admin',
        testCases: [
          {
            name: 'Valid user access',
            input: {"user": {"authenticated": true, "role": "analyst"}, "device": {"compliance": 95}, "intent": {"valid": true, "operation": "read"}},
            expectedResult: 'allow'
          },
          {
            name: 'Unauthenticated user',
            input: {"user": {"authenticated": false}, "device": {"compliance": 95}, "intent": {"valid": true}},
            expectedResult: 'deny'
          },
          {
            name: 'Admin override',
            input: {"user": {"authenticated": true, "role": "admin", "mfa_verified": true}, "device": {"compliance": 80}, "intent": {"valid": true, "operation": "delete"}},
            expectedResult: 'allow'
          }
        ]
      };

      setBundle(mockBundle);
    } catch (error) {
      console.error('Failed to load bundle:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!bundle) return;
    
    setSaving(true);
    try {
      // Extract test cases from comments
      const testCaseRegex = /\/\/test:(allow|deny)\s+(.+)/g;
      const testCases: PolicyBundle['testCases'] = [];
      let match;
      
      while ((match = testCaseRegex.exec(bundle.content)) !== null) {
        try {
          const expectedResult = match[1] as 'allow' | 'deny';
          const input = JSON.parse(match[2]);
          testCases.push({
            name: `Test case ${testCases.length + 1}`,
            input,
            expectedResult
          });
        } catch (e) {
          console.warn('Failed to parse test case:', match[2]);
        }
      }

      const updatedBundle = {
        ...bundle,
        testCases,
        updatedAt: new Date()
      };

      setBundle(updatedBundle);
      onSave(updatedBundle);
      
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to save bundle:', error);
    } finally {
      setSaving(false);
    }
  };

  const runTests = async () => {
    if (!bundle?.testCases.length) return;
    
    setTesting(true);
    try {
      // Simulate test execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const results = bundle.testCases.map(testCase => ({
        ...testCase,
        actualResult: Math.random() > 0.2 ? testCase.expectedResult : (testCase.expectedResult === 'allow' ? 'deny' : 'allow') as 'allow' | 'deny',
        passed: Math.random() > 0.2
      }));
      
      setTestResults(results);
    } catch (error) {
      console.error('Failed to run tests:', error);
    } finally {
      setTesting(false);
    }
  };

  const getStatusColor = (status: PolicyBundle['status']) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/20 border-green-400/50';
      case 'draft': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/50';
      case 'deprecated': return 'text-red-400 bg-red-400/20 border-red-400/50';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/50';
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
        className="bg-gray-900/95 backdrop-blur border border-white/20 rounded-lg w-full max-w-7xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="cads-kpi-icon bg-purple-500/20">
              <Code size={24} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Policy Editor</h2>
              <p className="text-white/60 text-sm">
                {bundle ? `Editing: ${bundle.name} v${bundle.version}` : 'Loading...'}
              </p>
            </div>
          </div>
          
          {bundle && (
            <div className="flex items-center gap-3">
              <span className={`cads-status-badge ${getStatusColor(bundle.status)}`}>
                {bundle.status.toUpperCase()}
              </span>
              <button
                onClick={handleSave}
                disabled={saving}
                className="cads-action-button"
                aria-label="Save Policy"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={onClose}
                className="cads-action-button"
                aria-label="Close Editor"
              >
                <X size={20} />
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="cads-loading"></div>
            <span className="ml-3 text-white/70">Loading policy bundle...</span>
          </div>
        ) : bundle ? (
          <>
            {/* Tab Navigation */}
            <div className="border-b border-white/10">
              <div className="flex px-6">
                {[
                  { id: 'editor', label: 'Editor', icon: Code },
                  { id: 'test', label: 'Tests', icon: Zap },
                  { id: 'docs', label: 'Documentation', icon: FileText }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-purple-400 text-purple-400'
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
            <div className="flex-1 overflow-hidden">
              {activeTab === 'editor' && (
                <div className="h-full flex flex-col">
                  {/* Toolbar */}
                  <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label htmlFor="policyName" className="text-sm font-medium">Name:</label>
                        <input
                          id="policyName"
                          type="text"
                          value={bundle.name}
                          onChange={(e) => setBundle(prev => prev ? {...prev, name: e.target.value} : null)}
                          className="cads-form-input"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label htmlFor="policyVersion" className="text-sm font-medium">Version:</label>
                        <input
                          id="policyVersion"
                          type="text"
                          value={bundle.version}
                          onChange={(e) => setBundle(prev => prev ? {...prev, version: e.target.value} : null)}
                          className="cads-form-input"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigator.clipboard.writeText(bundle.content)}
                        className="cads-action-button text-sm"
                        aria-label="Copy Content"
                      >
                        <Copy size={14} />
                        Copy
                      </button>
                      <button className="cads-action-button text-sm" aria-label="Import Policy">
                        <Upload size={14} />
                        Import
                      </button>
                      <button className="cads-action-button text-sm" aria-label="Export Policy">
                        <Download size={14} />
                        Export
                      </button>
                    </div>
                  </div>

                  {/* Editor */}
                  <div className="flex-1 p-4">
                    <textarea
                      value={bundle.content}
                      onChange={(e) => setBundle(prev => prev ? {...prev, content: e.target.value} : null)}
                      className="w-full h-full bg-black/40 border border-white/10 rounded p-4 font-mono text-sm text-white resize-none focus:border-purple-400 focus:outline-none"
                      placeholder="Enter Rego policy content..."
                      spellCheck={false}
                      aria-label="Policy Content"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'test' && (
                <div className="h-full flex flex-col p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Policy Tests</h3>
                    <button
                      onClick={runTests}
                      disabled={testing || !bundle.testCases.length}
                      className="cads-action-button"
                      aria-label="Run Tests"
                    >
                      <Play size={16} />
                      {testing ? 'Running...' : 'Run Tests'}
                    </button>
                  </div>

                  {bundle.testCases.length === 0 ? (
                    <div className="text-center text-white/60 py-12">
                      <Zap size={48} className="mx-auto mb-4" />
                      <p>No test cases found</p>
                      <p className="text-sm mt-2">Add test cases using //test:allow or //test:deny comments in your policy</p>
                    </div>
                  ) : (
                    <div className="space-y-4 flex-1 overflow-auto">
                      {(testResults.length > 0 ? testResults : bundle.testCases).map((test, index) => (
                        <motion.div
                          key={index}
                          className="cads-kpi-card"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h4 className="font-semibold">{test.name}</h4>
                                {'passed' in test && (
                                  <span className={`cads-status-badge text-xs ${
                                    test.passed ? 'text-green-400 bg-green-400/20 border-green-400/50' : 'text-red-400 bg-red-400/20 border-red-400/50'
                                  }`}>
                                    {test.passed ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                                    {test.passed ? 'PASS' : 'FAIL'}
                                  </span>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <div className="text-white/60 mb-1">Input</div>
                                  <pre className="bg-black/20 p-2 rounded border border-white/10 text-xs overflow-auto max-h-20">
                                    {JSON.stringify(test.input, null, 2)}
                                  </pre>
                                </div>
                                <div>
                                  <div className="text-white/60 mb-1">Expected</div>
                                  <span className={`cads-status-badge text-xs ${
                                    test.expectedResult === 'allow' ? 'text-green-400' : 'text-red-400'
                                  }`}>
                                    {test.expectedResult.toUpperCase()}
                                  </span>
                                </div>
                                {'actualResult' in test && (
                                  <div>
                                    <div className="text-white/60 mb-1">Actual</div>
                                    <span className={`cads-status-badge text-xs ${
                                      test.actualResult === 'allow' ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                      {test.actualResult?.toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'docs' && (
                <div className="h-full flex flex-col p-6">
                  <h3 className="text-lg font-semibold mb-4">Policy Documentation</h3>
                  <div className="space-y-4">
                    <div className="cads-kpi-card">
                      <h4 className="font-semibold mb-2">Description</h4>
                      <textarea
                        value={bundle.description}
                        onChange={(e) => setBundle(prev => prev ? {...prev, description: e.target.value} : null)}
                        className="w-full h-24 bg-black/20 border border-white/10 rounded p-3 text-white resize-none focus:border-purple-400 focus:outline-none"
                        placeholder="Enter policy description..."
                        aria-label="Policy Description"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="cads-kpi-card">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Clock size={16} />
                          Metadata
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-white/60">Created</span>
                            <span>{bundle.createdAt.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60">Updated</span>
                            <span>{bundle.updatedAt.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60">Author</span>
                            <span>{bundle.author}</span>
                          </div>
                        </div>
                      </div>

                      <div className="cads-kpi-card">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <GitBranch size={16} />
                          Version History
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>v{bundle.version}</span>
                            <span className="text-green-400">Current</span>
                          </div>
                          <div className="flex justify-between">
                            <span>v2.1.2</span>
                            <span className="text-white/60">Previous</span>
                          </div>
                          <div className="flex justify-between">
                            <span>v2.1.1</span>
                            <span className="text-white/60">Archive</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-white/60">
              <Code size={48} className="mx-auto mb-4" />
              <p>Failed to load policy bundle</p>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default PolicyEditor;
