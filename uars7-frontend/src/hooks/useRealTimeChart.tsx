import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

export interface ChartDataPoint {
  timestamp: number;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface MultiSeriesDataPoint {
  timestamp: number;
  values: Record<string, number>;
  metadata?: Record<string, any>;
}

export interface ChartConfig {
  endpoint: string;
  interval: number;
  maxDataPoints: number;
  autoStart?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  transformData?: (data: any) => ChartDataPoint[] | MultiSeriesDataPoint[];
  onError?: (error: Error) => void;
  onDataUpdate?: (data: ChartDataPoint[] | MultiSeriesDataPoint[]) => void;
}

export interface ChartState {
  data: ChartDataPoint[] | MultiSeriesDataPoint[];
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  lastUpdate: Date | null;
  totalDataPoints: number;
}

export interface ChartControls {
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  clear: () => void;
  addDataPoint: (point: ChartDataPoint | MultiSeriesDataPoint) => void;
  updateInterval: (newInterval: number) => void;
  updateMaxDataPoints: (maxPoints: number) => void;
  exportData: (format?: 'json' | 'csv') => string;
}

export const useRealTimeChart = (config: ChartConfig): ChartState & ChartControls => {
  const [data, setData] = useState<ChartDataPoint[] | MultiSeriesDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentRetryAttempt = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const {
    endpoint,
    interval,
    maxDataPoints,
    autoStart = true,
    retryAttempts = 3,
    retryDelay = 5000,
    transformData,
    onError,
    onDataUpdate
  } = config;

  // Helper function to check if data is ChartDataPoint array
  const isChartDataPointArray = (data: ChartDataPoint[] | MultiSeriesDataPoint[]): data is ChartDataPoint[] => {
    return data.length === 0 || 'value' in data[0];
  };

  // Helper function to check if data is MultiSeriesDataPoint array
  const isMultiSeriesDataPointArray = (data: ChartDataPoint[] | MultiSeriesDataPoint[]): data is MultiSeriesDataPoint[] => {
    return data.length === 0 || 'values' in data[0];
  };

  // Fetch data from endpoint
  const fetchData = useCallback(async (): Promise<ChartDataPoint[] | MultiSeriesDataPoint[]> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get(endpoint, {
        signal: abortControllerRef.current.signal,
        timeout: 10000,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      let chartData: ChartDataPoint[] | MultiSeriesDataPoint[];
      
      if (transformData) {
        chartData = transformData(response.data);
      } else {
        // Default transformation for common data formats
        if (Array.isArray(response.data)) {
          chartData = response.data.map((item: any, index: number) => ({
            timestamp: item.timestamp || Date.now() - (response.data.length - index) * 1000,
            value: typeof item === 'number' ? item : item.value || 0,
            label: item.label,
            metadata: item.metadata
          })) as ChartDataPoint[];
        } else if (response.data.value !== undefined) {
          chartData = [{
            timestamp: response.data.timestamp || Date.now(),
            value: response.data.value,
            label: response.data.label,
            metadata: response.data.metadata
          }] as ChartDataPoint[];
        } else {
          throw new Error('Invalid data format received from endpoint');
        }
      }
      
      setIsConnected(true);
      currentRetryAttempt.current = 0;
      
      return chartData;
      
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return [];
      }
      
      setIsConnected(false);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch data';
      setError(errorMessage);
      
      if (onError) {
        onError(new Error(errorMessage));
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, transformData, onError]);

  // Add new data point to the chart
  const addDataPoint = useCallback((point: ChartDataPoint | MultiSeriesDataPoint) => {
    setData(prevData => {
      // Type-safe handling based on the point type and existing data
      if (prevData.length === 0) {
        return [point] as typeof prevData;
      }

      // Check compatibility between new point and existing data
      const isExistingChartData = isChartDataPointArray(prevData);
      const isNewPointChartData = 'value' in point;

      if (isExistingChartData && isNewPointChartData) {
        const newData = [...(prevData as ChartDataPoint[]), point as ChartDataPoint];
        return newData.slice(-maxDataPoints) as ChartDataPoint[];
      } else if (!isExistingChartData && !isNewPointChartData) {
        const newData = [...(prevData as MultiSeriesDataPoint[]), point as MultiSeriesDataPoint];
        return newData.slice(-maxDataPoints) as MultiSeriesDataPoint[];
      } else {
        // Type mismatch - replace with new point type
        return [point] as typeof prevData;
      }
    });
    
    setLastUpdate(new Date());
    
    if (onDataUpdate) {
      onDataUpdate([point] as ChartDataPoint[] | MultiSeriesDataPoint[]);
    }
  }, [maxDataPoints, onDataUpdate]);

  // Update data with new points
  const updateData = useCallback(async () => {
    if (isPaused) return;
    
    try {
      const newData = await fetchData();
      
      if (newData.length > 0) {
        setData(prevData => {
          // Type-safe merging
          if (prevData.length === 0) {
            return newData.slice(-maxDataPoints);
          }

          const isExistingChartData = isChartDataPointArray(prevData);
          const isNewChartData = isChartDataPointArray(newData);

          if (isExistingChartData && isNewChartData) {
            const combinedData = [...(prevData as ChartDataPoint[]), ...(newData as ChartDataPoint[])];
            
            // Remove duplicates based on timestamp
            const uniqueData = combinedData.filter((item, index, arr) => 
              arr.findIndex(t => t.timestamp === item.timestamp) === index
            );
            
            // Sort by timestamp
            uniqueData.sort((a, b) => a.timestamp - b.timestamp);
            
            // Trim to maxDataPoints
            return uniqueData.slice(-maxDataPoints) as ChartDataPoint[];
          } else if (!isExistingChartData && !isNewChartData) {
            const combinedData = [...(prevData as MultiSeriesDataPoint[]), ...(newData as MultiSeriesDataPoint[])];
            
            // Remove duplicates based on timestamp
            const uniqueData = combinedData.filter((item, index, arr) => 
              arr.findIndex(t => t.timestamp === item.timestamp) === index
            );
            
            // Sort by timestamp
            uniqueData.sort((a, b) => a.timestamp - b.timestamp);
            
            // Trim to maxDataPoints
            return uniqueData.slice(-maxDataPoints) as MultiSeriesDataPoint[];
          } else {
            // Type mismatch - replace with new data
            return newData.slice(-maxDataPoints);
          }
        });
        
        setLastUpdate(new Date());
        
        if (onDataUpdate) {
          onDataUpdate(newData);
        }
      }
      
    } catch (err) {
      // Handle retry logic
      if (currentRetryAttempt.current < retryAttempts) {
        currentRetryAttempt.current++;
        
        retryTimeoutRef.current = setTimeout(() => {
          updateData();
        }, retryDelay);
      }
    }
  }, [fetchData, isPaused, maxDataPoints, retryAttempts, retryDelay, onDataUpdate]);

  // Start real-time updates
  const start = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    setIsPaused(false);
    currentRetryAttempt.current = 0;
    
    // Initial data fetch
    updateData();
    
    // Set up interval for continuous updates
    intervalRef.current = setInterval(updateData, interval);
  }, [updateData, interval]);

