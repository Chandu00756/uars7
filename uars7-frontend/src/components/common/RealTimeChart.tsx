import React, { useEffect, useRef, useState } from 'react';

interface DataPoint {
  timestamp: number;
  value: number;
}

interface RealTimeChartProps {
  data: DataPoint[];
  title?: string;
  color?: string;
  height?: number;
  maxDataPoints?: number;
  updateInterval?: number;
  yAxisLabel?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  animate?: boolean;
}

const RealTimeChart: React.FC<RealTimeChartProps> = ({
  data,
  title = 'Real-time Data',
  color = '#0066cc',
  height = 300,
  maxDataPoints = 50,
  yAxisLabel = 'Value',
  showGrid = true,
  showLegend = false,
  animate = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [processedData, setProcessedData] = useState<DataPoint[]>([]);

  useEffect(() => {
    setProcessedData(data.slice(-maxDataPoints));
  }, [data, maxDataPoints]);

  useEffect(() => {
    if (!canvasRef.current || processedData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set up dimensions
    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;

    // Find min/max values
    const values = processedData.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      
      // Horizontal grid lines
      for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + chartWidth, y);
        ctx.stroke();
      }
      
      // Vertical grid lines
      for (let i = 0; i <= 10; i++) {
        const x = padding + (chartWidth / 10) * i;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, padding + chartHeight);
        ctx.stroke();
      }
    }

    // Draw line
    if (processedData.length > 1) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      processedData.forEach((point, index) => {
        const x = padding + (chartWidth / (processedData.length - 1)) * index;
        const y = padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();

      // Fill area
      ctx.fillStyle = `${color}20`;
      ctx.lineTo(padding + chartWidth, padding + chartHeight);
      ctx.lineTo(padding, padding + chartHeight);
      ctx.closePath();
      ctx.fill();
    }

    // Draw labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    
    // Y-axis label
    if (yAxisLabel) {
      ctx.save();
      ctx.translate(15, padding + chartHeight / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(yAxisLabel, 0, 0);
      ctx.restore();
    }

    // Title
    if (title) {
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.fillText(title, canvas.width / 2, 25);
    }

    // Value labels
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = maxValue - (valueRange / 5) * i;
      const y = padding + (chartHeight / 5) * i + 3;
      ctx.fillText(value.toFixed(1), padding - 5, y);
    }

  }, [processedData, color, height, showGrid, title, yAxisLabel]);

  return (
    <div className="real-time-chart" style={{ height, position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={600}
        height={height}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default RealTimeChart;
