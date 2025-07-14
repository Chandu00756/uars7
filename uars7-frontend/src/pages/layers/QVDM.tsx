import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Atom, 
  Activity, 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Target,
  Zap
} from 'lucide-react';

const QVDM: React.FC = () => {
  const [quantumMetrics, setQuantumMetrics] = useState({
    coherence: 0,
    entanglement: 0,
    fidelity: 0,
    threats: 0,
    variants: 0
  });
  const [forgeSource, setForgeSource] = useState("");
  const [forgeSeeds, setForgeSeeds] = useState(1);
  const [forgeResult, setForgeResult] = useState<string[]>([]);
  const [voteResults, setVoteResults] = useState<string>("");
  const [voteInput, setVoteInput] = useState<string>("");
  const [voteQuorum, setVoteQuorum] = useState<string>("");
  const [loadingForge, setLoadingForge] = useState(false);
  const [loadingVote, setLoadingVote] = useState(false);

  // Fetch metrics from backend (simulate with healthz)
  useEffect(() => {
    fetch("http://localhost:8082/healthz")
      .then(res => res.ok ? setQuantumMetrics(prev => ({ ...prev, coherence: 90, entanglement: 95, fidelity: 98, threats: 12, variants: 42 })) : null)
      .catch(() => {});
  }, []);

  const handleForge = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingForge(true);
    setForgeResult([]);
    try {
      const res = await fetch("http://localhost:8082/forge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: forgeSource, seeds: forgeSeeds })
      });
      if (res.ok) {
        const data = await res.json();
        setForgeResult(data);
      } else {
        setForgeResult(["Error forging variants"]);
      }
    } catch {
      setForgeResult(["Network error"]);
    }
    setLoadingForge(false);
  };

  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingVote(true);
    setVoteQuorum("");
    try {
      const resultsArr = voteInput.split(",").map(s => s.trim()).filter(Boolean);
      const res = await fetch("http://localhost:8082/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results: resultsArr })
      });
      if (res.ok) {
        const data = await res.json();
        setVoteQuorum(data.quorum);
      } else {
        setVoteQuorum("Error computing quorum");
      }
    } catch {
      setVoteQuorum("Network error");
    }
    setLoadingVote(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="portal-qvdm-page"
    >
      {/* Header */}
      <div className="portal-page-header portal-mb-6">
        <h1 className="portal-text-3xl portal-font-bold portal-mb-2">
          <Brain className="portal-inline portal-mr-2" size={32} />
          Quantum Variant Detection Matrix (QVDM)
        </h1>
        <p className="portal-text-secondary">
          Advanced quantum-enhanced threat detection and variant analysis system
        </p>
      </div>

      {/* Quantum State Overview */}
      <div className="portal-grid portal-grid-cols-1 portal-md:portal-grid-cols-3 portal-gap-6 portal-mb-8">
        <motion.div
          className="portal-stat-card portal-bg-surface portal-rounded-lg portal-p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          <div className="portal-flex portal-items-center portal-gap-3 portal-mb-2">
            <Atom size={24} className="portal-text-accent" />
            <h3 className="portal-text-lg portal-font-semibold">Quantum Coherence</h3>
          </div>
          <p className="portal-text-3xl portal-font-bold">{quantumMetrics.coherence.toFixed(1)}%</p>
          <p className="portal-text-sm portal-text-success">↑ Stable quantum state</p>
        </motion.div>

        <motion.div
          className="portal-stat-card portal-bg-surface portal-rounded-lg portal-p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="portal-flex portal-items-center portal-gap-3 portal-mb-2">
            <Target size={24} className="portal-text-success" />
            <h3 className="portal-text-lg portal-font-semibold">Entanglement</h3>
          </div>
          <p className="portal-text-3xl portal-font-bold">{quantumMetrics.entanglement.toFixed(1)}%</p>
          <p className="portal-text-sm portal-text-success">Optimal correlation</p>
        </motion.div>

        <motion.div
          className="portal-stat-card portal-bg-surface portal-rounded-lg portal-p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="portal-flex portal-items-center portal-gap-3 portal-mb-2">
            <CheckCircle size={24} className="portal-text-success" />
            <h3 className="portal-text-lg portal-font-semibold">Detection Fidelity</h3>
          </div>
          <p className="portal-text-3xl portal-font-bold">{quantumMetrics.fidelity.toFixed(1)}%</p>
          <p className="portal-text-sm portal-text-success">High accuracy</p>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="portal-grid portal-grid-cols-1 portal-lg:portal-grid-cols-2 portal-gap-8">
        
        {/* Quantum Detection Matrix */}
        <div className="portal-bg-surface portal-rounded-lg portal-p-6">
          <h2 className="portal-text-xl portal-font-semibold portal-mb-6">Quantum Detection Matrix</h2>
          
          <div className="portal-quantum-matrix portal-bg-secondary portal-bg-opacity-10 portal-rounded-lg portal-p-6 portal-h-64 portal-mb-6">
            <div className="portal-flex portal-items-center portal-justify-center portal-h-full">
              <div className="portal-text-center">
                <div className="portal-relative portal-mb-4">
                  <Atom size={48} className="portal-text-accent portal-animate-pulse" />
                  <div className="portal-absolute portal-inset-0 portal-animate-spin portal-duration-[10s]">
                    <div className="portal-w-16 portal-h-16 portal-border-2 portal-border-accent portal-border-dashed portal-rounded-full"></div>
                  </div>
                </div>
                <h3 className="portal-text-lg portal-font-semibold portal-mb-2">Quantum Field Active</h3>
                <p className="portal-text-sm portal-text-secondary">
                  Monitoring {quantumMetrics.threats} active threats across quantum dimensions
                </p>
              </div>
            </div>
          </div>

          <div className="portal-grid portal-grid-cols-2 portal-gap-4">
            <div className="portal-text-center portal-p-4 portal-bg-secondary portal-bg-opacity-10 portal-rounded">
              <div className="portal-text-2xl portal-font-bold portal-text-warning">{quantumMetrics.threats}</div>
              <div className="portal-text-sm portal-text-secondary">Active Threats</div>
            </div>
            <div className="portal-text-center portal-p-4 portal-bg-secondary portal-bg-opacity-10 portal-rounded">
              <div className="portal-text-2xl portal-font-bold portal-text-accent">{quantumMetrics.variants}</div>
              <div className="portal-text-sm portal-text-secondary">Variants Detected</div>
            </div>
          </div>
        </div>

        {/* Quantum Threats */}
        <div className="portal-bg-surface portal-rounded-lg portal-p-6">
          <h2 className="portal-text-xl portal-font-semibold portal-mb-6">Recent Quantum Threats</h2>
          
          <div className="portal-space-y-4">
            {[
              { id: 1, name: 'Quantum-Resistant Malware', severity: 'high', time: '14:32:15' },
              { id: 2, name: 'Entanglement Exploit', severity: 'medium', time: '14:28:42' },
              { id: 3, name: 'Superposition Breach', severity: 'critical', time: '14:25:18' },
              { id: 4, name: 'Decoherence Attack', severity: 'low', time: '14:22:55' }
            ].map((threat, index) => (
              <motion.div
                key={threat.id}
                className="portal-threat-card portal-border portal-rounded-lg portal-p-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <div className="portal-flex portal-items-center portal-justify-between portal-mb-2">
                  <h3 className="portal-font-semibold">{threat.name}</h3>
                  <span className={`portal-px-2 portal-py-1 portal-rounded portal-text-xs ${
                    threat.severity === 'critical' ? 'portal-bg-error portal-text-white' :
                    threat.severity === 'high' ? 'portal-bg-warning portal-text-white' :
                    threat.severity === 'medium' ? 'portal-bg-accent portal-text-white' :
                    'portal-bg-success portal-text-white'
                  }`}>
                    {threat.severity.toUpperCase()}
                  </span>
                </div>
                
                <div className="portal-flex portal-items-center portal-justify-between portal-text-sm portal-text-secondary">
                  <span className="portal-flex portal-items-center portal-gap-1">
                    <Clock size={14} />
                    {threat.time}
                  </span>
                  <div className="portal-flex portal-gap-2">
                    <button className="portal-btn portal-btn-sm portal-btn-secondary">
                      <Activity size={12} />
                      Analyze
                    </button>
                    <button className="portal-btn portal-btn-sm portal-btn-primary">
                      <Shield size={12} />
                      Mitigate
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Quantum API Integration */}
      <div className="portal-mt-8 portal-bg-surface portal-rounded-lg portal-p-6">
        <h2 className="portal-text-xl portal-font-semibold portal-mb-6">QVDM Backend Integration</h2>
        <div className="portal-grid portal-grid-cols-1 portal-md:portal-grid-cols-2 portal-gap-8">
          {/* Forge Form */}
          <form onSubmit={handleForge} className="portal-space-y-4 portal-bg-secondary portal-bg-opacity-10 portal-rounded-lg portal-p-6">
            <h3 className="portal-font-semibold portal-mb-2">Forge Variants</h3>
            <label htmlFor="forge-source" className="portal-block portal-mb-1 portal-text-sm portal-font-medium">Source file</label>
            <input id="forge-source" type="text" value={forgeSource} onChange={e => setForgeSource(e.target.value)} placeholder="Source file (e.g. main.go)" className="portal-input portal-w-full" required />
            <label htmlFor="forge-seeds" className="portal-block portal-mb-1 portal-text-sm portal-font-medium">Number of seeds</label>
            <input id="forge-seeds" type="number" value={forgeSeeds} onChange={e => setForgeSeeds(Number(e.target.value))} min={1} max={10} className="portal-input portal-w-full" required />
            <button type="submit" className="portal-btn portal-btn-primary" disabled={loadingForge}>{loadingForge ? "Forging..." : "Forge"}</button>
            {forgeResult.length > 0 && (
              <div className="portal-mt-2">
                <strong>Result:</strong>
                <ul className="portal-list-disc portal-ml-4">
                  {forgeResult.map((v, i) => <li key={i}>{v}</li>)}
                </ul>
              </div>
            )}
          </form>
          {/* Vote Form */}
          <form onSubmit={handleVote} className="portal-space-y-4 portal-bg-secondary portal-bg-opacity-10 portal-rounded-lg portal-p-6">
            <h3 className="portal-font-semibold portal-mb-2">Vote Quorum</h3>
            <label htmlFor="vote-input" className="portal-block portal-mb-1 portal-text-sm portal-font-medium">Results</label>
            <input id="vote-input" type="text" value={voteInput} onChange={e => setVoteInput(e.target.value)} placeholder="Comma-separated results (e.g. A,B,A,C)" className="portal-input portal-w-full" required />
            <button type="submit" className="portal-btn portal-btn-primary" disabled={loadingVote}>{loadingVote ? "Voting..." : "Vote"}</button>
            {voteQuorum && (
              <div className="portal-mt-2">
                <strong>Quorum:</strong> {voteQuorum}
              </div>
            )}
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default QVDM;