  // Stop real-time updates
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setIsConnected(false);
    setIsPaused(false);
  }, []);

  // Pause updates without clearing data
  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  // Resume updates
  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  // Clear all data
  const clear = useCallback(() => {
    setData([]);
    setLastUpdate(null);
    setError(null);
  }, []);

  // Update interval dynamically
  const updateInterval = useCallback((newInterval: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(updateData, newInterval);
    }
  }, [updateData]);

  // Update max data points
  const updateMaxDataPoints = useCallback((maxPoints: number) => {
    setData(prevData => {
      if (prevData.length > maxPoints) {
        return prevData.slice(-maxPoints);
      }
      return prevData;
    });
  }, []);

  // Export data in different formats
  const exportData = useCallback((format: 'json' | 'csv' = 'json'): string => {
    if (format === 'csv') {
      if (data.length === 0) return '';
      
      // Check if it's multi-series data
      const firstPoint = data[0];
      if ('values' in firstPoint) {
        const multiSeriesData = data as MultiSeriesDataPoint[];
        const headers = ['timestamp', ...Object.keys(multiSeriesData[0].values)];
        const csvRows = [
          headers.join(','),
          ...multiSeriesData.map(point => [
            point.timestamp,
            ...Object.values(point.values)
          ].join(','))
        ];
        return csvRows.join('\n');
      } else {
        const singleSeriesData = data as ChartDataPoint[];
        const csvRows = [
          'timestamp,value,label',
          ...singleSeriesData.map(point => 
            `${point.timestamp},${point.value},${point.label || ''}`
          )
        ];
        return csvRows.join('\n');
      }
    }
    
    return JSON.stringify(data, null, 2);
  }, [data]);

  // Auto-start if configured
  useEffect(() => {
    if (autoStart) {
      start();
    }
    
    return () => {
      stop();
    };
  }, [autoStart, start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    // State
    data,
    isLoading,
    isConnected,
    error,
    lastUpdate,
    totalDataPoints: data.length,
    
    // Controls
    start,
    stop,
    pause,
    resume,
    clear,
    addDataPoint,
    updateInterval,
    updateMaxDataPoints,
    exportData
  };
};

// Specialized hooks for common chart types
export const useLineChart = (config: Omit<ChartConfig, 'transformData'>) => {
  return useRealTimeChart({
    ...config,
    transformData: (data: any): ChartDataPoint[] => {
      if (Array.isArray(data)) {
        return data.map((item, index) => ({
          timestamp: item.timestamp || Date.now() - (data.length - index) * 1000,
          value: typeof item === 'number' ? item : item.value || 0,
          label: item.label
        }));
      }
      
      return [{
        timestamp: data.timestamp || Date.now(),
        value: data.value || 0,
        label: data.label
      }];
    }
  });
};

export const useMultiSeriesChart = (config: Omit<ChartConfig, 'transformData'>) => {
  return useRealTimeChart({
    ...config,
    transformData: (data: any): MultiSeriesDataPoint[] => {
      if (Array.isArray(data)) {
        return data.map((item, index) => ({
          timestamp: item.timestamp || Date.now() - (data.length - index) * 1000,
          values: item.values || {},
          metadata: item.metadata
        }));
      }
      
      return [{
        timestamp: data.timestamp || Date.now(),
        values: data.values || {},
        metadata: data.metadata
      }];
    }
  });
};

export const useQuantumMetricsChart = (config: Omit<ChartConfig, 'transformData' | 'endpoint'>) => {
  return useRealTimeChart({
    ...config,
    endpoint: '/api/qvdm/metrics/realtime',
    transformData: (data: any): MultiSeriesDataPoint[] => {
      return [{
        timestamp: data.timestamp || Date.now(),
        values: {
          coherence: data.state?.coherence || 0,
          entanglement: data.state?.entanglement || 0,
          superposition: data.state?.superposition || 0,
          decoherence: data.state?.decoherence || 0,
          fidelity: data.state?.fidelity || 0
        },
        metadata: {
          quantumVolume: data.quantumVolume,
          gateErrorRate: data.gateErrorRate,
          readoutFidelity: data.readoutFidelity
        }
      }];
    }
  });
};

export default useRealTimeChart;
