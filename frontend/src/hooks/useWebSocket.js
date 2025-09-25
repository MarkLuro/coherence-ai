import { useState, useEffect, useRef } from 'react';

const useWebSocket = (url) => {
  const socketRef = useRef(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!url) return;

    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket connected:', url);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
        setMessages(prev => [...prev, data]);
      } catch (err) {
        console.error('⚠️ Error parsing WebSocket message:', err);
      }
    };

    ws.onerror = (event) => {
      console.error('❌ WebSocket error:', event);
    };

    ws.onclose = (event) => {
      console.warn('⚠️ WebSocket closed:', event.code, event.reason);
    };

    return () => {
      ws.close();
    };
  }, [url]);

  const sendMessage = (message) => {
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ Cannot send: WebSocket not open');
    }
  };

  return { sendMessage, lastMessage, messages };
};

export default useWebSocket;
