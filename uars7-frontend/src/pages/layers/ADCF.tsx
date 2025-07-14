import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Shield, 
  Activity, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Eye, 
  Lock, 
  Cpu, 
  Database, 
  Network, 
  Play, 
  Pause, 
  RotateCcw,
  Target,
  Layers,
  Command
} from 'lucide-react';

const ADCF: React.FC = () => {
  // Backend integration state
  const [mintData, setMintData] = useState("");
  const [mintPolicy, setMintPolicy] = useState("");
  const [mintResult, setMintResult] = useState<string>("");
  const [accessId, setAccessId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [accessResult, setAccessResult] = useState<string>("");
  const [revokeId, setRevokeId] = useState("");
  const [revokeResult, setRevokeResult] = useState<string>("");
  const [loadingMint, setLoadingMint] = useState(false);
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [loadingRevoke, setLoadingRevoke] = useState(false);

  // Helper: base64 encode
  const b64 = (str: string) => window.btoa(unescape(encodeURIComponent(str)));

  // Mint capsule
  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingMint(true);
    setMintResult("");
    try {
      const res = await fetch("http://localhost:8080/capsule/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: b64(mintData), policy: b64(mintPolicy) })
      });
      const json = await res.json();
      setMintResult(res.ok ? `Capsule ID: ${json.id}` : `Error: ${json.error || JSON.stringify(json)}`);
    } catch (err) {
      setMintResult("Network error");
    }
    setLoadingMint(false);
  };

  // Access capsule
  const handleAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAccess(true);
    setAccessResult("");
    try {
      const res = await fetch(`http://localhost:8080/capsule/access?id=${encodeURIComponent(accessId)}`, {
        method: "GET",
        headers: { "X-Intent-Token": accessToken }
      });
      if (res.ok) {
        const data = await res.text();
        setAccessResult(data);
      } else {
        setAccessResult("Access denied or error");
      }
    } catch (err) {
      setAccessResult("Network error");
    }
    setLoadingAccess(false);
  };

  // Revoke capsule
  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingRevoke(true);
    setRevokeResult("");
    try {
      const res = await fetch(`http://localhost:8080/capsule/revoke?id=${encodeURIComponent(revokeId)}`, {
        method: "POST",
        headers: { "X-Owner-ID": "owner" }
      });
      const text = await res.text();
      setRevokeResult(res.ok ? text : "Error revoking capsule");
    } catch (err) {
      setRevokeResult("Network error");
    }
    setLoadingRevoke(false);
  };
  const [autoDefenseEnabled, setAutoDefenseEnabled] = useState(true);
  const [defenseMode, setDefenseMode] = useState<'passive' | 'active' | 'aggressive'>('active');
  const [lastAction, setLastAction] = useState(new Date());

  // Simulated real-time data
  const [metrics, setMetrics] = useState({
    threatsBlocked: 1247,
    rulesActive: 89,
    responseTime: 0.3,
    efficiency: 97.8
  });

  const [defenseRules, setDefenseRules] = useState([
    { id: 1, name: 'SQL Injection Prevention', status: 'active', priority: 'high', triggers: 156 },
    { id: 2, name: 'DDoS Mitigation', status: 'active', priority: 'critical', triggers: 23 },
    { id: 3, name: 'Malware Detection', status: 'active', priority: 'high', triggers: 89 },
    { id: 4, name: 'Intrusion Prevention', status: 'standby', priority: 'medium', triggers: 12 },
    { id: 5, name: 'Zero-day Protection', status: 'active', priority: 'critical', triggers: 7 },
    { id: 6, name: 'Behavioral Analysis', status: 'active', priority: 'medium', triggers: 234 }
  ]);

  const [recentActions, setRecentActions] = useState([
    { id: 1, timestamp: '22:45:30', action: 'Blocked SQL injection attempt', source: '203.0.113.5', severity: 'high' },
    { id: 2, timestamp: '22:44:15', action: 'Activated DDoS protection', source: 'Multiple IPs', severity: 'critical' },
    { id: 3, timestamp: '22:43:02', action: 'Quarantined suspicious file', source: '192.168.1.45', severity: 'medium' },
    { id: 4, timestamp: '22:42:45', action: 'Updated threat signatures', source: 'System', severity: 'low' },
    { id: 5, timestamp: '22:41:30', action: 'Blocked port scan', source: '198.51.100.3', severity: 'medium' }
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        threatsBlocked: prev.threatsBlocked + Math.floor(Math.random() * 3),
        rulesActive: prev.rulesActive + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0),
        responseTime: Math.max(0.1, prev.responseTime + (Math.random() - 0.5) * 0.1),
        efficiency: Math.max(90, Math.min(100, prev.efficiency + (Math.random() - 0.5) * 2))
      }));
      setLastAction(new Date());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const toggleDefenseRule = (ruleId: number) => {
    setDefenseRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, status: rule.status === 'active' ? 'standby' : 'active' }
        : rule
    ));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'portal-text-error';
      case 'high': return 'portal-text-warning';
      case 'medium': return 'portal-text-accent';
      default: return 'portal-text-success';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'portal-text-error';
      case 'high': return 'portal-text-warning';
      case 'medium': return 'portal-text-accent';
      default: return 'portal-text-success';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="portal-adcf-page"
    >
      {/* Header */}
      <div className="portal-page-header portal-mb-6">
        <h1 className="portal-text-3xl portal-font-bold portal-mb-2 portal-flex portal-items-center portal-gap-3">
          <Settings size={32} className="portal-text-accent" />
          Autonomous Defense Control Framework (ADCF)
        </h1>
        <p className="portal-text-secondary">
          Intelligent autonomous defense system with real-time threat response and adaptive security controls
        </p>
      </div>

      {/* ADCF Capsule Operations */}
      <div className="portal-control-panel portal-bg-surface portal-rounded-xl portal-p-6 portal-shadow-md portal-mb-6">
        <h2 className="portal-text-xl portal-font-semibold portal-mb-4">ADCF Capsule Operations</h2>
        <div className="portal-grid portal-grid-cols-1 portal-md:portal-grid-cols-3 portal-gap-6">
          {/* Mint Capsule */}
          <form onSubmit={handleMint} className="portal-space-y-4 portal-bg-secondary portal-bg-opacity-10 portal-rounded-lg portal-p-6">
            <h3 className="portal-font-semibold portal-mb-2">Mint Capsule</h3>
            <label htmlFor="mint-data" className="portal-block portal-mb-1 portal-text-sm portal-font-medium">Data</label>
            <input id="mint-data" type="text" value={mintData} onChange={e => setMintData(e.target.value)} className="portal-input portal-w-full" required />
            <label htmlFor="mint-policy" className="portal-block portal-mb-1 portal-text-sm portal-font-medium">Policy (JSON)</label>
            <input id="mint-policy" type="text" value={mintPolicy} onChange={e => setMintPolicy(e.target.value)} className="portal-input portal-w-full" required />
            <button type="submit" className="portal-btn portal-btn-primary" disabled={loadingMint}>{loadingMint ? "Minting..." : "Mint"}</button>
            {mintResult && <div className="portal-mt-2"><strong>Result:</strong> {mintResult}</div>}
          </form>
          {/* Access Capsule */}
          <form onSubmit={handleAccess} className="portal-space-y-4 portal-bg-secondary portal-bg-opacity-10 portal-rounded-lg portal-p-6">
            <h3 className="portal-font-semibold portal-mb-2">Access Capsule</h3>
            <label htmlFor="access-id" className="portal-block portal-mb-1 portal-text-sm portal-font-medium">Capsule ID</label>
            <input id="access-id" type="text" value={accessId} onChange={e => setAccessId(e.target.value)} className="portal-input portal-w-full" required />
            <label htmlFor="access-token" className="portal-block portal-mb-1 portal-text-sm portal-font-medium">Intent Token</label>
            <input id="access-token" type="text" value={accessToken} onChange={e => setAccessToken(e.target.value)} className="portal-input portal-w-full" required />
            <button type="submit" className="portal-btn portal-btn-primary" disabled={loadingAccess}>{loadingAccess ? "Accessing..." : "Access"}</button>
            {accessResult && <div className="portal-mt-2"><strong>Result:</strong> {accessResult}</div>}
          </form>
          {/* Revoke Capsule */}
          <form onSubmit={handleRevoke} className="portal-space-y-4 portal-bg-secondary portal-bg-opacity-10 portal-rounded-lg portal-p-6">
            <h3 className="portal-font-semibold portal-mb-2">Revoke Capsule</h3>
            <label htmlFor="revoke-id" className="portal-block portal-mb-1 portal-text-sm portal-font-medium">Capsule ID</label>
            <input id="revoke-id" type="text" value={revokeId} onChange={e => setRevokeId(e.target.value)} className="portal-input portal-w-full" required />
            <button type="submit" className="portal-btn portal-btn-primary" disabled={loadingRevoke}>{loadingRevoke ? "Revoking..." : "Revoke"}</button>
            {revokeResult && <div className="portal-mt-2"><strong>Result:</strong> {revokeResult}</div>}
          </form>
        </div>
      </div>

      {/* Last Action */}
      <div className="portal-control-group portal-mb-6">
        <label className="portal-text-sm portal-font-semibold portal-mb-2 portal-block">
          Last Action
        </label>
        <div className="portal-flex portal-items-center portal-gap-2 portal-text-sm">
          <Clock size={16} className="portal-text-accent" />
          <span>{lastAction.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="portal-metrics-grid portal-grid portal-grid-cols-1 portal-md:portal-grid-cols-2 portal-lg:portal-grid-cols-4 portal-gap-6 portal-mb-6">
        <motion.div
          className="portal-metric-card portal-bg-surface portal-rounded-lg portal-p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          <div className="portal-flex portal-items-center portal-justify-between portal-mb-2">
            <Shield size={24} className="portal-text-success" />
            <TrendingUp size={16} className="portal-text-success" />
          </div>
          <h3 className="portal-text-2xl portal-font-bold portal-mb-1">{metrics.threatsBlocked.toLocaleString()}</h3>
          <p className="portal-text-sm portal-text-secondary">Threats Blocked</p>
        </motion.div>

        <motion.div
          className="portal-metric-card portal-bg-surface portal-rounded-lg portal-p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="portal-flex portal-items-center portal-justify-between portal-mb-2">
            <Target size={24} className="portal-text-accent" />
            <Activity size={16} className="portal-text-accent" />
          </div>
          <h3 className="portal-text-2xl portal-font-bold portal-mb-1">{metrics.rulesActive}</h3>
          <p className="portal-text-sm portal-text-secondary">Active Rules</p>
        </motion.div>

        <motion.div
          className="portal-metric-card portal-bg-surface portal-rounded-lg portal-p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="portal-flex portal-items-center portal-justify-between portal-mb-2">
            <Zap size={24} className="portal-text-warning" />
            <Clock size={16} className="portal-text-warning" />
          </div>
          <h3 className="portal-text-2xl portal-font-bold portal-mb-1">{metrics.responseTime.toFixed(1)}s</h3>
          <p className="portal-text-sm portal-text-secondary">Response Time</p>
        </motion.div>

        <motion.div
          className="portal-metric-card portal-bg-surface portal-rounded-lg portal-p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="portal-flex portal-items-center portal-justify-between portal-mb-2">
            <CheckCircle size={24} className="portal-text-success" />
            <TrendingUp size={16} className="portal-text-success" />
          </div>
          <h3 className="portal-text-2xl portal-font-bold portal-mb-1">{metrics.efficiency.toFixed(1)}%</h3>
          <p className="portal-text-sm portal-text-secondary">Efficiency</p>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="portal-grid portal-grid-cols-1 portal-lg:portal-grid-cols-2 portal-gap-6">
        {/* Defense Rules */}
        <div className="portal-defense-rules portal-bg-surface portal-rounded-lg portal-p-6">
          <div className="portal-flex portal-items-center portal-justify-between portal-mb-4">
            <h3 className="portal-text-xl portal-font-semibold portal-flex portal-items-center portal-gap-2">
              <Layers size={20} />
              Defense Rules
            </h3>
            <button className="portal-btn portal-btn-secondary portal-btn-sm">
              <Command size={14} />
              Manage
            </button>
          </div>

          <div className="portal-space-y-3">
            {defenseRules.map((rule, index) => (
              <motion.div
                key={rule.id}
                className="portal-rule-item portal-flex portal-items-center portal-justify-between portal-p-3 portal-bg-secondary portal-bg-opacity-20 portal-rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <div className="portal-flex-1">
                  <div className="portal-flex portal-items-center portal-gap-2 portal-mb-1">
                    <h4 className="portal-text-sm portal-font-semibold">{rule.name}</h4>
                    <span className={`portal-text-xs portal-font-medium ${getPriorityColor(rule.priority)}`}>
                      {rule.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className="portal-flex portal-items-center portal-gap-4 portal-text-xs portal-text-secondary">
                    <span>Triggers: {rule.triggers}</span>
                    <span className={`portal-flex portal-items-center portal-gap-1 ${
                      rule.status === 'active' ? 'portal-text-success' : 'portal-text-warning'
                    }`}>
                      <div className={`portal-w-2 portal-h-2 portal-rounded-full ${
                        rule.status === 'active' ? 'portal-bg-success' : 'portal-bg-warning'
                      }`} />
                      {rule.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleDefenseRule(rule.id)}
                  className={`portal-px-3 portal-py-1 portal-rounded portal-text-xs portal-font-medium portal-transition-all ${
                    rule.status === 'active'
                      ? 'portal-bg-success portal-text-white hover:portal-bg-success-dark'
                      : 'portal-bg-warning portal-text-white hover:portal-bg-warning-dark'
                  }`}
                >
                  {rule.status === 'active' ? 'Active' : 'Standby'}
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Actions */}
        <div className="portal-recent-actions portal-bg-surface portal-rounded-lg portal-p-6">
          <div className="portal-flex portal-items-center portal-justify-between portal-mb-4">
            <h3 className="portal-text-xl portal-font-semibold portal-flex portal-items-center portal-gap-2">
              <Activity size={20} />
              Recent Actions
            </h3>
            <button className="portal-btn portal-btn-secondary portal-btn-sm">
              <Eye size={14} />
              View All
            </button>
          </div>

          <div className="portal-space-y-3 portal-max-h-80 portal-overflow-y-auto">
            {recentActions.map((action, index) => (
              <motion.div
                key={action.id}
                className="portal-action-item portal-flex portal-items-start portal-gap-3 portal-p-3 portal-bg-secondary portal-bg-opacity-10 portal-rounded-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <div className={`portal-w-2 portal-h-2 portal-rounded-full portal-mt-2 portal-flex-shrink-0 ${
                  action.severity === 'critical' ? 'portal-bg-error' :
                  action.severity === 'high' ? 'portal-bg-warning' :
                  action.severity === 'medium' ? 'portal-bg-accent' :
                  'portal-bg-success'
                }`} />
                <div className="portal-flex-1 portal-min-w-0">
                  <p className="portal-text-sm portal-font-medium portal-mb-1">{action.action}</p>
                  <div className="portal-flex portal-items-center portal-gap-4 portal-text-xs portal-text-secondary">
                    <span className="portal-flex portal-items-center portal-gap-1">
                      <Clock size={12} />
                      {action.timestamp}
                    </span>
                    <span className="portal-flex portal-items-center portal-gap-1">
                      <Network size={12} />
                      {action.source}
                    </span>
                    <span className={`portal-font-medium ${getSeverityColor(action.severity)}`}>
                      {action.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* System Architecture Overview */}
      <div className="portal-architecture-overview portal-bg-surface portal-rounded-lg portal-p-6 portal-mt-6">
        <h3 className="portal-text-xl portal-font-semibold portal-mb-4 portal-flex portal-items-center portal-gap-2">
          <Database size={20} />
          ADCF Architecture
        </h3>
        
        <div className="portal-grid portal-grid-cols-1 portal-md:portal-grid-cols-3 portal-gap-6">
          <div className="portal-arch-component portal-text-center portal-p-4 portal-border portal-rounded-lg">
            <Cpu size={32} className="portal-text-accent portal-mx-auto portal-mb-2" />
            <h4 className="portal-font-semibold portal-mb-2">Decision Engine</h4>
            <p className="portal-text-sm portal-text-secondary">
              AI-powered threat analysis and response decision making
            </p>
          </div>
          
          <div className="portal-arch-component portal-text-center portal-p-4 portal-border portal-rounded-lg">
            <Shield size={32} className="portal-text-success portal-mx-auto portal-mb-2" />
            <h4 className="portal-font-semibold portal-mb-2">Defense Modules</h4>
            <p className="portal-text-sm portal-text-secondary">
              Modular defense components for different threat types
            </p>
          </div>
          
          <div className="portal-arch-component portal-text-center portal-p-4 portal-border portal-rounded-lg">
            <Network size={32} className="portal-text-warning portal-mx-auto portal-mb-2" />
            <h4 className="portal-font-semibold portal-mb-2">Integration Layer</h4>
            <p className="portal-text-sm portal-text-secondary">
              Seamless integration with other UARS VII layers
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ADCF;
