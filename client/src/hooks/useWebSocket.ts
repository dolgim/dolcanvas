import { useEffect, useRef, useCallback } from 'react';
import type { WSMessage } from '@dolcanvas/shared';

interface UseWebSocketOptions {
  url: string;
  onMessage: (message: WSMessage) => void;
  onConnect?: () => void;
}

export function useWebSocket({ url, onMessage, onConnect }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onMessageRef = useRef(onMessage);
  const onConnectRef = useRef(onConnect);
  const connectRef = useRef<(() => void) | undefined>(undefined);

  // Keep callbacks up to date
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onConnectRef.current = onConnect;
  }, [onConnect]);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        onConnectRef.current?.();
      };

      ws.onmessage = (event) => {
        // Ignore messages from a stale connection (React strict mode)
        if (wsRef.current !== ws) return;

        try {
          const message = JSON.parse(event.data) as WSMessage;
          onMessageRef.current(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        // Only reconnect if this is still the active connection.
        // React strict mode may close a stale WS after a newer one was created.
        if (wsRef.current !== ws) return;

        console.log('WebSocket disconnected, reconnecting in 3s...');
        wsRef.current = null;

        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectRef.current?.();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  }, [url]);

  // Keep connectRef up to date for reconnection
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      // Cleanup on unmount
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback(<T,>(message: WSMessage<T>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  return { sendMessage };
}
