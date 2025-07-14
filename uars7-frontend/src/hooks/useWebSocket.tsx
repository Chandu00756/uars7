import { useState, useEffect, useRef, useCallback } from 'react';

/* ------------------------------------------------------------------ */
/* 1 ▸  Public types                                                  */
/* ------------------------------------------------------------------ */

export interface WebSocketOptions<T = any> {
  /**   How many times the hook should try to reconnect ( ∞ = -1 ) */
  reconnectAttempts?: number;
  /**   Milliseconds between reconnect tries                       */
  reconnectInterval?: number;
  /**   Milliseconds between “ping” frames                         */
  heartbeatInterval?: number;

  /* ---------- lifecycle callbacks ---------- */
  onConnect?    : () => void;
  onDisconnect? : (ev: CloseEvent) => void;
  onError?      : (ev: Event) => void;
  onMessage?    : (data: T) => void;
}

export interface UseWebSocketReturn<T = any> {
  data            : T | null;
  isConnected     : boolean;
  connectionState : 'connecting' | 'connected' | 'disconnected' | 'error';

  send       : (data: unknown) => void;
  reconnect  : () => void;
  disconnect : () => void;
}

/* ------------------------------------------------------------------ */
/* 2 ▸  Implementation                                                */
/* ------------------------------------------------------------------ */

export function useWebSocket<T = any>(
  path: string,
  options: WebSocketOptions<T> = {},
): UseWebSocketReturn<T> {
  const {
    reconnectAttempts  = 5,
    reconnectInterval  = 3_000,
    heartbeatInterval  = 30_000,
    onConnect,
    onDisconnect,
    onError,
    onMessage,
  } = options;

  /* ---------- state ---------- */
  const [data, setData]                     = useState<T | null>(null);
  const [isConnected, setIsConnected]       = useState(false);
  const [connectionState, setState]         = useState<UseWebSocketReturn['connectionState']>('disconnected');

  /* ---------- refs ---------- */
  const wsRef               = useRef<WebSocket | null>(null);
  const reconnectTimerRef   = useRef<ReturnType<typeof setTimeout>>();
  const heartbeatTimerRef   = useRef<ReturnType<typeof setInterval>>();
  const reconnectCountRef   = useRef(0);
  const shouldReconnectRef  = useRef(true);

  /* ---------- helpers ---------- */

  /** Build URL with auth token (if present) */
  const buildUrl = useCallback((): string => {
    const token   = localStorage.getItem('authToken');
    const baseUrl = import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:3001';
    const url     = `${baseUrl}${path}`;
    if (!token) return url;
    return url.includes('?') ? `${url}&token=${token}` : `${url}?token=${token}`;
  }, [path]);

  /* ---- heartbeat ---- */
  const ping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ping' }));
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    clearInterval(heartbeatTimerRef.current);
    heartbeatTimerRef.current = setInterval(ping, heartbeatInterval);
  }, [heartbeatInterval, ping]);

  const stopHeartbeat = useCallback(() => {
    clearInterval(heartbeatTimerRef.current);
  }, []);

  /* ------------------------------------------------------------------ */
  /* connect / reconnect / disconnect                                   */
  /* ------------------------------------------------------------------ */

  const connect = useCallback(() => {
    /* avoid duplicate connections */
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setState('connecting');

    try {
      const ws = new WebSocket(buildUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setState('connected');
        reconnectCountRef.current = 0;
        startHeartbeat();
        onConnect?.();
      };

      ws.onmessage = (ev) => {
        try {
          const msg: T | { type: 'pong' } = JSON.parse(ev.data);
          if ((msg as any).type === 'pong') return;
          setData(msg as T);
          onMessage?.(msg as T);
        } catch {
          /* ignore badly-formatted frames */
        }
      };

      ws.onclose = (ev) => {
        setIsConnected(false);
        setState('disconnected');
        stopHeartbeat();
        onDisconnect?.(ev);

        if (
          shouldReconnectRef.current &&
          (reconnectAttempts < 0 || reconnectCountRef.current < reconnectAttempts)
        ) {
          reconnectCountRef.current += 1;
          reconnectTimerRef.current = setTimeout(connect, reconnectInterval);
        }
      };

      ws.onerror = (ev) => {
        setState('error');
        onError?.(ev);
      };
    } catch (e) {
      setState('error');
      console.error('WebSocket creation failed:', e);
    }
  }, [
    buildUrl,
    reconnectAttempts,
    reconnectInterval,
    onConnect,
    onDisconnect,
    onError,
    onMessage,
    startHeartbeat,
    stopHeartbeat,
  ]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    clearTimeout(reconnectTimerRef.current);
    stopHeartbeat();
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
    setState('disconnected');
  }, [stopHeartbeat]);

  const reconnect = useCallback(() => {
    shouldReconnectRef.current = true;
    reconnectCountRef.current   = 0;
    wsRef.current?.close();            // triggers onclose → connect()
  }, []);

  const send = useCallback((payload: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    } else {
      console.warn('WebSocket not connected – send() ignored');
    }
  }, []);

  /* ------------------------------------------------------------------ */
  /* lifecycle: mount / unmount                                         */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  /* handle tab visibility: pause heartbeat when hidden */
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'hidden') stopHeartbeat();
      else if (isConnected) startHeartbeat();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [isConnected, startHeartbeat, stopHeartbeat]);

  /* ------------------------------------------------------------------ */
  /* expose API                                                         */
  /* ------------------------------------------------------------------ */

  return {
    data,
    isConnected,
    connectionState: connectionState,
    send,
    reconnect,
    disconnect,
  };
}

/* -------------------------------------------------------------------- */
/* 3 ▸  Convenience specialisations                                     */
/* -------------------------------------------------------------------- */

export const useCADSWebSocket = () =>
  useWebSocket('/api/cads/realtime', {
    onConnect:    () => console.log('CADS WS connected'),
    onDisconnect: () => console.log('CADS WS disconnected'),
    onError:      (e) => console.error('CADS WS error', e),
  });

export const useMSESWebSocket = () =>
  useWebSocket('/api/mses/realtime', {
    heartbeatInterval: 15_000,
    onConnect:    () => console.log('M-SES WS connected'),
    onDisconnect: () => console.log('M-SES WS disconnected'),
    onError:      (e) => console.error('M-SES WS error', e),
  });

export const useThreatIntelWebSocket = () =>
  useWebSocket('/api/threat-intel/realtime', {
    onConnect:    () => console.log('Threat-Intel WS connected'),
    onDisconnect: () => console.log('Threat-Intel WS disconnected'),
    onError:      (e) => console.error('Threat-Intel WS error', e),
  });
