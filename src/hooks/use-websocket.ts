import { useEffect, useRef, useState, useCallback } from 'react';

interface UseWebSocketOptions {
  onOpen?: () => void;
  onClose?: () => void;
  onMessage?: (event: MessageEvent) => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseWebSocketReturn {
  sendMessage: (message: any) => void;
  lastMessage: MessageEvent | null;
  readyState: number;
  connect: () => void;
  disconnect: () => void;
}

export function useWebSocket(
  url: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CLOSED);
  const wsRef = useRef<WebSocket | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectCount = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout>();

  const {
    onOpen,
    onClose,
    onMessage,
    onError,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
  } = options;

  const connectSSE = useCallback(() => {
    // Use Server-Sent Events as fallback
    const sseUrl = url.startsWith('/')
      ? `${window.location.origin}${url}`
      : url;

    // Send initial subscription via POST
    fetch(sseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'subscribe', topic: 'executions' }),
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) throw new Error('SSE connection failed');
        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        const readStream = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value);
            const lines = text.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                try {
                  const message = JSON.parse(data);
                  const event = new MessageEvent('message', { data });
                  setLastMessage(event);
                  onMessage?.(event);
                } catch (e) {
                  // Ignore parse errors
                }
              }
            }
          }
        };

        setReadyState(WebSocket.OPEN);
        onOpen?.();
        readStream().catch(console.error);
      })
      .catch((error) => {
        console.error('SSE connection failed:', error);
        setReadyState(WebSocket.CLOSED);
        onError?.(new Event('error'));
      });
  }, [url, onOpen, onMessage, onError]);

  const connect = useCallback(() => {
    // Next.js doesn't support WebSocket upgrades in app router,
    // so we go directly to SSE implementation
    connectSSE();
  }, [connectSSE]);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setReadyState(WebSocket.CLOSED);
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const data = typeof message === 'string' ? message : JSON.stringify(message);
      wsRef.current.send(data);
    } else {
      // For SSE, we need to send messages via regular HTTP
      const sseUrl = url.startsWith('/')
        ? `${window.location.origin}${url}`
        : url;

      fetch(sseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
        credentials: 'include',
      }).catch(console.error);
    }
  }, [url]);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return {
    sendMessage,
    lastMessage,
    readyState,
    connect,
    disconnect,
  };
}