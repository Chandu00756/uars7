import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Cpu, MemoryStick, HardDrive, Wifi } from 'lucide-react';

const Performance: React.FC = () => {
  const metrics = [
    { name: 'CPU Usage', value: 73, icon: Cpu, color: 'text-warning' },
    { name: 'Memory Usage', value: 45, icon: MemoryStick, color: 'text-success' },
    { name: 'Disk Usage', value: 89, icon: HardDrive, color: 'text-error' },
    { name: 'Network I/O', value: 62, icon: Wifi, color: 'text-accent' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="portal-performance-page"
    >
      <div className="portal-page-header portal-mb-6">
        <h1 className="portal-text-3xl portal-font-bold portal-mb-2">System Performance</h1>
        <p className="portal-text-secondary">Monitor system performance metrics and resource utilization</p>
      </div>

      <div className="portal-metrics-grid portal-grid portal-grid-cols-1 portal-md:portal-grid-cols-2 portal-lg:portal-grid-cols-4 portal-gap-6 portal-mb-8">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.name}
            className="portal-metric-card portal-bg-surface portal-rounded-lg portal-p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
          >
            <div className="portal-flex portal-items-center portal-justify-between portal-mb-4">
              <metric.icon size={24} className={metric.color} />
              <span className="portal-text-2xl portal-font-bold">{metric.value}%</span>
            </div>
            <h3 className="portal-text-lg portal-font-semibold portal-mb-2">{metric.name}</h3>
            <div className="portal-progress-bar portal-bg-secondary portal-rounded-full portal-h-2">
              <div 
                className={`portal-h-full portal-rounded-full ${
                  metric.value > 80 ? 'portal-bg-error' :
                  metric.value > 60 ? 'portal-bg-warning' :
                  'portal-bg-success'
                }`}
                style={{ width: `${metric.value}%` }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="portal-performance-charts portal-grid portal-grid-cols-1 portal-lg:portal-grid-cols-2 portal-gap-6">
        <div className="portal-chart-card portal-bg-surface portal-rounded-lg portal-p-6">
          <h3 className="portal-text-xl portal-font-semibold portal-mb-4">CPU Usage Over Time</h3>
          <div className="portal-chart-placeholder portal-h-64 portal-bg-secondary portal-rounded portal-flex portal-items-center portal-justify-center">
            <TrendingUp size={48} className="portal-text-accent" />
          </div>
        </div>
        
        <div className="portal-chart-card portal-bg-surface portal-rounded-lg portal-p-6">
          <h3 className="portal-text-xl portal-font-semibold portal-mb-4">Memory Usage Over Time</h3>
          <div className="portal-chart-placeholder portal-h-64 portal-bg-secondary portal-rounded portal-flex portal-items-center portal-justify-center">
            <TrendingUp size={48} className="portal-text-accent" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Performance;
