import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dna,
  TrendingUp,
  TrendingDown,
  Minus,
  GitBranch,
  RefreshCw,
  Search,
  Filter,
  Download,
  Upload,
  Trash2,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';

interface GenomeData {
  id: string;
  generation: number;
  fitness: number;
  accuracy: number;
  speed: number;
  memoryEfficiency: number;
  energyCost: number;
  createdAt: Date;
  parentIds: string[];
  mutations: string[];
  status: 'active' | 'archived' | 'culled' | 'testing';
  testResults?: {
    passes: number;
    failures: number;
    avgResponseTime: number;
  };
}

interface CullCandidate {
  id: string;
  reason: string;
  fitness: number;
  cullPriority: number;
  estimatedSavings: number;
}

const GenomeExplorer: React.FC = () => {
  const [genomes, setGenomes] = useState<GenomeData[]>([]);
  const [activeTab, setActiveTab] = useState<'fitness' | 'diff' | 'cull' | 'evolution'>('fitness');
  const [loading, setLoading] = useState(true);
  const [selectedGenomes, setSelectedGenomes] = useState<Set<string>>(new Set());
  const [cullQueue, setCullQueue] = useState<CullCandidate[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [filterCriteria, setFilterCriteria] = useState({
    minFitness: 0,
    maxGeneration: 100,
    status: 'all'
  });

  const fitnessChartRef = useRef<HTMLCanvasElement>(null);
  const evolutionChartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadGenomes = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockGenomes: GenomeData[] = Array.from({ length: 50 }, (_, i) => ({
          id: `genome-${i + 1}`,
          generation: Math.floor(i / 5) + 1,
          fitness: Math.random() * 100,
          accuracy: 85 + Math.random() * 15,
          speed: Math.random() * 1000 + 100,
          memoryEfficiency: 60 + Math.random() * 40,
          energyCost: Math.random() * 50 + 10,
          createdAt: new Date(Date.now() - Math.random() * 86400000 * 7),
          parentIds: i > 0 ? [`genome-${Math.max(1, i - Math.floor(Math.random() * 3))}`] : [],
          mutations: [`mutation-${Math.floor(Math.random() * 10) + 1}`],
          status: ['active', 'archived', 'testing'][Math.floor(Math.random() * 3)] as any,
          testResults: {
            passes: Math.floor(Math.random() * 100),
            failures: Math.floor(Math.random() * 20),
            avgResponseTime: Math.random() * 500 + 50
          }
        }));

        // Sort by fitness descending
        mockGenomes.sort((a, b) => b.fitness - a.fitness);
        setGenomes(mockGenomes);

        // Generate cull candidates
        const cullCandidates = mockGenomes
          .filter(g => g.fitness < 30 || g.energyCost > 45)
          .slice(0, 10)
          .map(g => ({
            id: g.id,
            reason: g.fitness < 30 ? 'Low fitness score' : 'High energy consumption',
            fitness: g.fitness,
            cullPriority: Math.floor((100 - g.fitness) / 10),
            estimatedSavings: g.energyCost * 24 // daily savings
          }));

        setCullQueue(cullCandidates);
      } catch (error) {
        console.error('Failed to load genomes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGenomes();
  }, []);

  useEffect(() => {
    if (activeTab === 'fitness' && fitnessChartRef.current && genomes.length > 0) {
      drawFitnessChart();
    }
    if (activeTab === 'evolution' && evolutionChartRef.current && genomes.length > 0) {
      drawEvolutionChart();
    }
  }, [activeTab, genomes]);

  const drawFitnessChart = () => {
    const canvas = fitnessChartRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Prepare data
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = padding + (chartWidth / 10) * i;
      const y = padding + (chartHeight / 10) * i;
      
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Plot genomes as scatter plot
    genomes.forEach(genome => {
      const x = padding + (genome.accuracy / 100) * chartWidth;
      const y = height - padding - (genome.fitness / 100) * chartHeight;
      
      const color = genome.status === 'active' ? '#00ff88' : 
                   genome.status === 'testing' ? '#ffaa00' : '#666';
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw axes labels
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.fillText('Accuracy →', width / 2 - 30, height - 10);
    
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Fitness →', -30, 0);
    ctx.restore();
  };

  const drawEvolutionChart = () => {
    const canvas = evolutionChartRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Group by generation and calculate average fitness
    const generationData: { [key: number]: number[] } = {};
    genomes.forEach(genome => {
      if (!generationData[genome.generation]) {
        generationData[genome.generation] = [];
      }
      generationData[genome.generation].push(genome.fitness);
    });

    const avgFitnessByGen = Object.entries(generationData).map(([gen, fitness]) => ({
      generation: parseInt(gen),
      avgFitness: fitness.reduce((a, b) => a + b, 0) / fitness.length,
      maxFitness: Math.max(...fitness),
      minFitness: Math.min(...fitness)
    })).sort((a, b) => a.generation - b.generation);

    if (avgFitnessByGen.length === 0) return;

    const maxGen = Math.max(...avgFitnessByGen.map(d => d.generation));
    const maxFitness = Math.max(...avgFitnessByGen.map(d => d.maxFitness));

    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = padding + (chartWidth / 10) * i;
      const y = padding + (chartHeight / 10) * i;
      
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw evolution lines
    if (avgFitnessByGen.length > 1) {
      // Average fitness line
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      ctx.beginPath();
      avgFitnessByGen.forEach((data, i) => {
        const x = padding + (data.generation / maxGen) * chartWidth;
        const y = height - padding - (data.avgFitness / maxFitness) * chartHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Max fitness line
      ctx.strokeStyle = '#ffaa00';
      ctx.lineWidth = 1;
      ctx.beginPath();
      avgFitnessByGen.forEach((data, i) => {
        const x = padding + (data.generation / maxGen) * chartWidth;
        const y = height - padding - (data.maxFitness / maxFitness) * chartHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Draw labels
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.fillText('Generation →', width / 2 - 40, height - 10);
    
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Fitness →', -30, 0);
    ctx.restore();
  };

  const toggleGenomeSelection = (genomeId: string) => {
    const newSelection = new Set(selectedGenomes);
    if (newSelection.has(genomeId)) {
      newSelection.delete(genomeId);
    } else {
      newSelection.add(genomeId);
    }
    setSelectedGenomes(newSelection);
  };

  const cullGenomes = async (genomeIds: string[]) => {
    if (!confirm(`Are you sure you want to cull ${genomeIds.length} genome(s)?`)) return;

    setGenomes(prev => prev.map(genome =>
      genomeIds.includes(genome.id) ? { ...genome, status: 'culled' as const } : genome
    ));

    setCullQueue(prev => prev.filter(candidate => !genomeIds.includes(candidate.id)));
  };

  const toggleSimulation = () => {
    setIsSimulating(!isSimulating);
  };

  const getStatusColor = (status: GenomeData['status']) => {
    switch (status) {
      case 'active': return 'text-green-400 border-green-400 bg-green-400/10';
      case 'testing': return 'text-yellow-400 border-yellow-400 bg-yellow-400/10';
      case 'archived': return 'text-blue-400 border-blue-400 bg-blue-400/10';
      case 'culled': return 'text-red-400 border-red-400 bg-red-400/10';
      default: return 'text-gray-400 border-gray-400 bg-gray-400/10';
    }
  };

  const getStatusIcon = (status: GenomeData['status']) => {
    switch (status) {
      case 'active': return <CheckCircle size={12} />;
      case 'testing': return <Play size={12} />;
      case 'archived': return <Eye size={12} />;
      case 'culled': return <XCircle size={12} />;
      default: return <AlertTriangle size={12} />;
    }
  };

  const getFitnessColor = (fitness: number) => {
    if (fitness >= 80) return 'text-green-400';
    if (fitness >= 60) return 'text-yellow-400';
    if (fitness >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const filteredGenomes = genomes.filter(genome => {
    if (filterCriteria.status !== 'all' && genome.status !== filterCriteria.status) return false;
    if (genome.fitness < filterCriteria.minFitness) return false;
    if (genome.generation > filterCriteria.maxGeneration) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="cads-content-wrapper">
        <div className="flex items-center justify-center h-64">
          <div className="cads-loading"></div>
          <span className="ml-3 text-white/70">Loading Genome Explorer...</span>
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
            { id: 'fitness', label: 'Fitness Landscape', icon: Target },
            { id: 'diff', label: 'Genome Diff', icon: GitBranch },
            { id: 'cull', label: 'Cull Queue', icon: Trash2 },
            { id: 'evolution', label: 'Evolution Timeline', icon: TrendingUp }
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

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSimulation}
              className={`cads-action-button ${isSimulating ? 'bg-red-500/20 border-red-500/50' : 'bg-green-500/20 border-green-500/50'}`}
            >
              {isSimulating ? <Pause size={16} /> : <Play size={16} />}
              {isSimulating ? 'Pause' : 'Simulate'}
            </button>
            {isSimulating && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/70">Speed:</span>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={simulationSpeed}
                  onChange={(e) => setSimulationSpeed(parseFloat(e.target.value))}
                  className="w-20"
                  title="Simulation Speed"
                />
                <span className="text-sm text-white/70 min-w-8">{simulationSpeed}x</span>
              </div>
            )}
          </div>
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
          {activeTab === 'fitness' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Fitness Landscape ({filteredGenomes.length} genomes)</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span>Min Fitness:</span>
                    <input
                      type="number"
                      value={filterCriteria.minFitness}
                      onChange={(e) => setFilterCriteria(prev => ({ ...prev, minFitness: parseFloat(e.target.value) || 0 }))}
                      className="w-20 px-2 py-1 bg-black/30 border border-white/20 rounded text-white"
                      min="0"
                      max="100"
                      title="Minimum Fitness Filter"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span>Status:</span>
                    <select
                      value={filterCriteria.status}
                      onChange={(e) => setFilterCriteria(prev => ({ ...prev, status: e.target.value }))}
                      className="px-2 py-1 bg-black/30 border border-white/20 rounded text-white"
                      title="Status Filter"
                    >
                      <option value="all">All</option>
                      <option value="active">Active</option>
                      <option value="testing">Testing</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="cads-chart-container">
                  <h4 className="cads-chart-title">Fitness vs Accuracy Scatter Plot</h4>
                  <canvas
                    ref={fitnessChartRef}
                    width={400}
                    height={300}
                    className="w-full h-auto bg-black/20 rounded"
                  />
                </div>

                <div className="cads-chart-container">
                  <h4 className="cads-chart-title">Top Performers</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredGenomes.slice(0, 10).map((genome, index) => (
                      <div key={genome.id} className="flex items-center justify-between p-3 bg-black/20 rounded border border-white/10">
                        <div className="flex items-center gap-3">
                          <span className="text-white/60 text-sm">#{index + 1}</span>
                          <div>
                            <div className="font-mono text-sm">{genome.id}</div>
                            <div className="text-xs text-white/60">Gen {genome.generation}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${getFitnessColor(genome.fitness)}`}>
                            {genome.fitness.toFixed(1)}
                          </div>
                          <div className="text-xs text-white/60">{genome.accuracy.toFixed(1)}% acc</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="cads-data-grid">
                <div className="cads-grid-header">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedGenomes.size === filteredGenomes.length && filteredGenomes.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedGenomes(new Set(filteredGenomes.map(g => g.id)));
                        } else {
                          setSelectedGenomes(new Set());
                        }
                      }}
                      className="rounded"
                      title="Select All Genomes"
                    />
                    <span>Select All</span>
                  </div>
                  {selectedGenomes.size > 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => cullGenomes(Array.from(selectedGenomes))}
                        className="cads-action-button text-sm"
                      >
                        <Trash2 size={14} />
                        Cull Selected ({selectedGenomes.size})
                      </button>
                    </div>
                  )}
                </div>

                <div className="cads-grid-content">
                  <div className="cads-grid-table">
                    <div className="cads-grid-row cads-grid-header-row">
                      <div></div>
                      <div>ID</div>
                      <div>Generation</div>
                      <div>Fitness</div>
                      <div>Accuracy</div>
                      <div>Speed</div>
                      <div>Memory</div>
                      <div>Energy</div>
                      <div>Status</div>
                      <div>Actions</div>
                    </div>
                    
                    {filteredGenomes.map(genome => (
                      <div key={genome.id} className="cads-grid-row">
                        <div>
                          <input
                            type="checkbox"
                            checked={selectedGenomes.has(genome.id)}
                            onChange={() => toggleGenomeSelection(genome.id)}
                            className="rounded"
                            title={`Select ${genome.id}`}
                          />
                        </div>
                        <div className="font-mono text-sm">{genome.id}</div>
                        <div>{genome.generation}</div>
                        <div className={`font-semibold ${getFitnessColor(genome.fitness)}`}>
                          {genome.fitness.toFixed(1)}
                        </div>
                        <div>{genome.accuracy.toFixed(1)}%</div>
                        <div>{genome.speed.toFixed(0)}ms</div>
                        <div>{genome.memoryEfficiency.toFixed(1)}%</div>
                        <div>{genome.energyCost.toFixed(1)}</div>
                        <div>
                          <span className={`cads-status-badge ${getStatusColor(genome.status)}`}>
                            {getStatusIcon(genome.status)}
                            {genome.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button className="cads-action-button text-xs" title="View Details">
                            <Eye size={12} />
                          </button>
                          <button className="cads-action-button text-xs" title="Clone Genome">
                            <GitBranch size={12} />
                          </button>
                          {genome.status === 'active' && (
                            <button
                              onClick={() => cullGenomes([genome.id])}
                              className="cads-action-button text-xs"
                              title="Cull Genome"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'diff' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold">Genome Diff Viewer</h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="cads-chart-container">
                  <h4 className="cads-chart-title">Select Genome A</h4>
                  <select className="cads-form-select" title="Select First Genome">
                    <option value="">Choose a genome...</option>
                    {genomes.slice(0, 20).map(genome => (
                      <option key={genome.id} value={genome.id}>
                        {genome.id} (Gen {genome.generation}, Fitness: {genome.fitness.toFixed(1)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="cads-chart-container">
                  <h4 className="cads-chart-title">Select Genome B</h4>
                  <select className="cads-form-select" title="Select Second Genome">
                    <option value="">Choose a genome...</option>
                    {genomes.slice(0, 20).map(genome => (
                      <option key={genome.id} value={genome.id}>
                        {genome.id} (Gen {genome.generation}, Fitness: {genome.fitness.toFixed(1)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="cads-chart-container">
                <h4 className="cads-chart-title">Diff Analysis</h4>
                <div className="text-center py-12 text-white/60">
                  <GitBranch size={48} className="mx-auto mb-4" />
                  <p>Select two genomes to compare their differences</p>
                  <p className="text-sm mt-2">Analysis will show fitness deltas, mutation paths, and performance metrics</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cull' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Cull Queue ({cullQueue.length} candidates)</h3>
                <div className="flex gap-2">
                  <button className="cads-action-button">
                    <RefreshCw size={16} />
                    Refresh Queue
                  </button>
                  <button className="cads-action-button">
                    <Settings size={16} />
                    Cull Settings
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="cads-kpi-card">
                  <div className="cads-kpi-icon bg-red-500/20">
                    <Trash2 size={24} className="text-red-400" />
                  </div>
                  <div className="cads-kpi-content">
                    <div className="cads-kpi-value">{cullQueue.length}</div>
                    <div className="cads-kpi-label">Cull Candidates</div>
                  </div>
                </div>

                <div className="cads-kpi-card">
                  <div className="cads-kpi-icon bg-green-500/20">
                    <Zap size={24} className="text-green-400" />
                  </div>
                  <div className="cads-kpi-content">
                    <div className="cads-kpi-value">
                      {cullQueue.reduce((sum, c) => sum + c.estimatedSavings, 0).toFixed(0)}
                    </div>
                    <div className="cads-kpi-label">Est. Daily Savings</div>
                  </div>
                </div>

                <div className="cads-kpi-card">
                  <div className="cads-kpi-icon bg-yellow-500/20">
                    <Target size={24} className="text-yellow-400" />
                  </div>
                  <div className="cads-kpi-content">
                    <div className="cads-kpi-value">
                      {cullQueue.length > 0 ? (cullQueue.reduce((sum, c) => sum + c.fitness, 0) / cullQueue.length).toFixed(1) : '0'}
                    </div>
                    <div className="cads-kpi-label">Avg Fitness</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {cullQueue.map(candidate => (
                  <motion.div
                    key={candidate.id}
                    className="cads-kpi-card"
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-mono text-lg">{candidate.id}</h4>
                          <span className="cads-status-badge bg-red-500/20 border-red-500/50 text-red-400">
                            <AlertTriangle size={12} />
                            PRIORITY {candidate.cullPriority}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                          <div>
                            <div className="text-white/60">Reason</div>
                            <div>{candidate.reason}</div>
                          </div>
                          <div>
                            <div className="text-white/60">Fitness</div>
                            <div className={`font-semibold ${getFitnessColor(candidate.fitness)}`}>
                              {candidate.fitness.toFixed(1)}
                            </div>
                          </div>
                          <div>
                            <div className="text-white/60">Est. Savings</div>
                            <div className="text-green-400">{candidate.estimatedSavings.toFixed(1)}/day</div>
                          </div>
                          <div>
                            <div className="text-white/60">Cull Priority</div>
                            <div className="font-semibold">{candidate.cullPriority}/10</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => cullGenomes([candidate.id])}
                          className="cads-action-button text-sm bg-red-500/20 border-red-500/50 text-red-400"
                        >
                          <Trash2 size={14} />
                          Cull Now
                        </button>
                        <button className="cads-action-button text-sm">
                          <Eye size={14} />
                          Inspect
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {cullQueue.length === 0 && (
                  <div className="text-center py-12 text-white/60">
                    <CheckCircle size={48} className="mx-auto mb-4 text-green-400" />
                    <p>No genomes currently queued for culling</p>
                    <p className="text-sm mt-2">All active genomes meet performance thresholds</p>
                  </div>
                )}
              </div>

              {cullQueue.length > 0 && (
                <div className="flex justify-center">
                  <button
                    onClick={() => cullGenomes(cullQueue.map(c => c.id))}
                    className="cads-action-button bg-red-500/20 border-red-500/50 text-red-400"
                  >
                    <Trash2 size={16} />
                    Cull All Candidates ({cullQueue.length})
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'evolution' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold">Evolution Timeline</h3>

              <div className="cads-chart-container">
                <h4 className="cads-chart-title">Fitness Evolution Over Generations</h4>
                <canvas
                  ref={evolutionChartRef}
                  width={800}
                  height={400}
                  className="w-full h-auto bg-black/20 rounded"
                />
                <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-green-400"></div>
                    <span>Average Fitness</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-yellow-400"></div>
                    <span>Peak Fitness</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="cads-chart-container">
                  <h4 className="cads-chart-title">Generation Statistics</h4>
                  <div className="space-y-3">
                    {Array.from(new Set(genomes.map(g => g.generation))).sort((a, b) => b - a).slice(0, 10).map(gen => {
                      const genGenomes = genomes.filter(g => g.generation === gen);
                      const avgFitness = genGenomes.reduce((sum, g) => sum + g.fitness, 0) / genGenomes.length;
                      const maxFitness = Math.max(...genGenomes.map(g => g.fitness));
                      
                      return (
                        <div key={gen} className="flex items-center justify-between p-3 bg-black/20 rounded border border-white/10">
                          <div>
                            <div className="font-semibold">Generation {gen}</div>
                            <div className="text-sm text-white/60">{genGenomes.length} genomes</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm">
                              <span className="text-green-400">Avg: {avgFitness.toFixed(1)}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-yellow-400">Peak: {maxFitness.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="cads-chart-container">
                  <h4 className="cads-chart-title">Mutation Analysis</h4>
                  <div className="space-y-3">
                    {['mutation-1', 'mutation-2', 'mutation-3', 'mutation-4'].map(mutation => {
                      const count = genomes.filter(g => g.mutations.includes(mutation)).length;
                      const successRate = genomes.filter(g => g.mutations.includes(mutation) && g.fitness > 60).length / Math.max(count, 1) * 100;
                      
                      return (
                        <div key={mutation} className="flex items-center justify-between p-3 bg-black/20 rounded border border-white/10">
                          <div>
                            <div className="font-mono text-sm">{mutation}</div>
                            <div className="text-xs text-white/60">{count} occurrences</div>
                          </div>
                          <div className="text-right">
                            <div className={`font-semibold ${successRate >= 70 ? 'text-green-400' : successRate >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {successRate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-white/60">success rate</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default GenomeExplorer;
