import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  Square,
  RotateCcw,
  Download,
  Upload,
  Play,
  Pause,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
  Cpu,
  MemoryStick
} from 'lucide-react';

interface LiveCell {
  id: string;
  intent: string;
  spawnLatency: number;
  memoryUsage: number[];
  riskScore: number;
  state: 'running' | 'completed' | 'quarantined' | 'pending';
  timestamp: Date;
  ttl: number;
  userAgent: string;
  sourceIP: string;
  lastActivity: Date;
}

interface CellDetailsModalProps {
  cell: LiveCell | null;
  isOpen: boolean;
  onClose: () => void;
}

const LiveCells: React.FC = () => {
  const [cells, setCells] = useState<LiveCell[]>([]);
  const [filteredCells, setFilteredCells] = useState<LiveCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'id' | 'latency' | 'memory' | 'risk' | 'timestamp'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedCell, setSelectedCell] = useState<LiveCell | null>(null);
  const [bulkSelection, setBulkSelection] = useState<Set<string>>(new Set());

  // Generate realistic cell data
  const generateCellData = useCallback((): LiveCell[] => {
    const intentTypes = [
      'execute.wasm.sandbox',
      'validate.transaction.ledger',
      'analyze.threat.vector',
      'encrypt.data.stream',
      'authenticate.user.session',
      'monitor.network.traffic',
      'process.ml.inference',
      'backup.critical.data'
    ];

    const userAgents = [
      'CADS-Client/1.0',
      'SecurityBot/2.1',
      'ThreatHunter/3.0',
      'AnalyticsEngine/1.5',
      'MonitoringSystem/2.0'
    ];

    const generateMemorySparkline = () => {
      const points = [];
      let current = 20 + Math.random() * 30;
      for (let i = 0; i < 20; i++) {
        current += (Math.random() - 0.5) * 10;
        current = Math.max(5, Math.min(80, current));
        points.push(Math.round(current));
      }
      return points;
    };

    return Array.from({ length: 50 }, (_, i) => {
      const now = new Date();
      const createdMinutesAgo = Math.random() * 120;
      const timestamp = new Date(now.getTime() - createdMinutesAgo * 60000);
      
      return {
        id: `cell-${Math.random().toString(36).substr(2, 8)}`,
        intent: intentTypes[Math.floor(Math.random() * intentTypes.length)],
        spawnLatency: Math.round(5 + Math.random() * 50),
        memoryUsage: generateMemorySparkline(),
        riskScore: Math.round(Math.random() * 100),
        state: ['running', 'completed', 'quarantined', 'pending'][Math.floor(Math.random() * 4)] as any,
        timestamp,
        ttl: Math.round(300 + Math.random() * 1800), // 5-35 minutes
        userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
        sourceIP: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        lastActivity: new Date(timestamp.getTime() + Math.random() * 60000)
      };
    });
  }, []);

  // Load cells data
  useEffect(() => {
    const loadCells = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        const newCells = generateCellData();
        setCells(newCells);
      } catch (error) {
        console.error('Failed to load cells:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCells();
  }, [generateCellData]);

  // Auto-refresh cells
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Update existing cells with new data
      setCells(prevCells => {
        const updatedCells = prevCells.map(cell => ({
          ...cell,
          memoryUsage: [...cell.memoryUsage.slice(1), 20 + Math.random() * 40],
          lastActivity: new Date(),
          riskScore: Math.max(0, Math.min(100, cell.riskScore + (Math.random() - 0.5) * 10))
        }));

        // Occasionally add new cells or remove completed ones
        if (Math.random() < 0.3) {
          const newCell = generateCellData()[0];
          updatedCells.push(newCell);
        }

        if (Math.random() < 0.2 && updatedCells.length > 20) {
          const indexToRemove = Math.floor(Math.random() * updatedCells.length);
          updatedCells.splice(indexToRemove, 1);
        }

        return updatedCells.slice(0, 50); // Keep max 50 cells
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [autoRefresh, generateCellData]);

  // Filter and sort cells
  useEffect(() => {
    let filtered = cells.filter(cell => {
      const matchesSearch = cell.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           cell.intent.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           cell.sourceIP.includes(searchTerm);
      
      const matchesFilter = filterState === 'all' || cell.state === filterState;
      
      return matchesSearch && matchesFilter;
    });

    // Sort cells
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'id':
          comparison = a.id.localeCompare(b.id);
          break;
        case 'latency':
          comparison = a.spawnLatency - b.spawnLatency;
          break;
        case 'memory':
          comparison = a.memoryUsage[a.memoryUsage.length - 1] - b.memoryUsage[b.memoryUsage.length - 1];
          break;
        case 'risk':
          comparison = a.riskScore - b.riskScore;
          break;
        case 'timestamp':
        default:
          comparison = a.timestamp.getTime() - b.timestamp.getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredCells(filtered);
  }, [cells, searchTerm, filterState, sortBy, sortOrder]);

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleCellAction = async (cellId: string, action: 'inspect' | 'terminate' | 'rollback') => {
    const cell = cells.find(c => c.id === cellId);
    if (!cell) return;

    switch (action) {
      case 'inspect':
        setSelectedCell(cell);
        break;
      case 'terminate':
        if (confirm(`Are you sure you want to terminate cell ${cellId}?`)) {
          setCells(prev => prev.filter(c => c.id !== cellId));
        }
        break;
      case 'rollback':
        if (confirm(`Are you sure you want to rollback cell ${cellId}?`)) {
          setCells(prev => prev.map(c => 
            c.id === cellId ? { ...c, state: 'pending' as const } : c
          ));
        }
        break;
    }
  };

  const handleBulkAction = (action: 'terminate' | 'export') => {
    if (bulkSelection.size === 0) return;

    switch (action) {
      case 'terminate':
        if (confirm(`Are you sure you want to terminate ${bulkSelection.size} cells?`)) {
          setCells(prev => prev.filter(c => !bulkSelection.has(c.id)));
          setBulkSelection(new Set());
        }
        break;
      case 'export':
        const selectedCells = cells.filter(c => bulkSelection.has(c.id));
        const dataStr = JSON.stringify(selectedCells, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cads-cells-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        break;
    }
  };

  const toggleBulkSelection = (cellId: string) => {
    const newSelection = new Set(bulkSelection);
    if (newSelection.has(cellId)) {
      newSelection.delete(cellId);
    } else {
      newSelection.add(cellId);
    }
    setBulkSelection(newSelection);
  };

  const selectAllVisible = () => {
    const allVisible = new Set(filteredCells.map(c => c.id));
    setBulkSelection(allVisible);
  };

  const clearSelection = () => {
    setBulkSelection(new Set());
  };

  const getStateColor = (state: LiveCell['state']) => {
    switch (state) {
      case 'running': return 'text-green-400';
      case 'completed': return 'text-blue-400';
      case 'quarantined': return 'text-red-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 80) return 'text-red-400';
    if (risk >= 60) return 'text-yellow-400';
    if (risk >= 40) return 'text-orange-400';
    return 'text-green-400';
  };

  if (loading) {
    return (
      <div className="cads-content-wrapper">
        <div className="flex items-center justify-center h-64">
          <div className="cads-loading"></div>
          <span className="ml-3 text-white/70">Loading Live Cells...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="cads-content-wrapper cads-fade-in">
      {/* Controls Header */}
      <div className="cads-cells-header">
        <div className="flex items-center gap-4">
          <h2 className="cads-cells-title">Live Micro-Cells ({filteredCells.length})</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`cads-action-button ${autoRefresh ? 'bg-green-500/20 border-green-500/50' : ''}`}
            >
              {autoRefresh ? <Pause size={16} /> : <Play size={16} />}
              {autoRefresh ? 'Live' : 'Paused'}
            </button>
            
            <button
              onClick={() => setCells(generateCellData())}
              className="cads-action-button"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        <div className="cads-cells-controls">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search cells, intents, or IPs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="cads-search-input pl-10"
            />
          </div>

          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="cads-filter-dropdown"
            aria-label="Filter cells by state"
          >
            <option value="all">All States</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="quarantined">Quarantined</option>
            <option value="pending">Pending</option>
          </select>

          {bulkSelection.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/70">{bulkSelection.size} selected</span>
              <button onClick={() => handleBulkAction('terminate')} className="cads-action-button">
                <Square size={16} />
                Terminate
              </button>
              <button onClick={() => handleBulkAction('export')} className="cads-action-button">
                <Download size={16} />
                Export
              </button>
              <button onClick={clearSelection} className="cads-action-button">
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cells Table */}
      <div className="cads-cells-container">
        <div className="cads-grid">
          <table className="cads-table">
            <thead>
              <tr>
                <th className="w-12">
                  <input
                    type="checkbox"
                    checked={bulkSelection.size === filteredCells.length && filteredCells.length > 0}
                    onChange={bulkSelection.size === filteredCells.length ? clearSelection : selectAllVisible}
                    className="rounded border-white/20 bg-white/10"
                    aria-label="Select all cells"
                  />
                </th>
                <th 
                  className="cursor-pointer hover:bg-white/5"
                  onClick={() => handleSort('id')}
                >
                  Cell ID {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Intent</th>
                <th 
                  className="cursor-pointer hover:bg-white/5"
                  onClick={() => handleSort('latency')}
                >
                  Spawn Latency {sortBy === 'latency' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="cursor-pointer hover:bg-white/5"
                  onClick={() => handleSort('memory')}
                >
                  Memory Usage {sortBy === 'memory' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="cursor-pointer hover:bg-white/5"
                  onClick={() => handleSort('risk')}
                >
                  Risk Score {sortBy === 'risk' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>State</th>
                <th>TTL</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredCells.map((cell, index) => (
                  <motion.tr
                    key={cell.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/2"
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={bulkSelection.has(cell.id)}
                        onChange={() => toggleBulkSelection(cell.id)}
                        className="rounded border-white/20 bg-white/10"
                        aria-label={`Select cell ${cell.id}`}
                      />
                    </td>
                    <td>
                      <button
                        onClick={() => handleCellAction(cell.id, 'inspect')}
                        className="cads-cell-id hover:underline"
                      >
                        {cell.id}
                      </button>
                    </td>
                    <td>
                      <div className="font-mono text-sm">
                        <div className="text-white">{cell.intent.split('.')[0]}</div>
                        <div className="text-white/60 text-xs">{cell.intent.split('.').slice(1).join('.')}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`font-mono ${cell.spawnLatency > 30 ? 'text-red-400' : cell.spawnLatency > 20 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {cell.spawnLatency}ms
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <svg className="cads-memory-sparkline" viewBox="0 0 60 20">
                          <polyline
                            points={cell.memoryUsage.map((val, i) => `${i * 3},${20 - (val / 100) * 20}`).join(' ')}
                            className="cads-sparkline-path"
                          />
                        </svg>
                        <span className="font-mono text-sm">
                          {cell.memoryUsage[cell.memoryUsage.length - 1]}MB
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`font-mono font-bold ${getRiskColor(cell.riskScore)}`}>
                        {cell.riskScore}
                      </span>
                    </td>
                    <td>
                      <span className={`cads-status-badge ${cell.state}`}>
                        {cell.state === 'running' && <Activity size={12} />}
                        {cell.state === 'completed' && <CheckCircle size={12} />}
                        {cell.state === 'quarantined' && <AlertTriangle size={12} />}
                        {cell.state === 'pending' && <Clock size={12} />}
                        {cell.state.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-sm">
                        {Math.floor(cell.ttl / 60)}m {cell.ttl % 60}s
                      </span>
                    </td>
                    <td>
                      <div className="cads-cell-actions">
                        <button
                          onClick={() => handleCellAction(cell.id, 'inspect')}
                          className="cads-cell-action-btn inspect"
                          title="Inspect Cell"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleCellAction(cell.id, 'terminate')}
                          className="cads-cell-action-btn terminate"
                          title="Terminate Cell"
                        >
                          <Square size={16} />
                        </button>
                        <button
                          onClick={() => handleCellAction(cell.id, 'rollback')}
                          className="cads-cell-action-btn rollback"
                          title="Rollback Cell"
                        >
                          <RotateCcw size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Cell Details Modal */}
      <CellDetailsModal
        cell={selectedCell}
        isOpen={!!selectedCell}
        onClose={() => setSelectedCell(null)}
      />
    </div>
  );
};

// Cell Details Modal Component
const CellDetailsModal: React.FC<CellDetailsModalProps> = ({ cell, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('summary');

  if (!isOpen || !cell) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="cads-inspector-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="cads-inspector-drawer"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="cads-inspector-close"
          >
            ×
          </button>

          <div className="cads-inspector-header">
            <h3 className="cads-inspector-title">Cell Details: {cell.id}</h3>
          </div>

          <div className="cads-inspector-tabs">
            {['summary', 'metrics', 'logs', 'policy', 'actions'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`cads-inspector-tab ${activeTab === tab ? 'active' : ''}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="cads-inspector-content">
            {activeTab === 'summary' && (
              <div className="space-y-4">
                <div className="cads-metric-grid">
                  <div className="cads-metric-item">
                    <div className="cads-metric-label">Intent</div>
                    <div className="cads-metric-value text-base">{cell.intent}</div>
                  </div>
                  <div className="cads-metric-item">
                    <div className="cads-metric-label">Source IP</div>
                    <div className="cads-metric-value text-base">{cell.sourceIP}</div>
                  </div>
                  <div className="cads-metric-item">
                    <div className="cads-metric-label">User Agent</div>
                    <div className="cads-metric-value text-base">{cell.userAgent}</div>
                  </div>
                  <div className="cads-metric-item">
                    <div className="cads-metric-label">Created</div>
                    <div className="cads-metric-value text-base">{cell.timestamp.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'metrics' && (
              <div className="space-y-4">
                <div className="cads-chart-container">
                  <h4 className="cads-chart-title">Memory Usage Over Time</h4>
                  <svg viewBox="0 0 400 100" className="w-full h-24">
                    <polyline
                      points={cell.memoryUsage.map((val, i) => `${i * 20},${100 - val}`).join(' ')}
                      fill="none"
                      stroke="#00d4ff"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                
                <div className="cads-metric-grid">
                  <div className="cads-metric-item">
                    <div className="cads-metric-label">Current Memory</div>
                    <div className="cads-metric-value text-base">
                      {cell.memoryUsage[cell.memoryUsage.length - 1]}MB
                    </div>
                  </div>
                  <div className="cads-metric-item">
                    <div className="cads-metric-label">Peak Memory</div>
                    <div className="cads-metric-value text-base">
                      {Math.max(...cell.memoryUsage)}MB
                    </div>
                  </div>
                  <div className="cads-metric-item">
                    <div className="cads-metric-label">Spawn Latency</div>
                    <div className="cads-metric-value text-base">{cell.spawnLatency}ms</div>
                  </div>
                  <div className="cads-metric-item">
                    <div className="cads-metric-label">Risk Score</div>
                    <div className="cads-metric-value text-base">{cell.riskScore}/100</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="space-y-4">
                <div className="bg-black/50 rounded p-4 font-mono text-sm max-h-64 overflow-y-auto">
                  <div className="text-green-400">[{new Date().toISOString()}] Cell initialized</div>
                  <div className="text-blue-400">[{new Date().toISOString()}] WASM module loaded</div>
                  <div className="text-yellow-400">[{new Date().toISOString()}] Executing intent: {cell.intent}</div>
                  <div className="text-green-400">[{new Date().toISOString()}] Memory allocated: {cell.memoryUsage[0]}MB</div>
                  <div className="text-blue-400">[{new Date().toISOString()}] Policy check passed</div>
                  <div className="text-green-400">[{new Date().toISOString()}] Cell active</div>
                </div>
              </div>
            )}

            {activeTab === 'policy' && (
              <div className="space-y-4">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Memory Limit:</span>
                    <span className="text-green-400">✓ Passed</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Execution Time:</span>
                    <span className="text-green-400">✓ Passed</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Source Validation:</span>
                    <span className="text-green-400">✓ Passed</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk Assessment:</span>
                    <span className={cell.riskScore > 70 ? 'text-red-400' : 'text-green-400'}>
                      {cell.riskScore > 70 ? '⚠ Warning' : '✓ Passed'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'actions' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <button className="cads-action-button justify-center p-3">
                    <Square size={16} />
                    Terminate Cell
                  </button>
                  <button className="cads-action-button justify-center p-3">
                    <RotateCcw size={16} />
                    Rollback to Snapshot
                  </button>
                  <button className="cads-action-button justify-center p-3">
                    <AlertTriangle size={16} />
                    Quarantine Cell
                  </button>
                  <button className="cads-action-button justify-center p-3">
                    <Download size={16} />
                    Export Cell Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LiveCells;
