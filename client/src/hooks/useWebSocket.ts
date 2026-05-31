import { useEffect, useRef, useState, useCallback } from 'react';
import { queryClient } from '@/lib/queryClient';

interface WebSocketMessage {
  type: string;
  data?: any;
  message?: string;
  timestamp?: string;
}

interface UseWebSocketOptions {
  enabled?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    enabled = true,
    reconnectAttempts = 5,
    reconnectDelay = 3000,
    onMessage,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // Get authentication token from cookies
  const getAuthToken = useCallback(() => {
    const accessToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('accessToken='))
      ?.split('=')[1];
    
    return accessToken;
  }, []);

  const connect = useCallback(() => {
    if (!enabled || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      console.log('🔌 WebSocket: No auth token available, skipping connection');
      return;
    }

    console.log('🔌 WebSocket: Attempting to connect...');
    setConnectionState('connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket: Connected successfully');
        setIsConnected(true);
        setConnectionState('connected');
        reconnectCountRef.current = 0;
        onConnect?.();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 WebSocket: Message received:', message.type);

          // Handle different message types
          switch (message.type) {
            case 'notification':
              // Invalidate notification queries to trigger refetch
              queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
              queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
              console.log('🔔 New notification received, refreshing data...');
              break;
            
            case 'new_message': {
              // Invalidate the specific thread's messages so ChatWindow updates instantly
              const threadId = message.data?.threadId;
              if (threadId) {
                queryClient.invalidateQueries({ queryKey: [`/api/chat/threads/${threadId}/messages`] });
              }
              // Always refresh the thread list (unread counts, last message preview)
              queryClient.invalidateQueries({ queryKey: ['/api/chat/threads'] });
              break;
            }

            case 'ping':
              // Respond to server ping
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'pong' }));
              }
              break;
              
            case 'pong':
              // Server acknowledged our ping
              break;
              
            case 'connected':
              console.log('🔌 WebSocket: Connection acknowledged by server');
              break;
              
            default:
              console.log(`📨 WebSocket: Unknown message type: ${message.type}`);
          }

          // Call custom message handler
          onMessage?.(message);

        } catch (error) {
          console.error('❌ WebSocket: Failed to parse message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log(`🔌 WebSocket: Connection closed (code: ${event.code}, reason: ${event.reason})`);
        setIsConnected(false);
        setConnectionState('disconnected');
        onDisconnect?.();

        // Attempt to reconnect if not manually closed
        if (event.code !== 1000 && enabled && reconnectCountRef.current < reconnectAttempts) {
          const delay = reconnectDelay * Math.pow(1.5, reconnectCountRef.current); // Exponential backoff
          console.log(`🔄 WebSocket: Reconnecting in ${delay}ms (attempt ${reconnectCountRef.current + 1}/${reconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectCountRef.current++;
            connect();
          }, delay);
        } else if (reconnectCountRef.current >= reconnectAttempts) {
          console.log('❌ WebSocket: Max reconnection attempts reached');
          setConnectionState('error');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket: Connection error:', error);
        setConnectionState('error');
        onError?.(error);
      };

    } catch (error) {
      console.error('❌ WebSocket: Failed to create connection:', error);
      setConnectionState('error');
    }
  }, [enabled, getAuthToken, reconnectAttempts, reconnectDelay, onConnect, onDisconnect, onError, onMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionState('disconnected');
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    } else {
      console.warn('🔌 WebSocket: Cannot send message - not connected');
      return false;
    }
  }, []);

  // Handle connection lifecycle
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    connectionState,
    sendMessage,
    connect,
    disconnect
  };
};