import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key,
  Plus,
  QrCode,
  Link,
  Copy,
  Trash2,
  RefreshCw,
  Shield,
  Clock,
  User,
  Smartphone,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Settings
} from 'lucide-react';

interface IntentToken {
  id: string;
  name: string;
  verb: string;
  resource: string;
  scope: string[];
  ttl: number;
  createdAt: Date;
  expiresAt: Date;
  status: 'active' | 'expired' | 'revoked' | 'pending';
  deviceBinding?: string;
  userAgent?: string;
  sourceIP?: string;
  usageCount: number;
  maxUsage?: number;
  token?: string;
  lastUsed?: Date;
}

interface TokenGeneratorForm {
  name: string;
  verb: string;
  resource: string;
  scope: string[];
  ttl: number;
  maxUsage?: number;
  requireDeviceBinding: boolean;
  allowedIPs: string[];
}

const IntentTokens: React.FC = () => {
  const [tokens, setTokens] = useState<IntentToken[]>([]);
  const [activeTab, setActiveTab] = useState<'vault' | 'generator' | 'qr' | 'revocations'>('vault');
  const [loading, setLoading] = useState(true);
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [selectedToken, setSelectedToken] = useState<IntentToken | null>(null);
  const [showTokenValue, setShowTokenValue] = useState<Set<string>>(new Set());
  const [generatedToken, setGeneratedToken] = useState<IntentToken | null>(null);

  const [tokenForm, setTokenForm] = useState<TokenGeneratorForm>({
    name: '',
    verb: 'execute',
    resource: 'microcell',
    scope: ['spawn'],
    ttl: 3600,
    requireDeviceBinding: false,
    allowedIPs: []
  });

  const verbOptions = ['execute', 'read', 'write', 'delete', 'manage', 'audit'];
  const resourceOptions = ['microcell', 'policy', 'ledger', 'user', 'system', 'metrics'];
  const scopeOptions = ['spawn', 'terminate', 'inspect', 'configure', 'monitor', 'export'];

  useEffect(() => {
    const loadTokens = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockTokens: IntentToken[] = [
          {
            id: 'tk-001',
            name: 'Analytics Service Token',
            verb: 'execute',
            resource: 'microcell',
            scope: ['spawn', 'inspect'],
            ttl: 3600,
            createdAt: new Date(Date.now() - 7200000),
            expiresAt: new Date(Date.now() + 3600000),
            lastUsed: new Date(Date.now() - 300000),
            status: 'active',
            deviceBinding: 'fp-abc123',
            userAgent: 'AnalyticsBot/1.0',
            sourceIP: '192.168.1.100',
            usageCount: 45,
            maxUsage: 100,
            token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXJiIjoiZXhlY3V0ZSIsInJlc291cmNlIjoibWljcm9jZWxsIiwic2NvcGUiOlsic3Bhd24iLCJpbnNwZWN0Il19.abc123'
          },
          {
            id: 'tk-002',
            name: 'Security Monitor Token',
            verb: 'read',
            resource: 'metrics',
            scope: ['monitor', 'export'],
            ttl: 7200,
            createdAt: new Date(Date.now() - 3600000),
            expiresAt: new Date(Date.now() + 3600000),
            status: 'active',
            usageCount: 12,
            token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXJiIjoicmVhZCIsInJlc291cmNlIjoibWV0cmljcyIsInNjb3BlIjpbIm1vbml0b3IiLCJleHBvcnQiXX0.def456'
          },
          {
            id: 'tk-003',
            name: 'Expired Test Token',
            verb: 'execute',
            resource: 'microcell',
            scope: ['spawn'],
            ttl: 1800,
            createdAt: new Date(Date.now() - 7200000),
            expiresAt: new Date(Date.now() - 1800000),
            status: 'expired',
            usageCount: 5,
            maxUsage: 10,
            token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXJiIjoiZXhlY3V0ZSIsInJlc291cmNlIjoibWljcm9jZWxsIiwic2NvcGUiOlsic3Bhd24iXX0.ghi789'
          }
        ];

        setTokens(mockTokens);
      } catch (error) {
        console.error('Failed to load tokens:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTokens();
  }, []);

  const generateToken = async () => {
    if (!tokenForm.name.trim()) {
      alert('Please enter a token name');
      return;
    }

    try {
      // Simulate token generation
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newToken: IntentToken = {
        id: `tk-${Date.now()}`,
        name: tokenForm.name,
        verb: tokenForm.verb,
        resource: tokenForm.resource,
        scope: tokenForm.scope,
        ttl: tokenForm.ttl,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + tokenForm.ttl * 1000),
        status: 'active',
        usageCount: 0,
        maxUsage: tokenForm.maxUsage,
        token: generateJWT(tokenForm)
      };

      setTokens(prev => [newToken, ...prev]);
      setGeneratedToken(newToken);
      setTokenForm({
        name: '',
        verb: 'execute',
        resource: 'microcell',
        scope: ['spawn'],
        ttl: 3600,
        requireDeviceBinding: false,
        allowedIPs: []
      });
      setShowTokenForm(false);
      setActiveTab('qr');
    } catch (error) {
      console.error('Failed to generate token:', error);
      alert('Failed to generate token');
    }
  };

  const generateJWT = (form: TokenGeneratorForm): string => {
    const header = btoa(JSON.stringify({ typ: "JWT", alg: "HS256" }));
    const payload = btoa(JSON.stringify({
      verb: form.verb,
      resource: form.resource,
      scope: form.scope,
      exp: Math.floor((Date.now() + form.ttl * 1000) / 1000),
      iat: Math.floor(Date.now() / 1000),
      jti: `tk-${Date.now()}`
    }));
    const signature = btoa(`signature-${Date.now()}`);
    return `${header}.${payload}.${signature}`;
  };

  const revokeToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to revoke this token?')) return;

    setTokens(prev => prev.map(token =>
      token.id === tokenId ? { ...token, status: 'revoked' as const } : token
    ));
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    // Show temporary feedback (you could use a toast here)
    alert('Token copied to clipboard!');
  };

  const exportTokens = () => {
    const exportData = tokens.map(({ token, ...tokenData }) => tokenData);
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `intent-tokens-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleTokenVisibility = (tokenId: string) => {
    const newSet = new Set(showTokenValue);
    if (newSet.has(tokenId)) {
      newSet.delete(tokenId);
    } else {
      newSet.add(tokenId);
    }
    setShowTokenValue(newSet);
  };

  const getStatusColor = (status: IntentToken['status']) => {
    switch (status) {
      case 'active': return 'text-green-400 border-green-400 bg-green-400/10';
      case 'expired': return 'text-yellow-400 border-yellow-400 bg-yellow-400/10';
      case 'revoked': return 'text-red-400 border-red-400 bg-red-400/10';
      case 'pending': return 'text-blue-400 border-blue-400 bg-blue-400/10';
      default: return 'text-gray-400 border-gray-400 bg-gray-400/10';
    }
  };

  const getStatusIcon = (status: IntentToken['status']) => {
    switch (status) {
      case 'active': return <CheckCircle size={12} />;
      case 'expired': return <Clock size={12} />;
      case 'revoked': return <XCircle size={12} />;
      case 'pending': return <AlertTriangle size={12} />;
      default: return <AlertTriangle size={12} />;
    }
  };

  if (loading) {
    return (
      <div className="cads-content-wrapper">
        <div className="flex items-center justify-center h-64">
          <div className="cads-loading"></div>
          <span className="ml-3 text-white/70">Loading Intent Tokens...</span>
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
            { id: 'vault', label: 'Token Vault', icon: Key },
            { id: 'generator', label: 'Token Generator', icon: Plus },
            { id: 'qr', label: 'QR/Deep-Link', icon: QrCode },
            { id: 'revocations', label: 'Revocations', icon: XCircle }
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
          {activeTab === 'vault' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Intent Token Vault ({tokens.length})</h3>
                <div className="flex gap-2">
                  <button onClick={() => setShowTokenForm(true)} className="cads-action-button">
                    <Plus size={16} />
                    New Token
                  </button>
                  <button onClick={exportTokens} className="cads-action-button">
                    <Download size={16} />
                    Export
                  </button>
                  <button className="cads-action-button" aria-label="Refresh token list">
                    <RefreshCw size={16} />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="grid gap-4">
                {tokens.map(token => (
                  <motion.div
                    key={token.id}
                    className="cads-kpi-card"
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold">{token.name}</h4>
                          <span className={`cads-status-badge ${getStatusColor(token.status)}`}>
                            {getStatusIcon(token.status)}
                            {token.status.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                          <div>
                            <div className="text-white/60">Verb</div>
                            <div className="font-mono">{token.verb}</div>
                          </div>
                          <div>
                            <div className="text-white/60">Resource</div>
                            <div className="font-mono">{token.resource}</div>
                          </div>
                          <div>
                            <div className="text-white/60">Scope</div>
                            <div className="font-mono">{token.scope.join(', ')}</div>
                          </div>
                          <div>
                            <div className="text-white/60">Usage</div>
                            <div className="font-mono">
                              {token.usageCount}{token.maxUsage ? `/${token.maxUsage}` : ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-white/60">
                          <span>Created: {token.createdAt.toLocaleDateString()}</span>
                          <span>Expires: {token.expiresAt.toLocaleDateString()}</span>
                          {token.lastUsed && <span>Last used: {token.lastUsed.toLocaleString()}</span>}
                        </div>

                        {token.token && (
                          <div className="mt-3 p-3 bg-black/30 rounded border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">JWT Token</span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => toggleTokenVisibility(token.id)}
                                  className="text-white/60 hover:text-white"
                                  aria-label="Toggle token visibility"
                                >
                                  {showTokenValue.has(token.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                                <button
                                  onClick={() => copyToken(token.token!)}
                                  className="text-white/60 hover:text-white"
                                  aria-label="Copy token to clipboard"
                                >
                                  <Copy size={14} />
                                </button>
                              </div>
                            </div>
                            <div className="font-mono text-xs break-all">
                              {showTokenValue.has(token.id) 
                                ? token.token 
                                : token.token.replace(/./g, '•')
                              }
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => setSelectedToken(token)}
                          className="cads-action-button text-sm"
                          aria-label="View token details"
                        >
                          <Eye size={14} />
                          Details
                        </button>
                        {token.status === 'active' && (
                          <button
                            onClick={() => revokeToken(token.id)}
                            className="cads-action-button text-sm"
                            aria-label="Revoke token"
                          >
                            <XCircle size={14} />
                            Revoke
                          </button>
                        )}
                        <button className="cads-action-button text-sm" aria-label="Generate QR code for token">
                          <QrCode size={14} />
                          QR Code
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'generator' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold">Intent Token Generator</h3>

              <div className="cads-token-generator">
                <div className="cads-form-grid">
                  <div className="cads-form-group">
                    <label className="cads-form-label" htmlFor="token-name">Token Name</label>
                    <input
                      id="token-name"
                      type="text"
                      value={tokenForm.name}
                      onChange={(e) => setTokenForm(prev => ({ ...prev, name: e.target.value }))}
                      className="cads-form-input"
                      placeholder="e.g., Analytics Service Token"
                      title="Token Name"
                    />
                  </div>

                  <div className="cads-form-group">
                    <label className="cads-form-label" htmlFor="verb-select">Verb</label>
                    <select
                      id="verb-select"
                      value={tokenForm.verb}
                      onChange={(e) => setTokenForm(prev => ({ ...prev, verb: e.target.value }))}
                      className="cads-form-select"
                    >
                      {verbOptions.map(verb => (
                        <option key={verb} value={verb}>{verb}</option>
                      ))}
                    </select>
                  </div>

                  <div className="cads-form-group">
                    <label className="cads-form-label" htmlFor="resource-select">Resource</label>
                    <select
                      id="resource-select"
                      value={tokenForm.resource}
                      onChange={(e) => setTokenForm(prev => ({ ...prev, resource: e.target.value }))}
                      className="cads-form-select"
                    >
                      {resourceOptions.map(resource => (
                        <option key={resource} value={resource}>{resource}</option>
                      ))}
                    </select>
                  </div>

                  <div className="cads-form-group">
                    <label className="cads-form-label" htmlFor="ttl-input">TTL (seconds)</label>
                    <input
                      id="ttl-input"
                      type="number"
                      value={tokenForm.ttl}
                      onChange={(e) => setTokenForm(prev => ({ ...prev, ttl: parseInt(e.target.value) || 3600 }))}
                      className="cads-form-input"
                      min="60"
                      max="86400"
                      aria-label="Token time to live in seconds"
                    />
                  </div>

                  <div className="cads-form-group">
                    <label className="cads-form-label" htmlFor="max-usage-input">Max Usage (optional)</label>
                    <input
                      id="max-usage-input"
                      type="number"
                      value={tokenForm.maxUsage || ''}
                      onChange={(e) => setTokenForm(prev => ({ ...prev, maxUsage: e.target.value ? parseInt(e.target.value) : undefined }))}
                      className="cads-form-input"
                      placeholder="Unlimited"
                      min="1"
                      aria-label="Maximum usage limit for token"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="cads-form-group">
                    <label className="cads-form-label">Scope (select multiple)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {scopeOptions.map(scope => (
                        <label key={scope} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={tokenForm.scope.includes(scope)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTokenForm(prev => ({ ...prev, scope: [...prev.scope, scope] }));
                              } else {
                                setTokenForm(prev => ({ ...prev, scope: prev.scope.filter(s => s !== scope) }));
                              }
                            }}
                            className="rounded"
                            aria-label={`Include ${scope} permission scope`}
                          />
                          <span className="text-sm">{scope}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={tokenForm.requireDeviceBinding}
                        onChange={(e) => setTokenForm(prev => ({ ...prev, requireDeviceBinding: e.target.checked }))}
                        className="rounded"
                        aria-label="Require device binding for this token"
                      />
                      <span className="text-sm">Require Device Binding</span>
                    </label>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={generateToken}
                      className="cads-action-button bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                    >
                      <Key size={16} />
                      Generate Token
                    </button>
                    <button
                      onClick={() => setTokenForm({
                        name: '',
                        verb: 'execute',
                        resource: 'microcell',
                        scope: ['spawn'],
                        ttl: 3600,
                        requireDeviceBinding: false,
                        allowedIPs: []
                      })}
                      className="cads-action-button"
                    >
                      <RefreshCw size={16} />
                      Reset Form
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold">QR Code & Deep Links</h3>

              {generatedToken ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="cads-chart-container">
                    <h4 className="cads-chart-title">QR Code</h4>
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center">
                        <div className="text-black font-mono text-xs p-4">
                          QR Code<br/>
                          {generatedToken.name}<br/>
                          {generatedToken.id}
                        </div>
                      </div>
                      <button className="cads-action-button" aria-label="Download QR code as image">
                        <Download size={16} />
                        Download QR Code
                      </button>
                    </div>
                  </div>

                  <div className="cads-chart-container">
                    <h4 className="cads-chart-title">Deep Link</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" htmlFor="cads-deep-link">CADS Deep Link</label>
                        <div className="flex gap-2">
                          <input
                            id="cads-deep-link"
                            type="text"
                            value={`cads://token/${generatedToken.id}`}
                            readOnly
                            className="cads-form-input flex-1 font-mono text-sm"
                            placeholder="CADS deep link"
                            title="CADS deep link"
                          />
                          <button
                            onClick={() => copyToken(`cads://token/${generatedToken.id}`)}
                            className="cads-action-button"
                            aria-label="Copy CADS deep link"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" htmlFor="http-link">HTTP Link</label>
                        <div className="flex gap-2">
                          <input
                            id="http-link"
                            type="text"
                            value={`https://cads.uars7.com/token/${generatedToken.id}`}
                            readOnly
                            className="cads-form-input flex-1 font-mono text-sm"
                            aria-label="HTTP link for token access"
                          />
                          <button
                            onClick={() => copyToken(`https://cads.uars7.com/token/${generatedToken.id}`)}
                            className="cads-action-button"
                            aria-label="Copy HTTP link"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded">
                        <div className="flex items-start gap-2">
                          <Shield size={16} className="text-yellow-400 mt-0.5" />
                          <div className="text-sm">
                            <div className="font-semibold text-yellow-400">Security Notice</div>
                            <div className="text-white/80">
                              This token grants access to {generatedToken.verb} operations on {generatedToken.resource}. 
                              Only share with authorized devices and applications.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <QrCode size={48} className="mx-auto text-white/40 mb-4" />
                  <p className="text-white/60 mb-4">No token selected for QR generation</p>
                  <button
                    onClick={() => setActiveTab('generator')}
                    className="cads-action-button"
                  >
                    Generate New Token
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'revocations' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold">Token Revocations</h3>

              <div className="cads-chart-container">
                <h4 className="cads-chart-title">Bulk Revocation</h4>
                <div className="space-y-4">
                  <div className="cads-form-group">
                    <label className="cads-form-label" htmlFor="revoke-pattern">Revoke by Pattern</label>
                    <input
                      id="revoke-pattern"
                      type="text"
                      placeholder="e.g., Analytics* or *test*"
                      className="cads-form-input"
                      aria-label="Pattern to match tokens for bulk revocation"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button className="cads-action-button" aria-label="Revoke all matching tokens">
                      <XCircle size={16} />
                      Revoke Matching
                    </button>
                    <button className="cads-action-button" aria-label="Revoke all expired tokens">
                      <Clock size={16} />
                      Revoke Expired
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Recently Revoked Tokens</h4>
                {tokens.filter(token => token.status === 'revoked').map(token => (
                  <div key={token.id} className="cads-kpi-card opacity-60">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-semibold">{token.name}</h5>
                        <p className="text-sm text-white/60">
                          {token.verb} {token.resource} • Revoked
                        </p>
                      </div>
                      <div className="text-sm text-white/60">
                        Created: {token.createdAt.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Token Details Modal */}
      <AnimatePresence>
        {selectedToken && (
          <motion.div
            className="cads-inspector-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedToken(null)}
          >
            <motion.div
              className="cads-inspector-drawer"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedToken(null)}
                className="cads-inspector-close"
              >
                ×
              </button>

              <div className="cads-inspector-header">
                <h3 className="cads-inspector-title">{selectedToken.name}</h3>
              </div>

              <div className="space-y-6">
                <div className="cads-metric-grid">
                  <div className="cads-metric-item">
                    <div className="cads-metric-label">Token ID</div>
                    <div className="cads-metric-value text-base font-mono">{selectedToken.id}</div>
                  </div>
                  <div className="cads-metric-item">
                    <div className="cads-metric-label">Status</div>
                    <div className={`cads-metric-value text-base ${getStatusColor(selectedToken.status)}`}>
                      {selectedToken.status.toUpperCase()}
                    </div>
                  </div>
                  <div className="cads-metric-item">
                    <div className="cads-metric-label">Usage Count</div>
                    <div className="cads-metric-value text-base">
                      {selectedToken.usageCount}{selectedToken.maxUsage ? `/${selectedToken.maxUsage}` : ''}
                    </div>
                  </div>
                  <div className="cads-metric-item">
                    <div className="cads-metric-label">TTL</div>
                    <div className="cads-metric-value text-base">{selectedToken.ttl}s</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h5 className="font-semibold mb-2">Permissions</h5>
                    <div className="text-sm space-y-1">
                      <div>Verb: <span className="font-mono">{selectedToken.verb}</span></div>
                      <div>Resource: <span className="font-mono">{selectedToken.resource}</span></div>
                      <div>Scope: <span className="font-mono">{selectedToken.scope.join(', ')}</span></div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold mb-2">Timestamps</h5>
                    <div className="text-sm space-y-1">
                      <div>Created: {selectedToken.createdAt.toLocaleString()}</div>
                      <div>Expires: {selectedToken.expiresAt.toLocaleString()}</div>
                      {selectedToken.lastUsed && (
                        <div>Last Used: {selectedToken.lastUsed.toLocaleString()}</div>
                      )}
                    </div>
                  </div>

                  {selectedToken.deviceBinding && (
                    <div>
                      <h5 className="font-semibold mb-2">Device Binding</h5>
                      <div className="text-sm font-mono">{selectedToken.deviceBinding}</div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IntentTokens;
