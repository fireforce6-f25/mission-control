import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { fetchRecentFireDroneData, fetchRecentNotifications, normalizeList, normalizeNotifications } from '../api/apiClient';

// Severity-specific toast configurations
const getToastConfig = (severity) => {
  const baseConfig = {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  };

  switch (severity) {
    case 'critical':
      return { ...baseConfig, autoClose: false, className: 'toast-critical' };
    case 'high':
      return { ...baseConfig, autoClose: 8000, className: 'toast-high' };
    case 'medium':
      return { ...baseConfig, autoClose: 6000, className: 'toast-medium' };
    case 'low':
      return { ...baseConfig, autoClose: 5000, className: 'toast-low' };
    default:
      return { ...baseConfig, className: 'toast-info' };
  }
};

export default function WebSocketProvider() {
  const queryClient = useQueryClient();
  
  // Warm the cache with initial fire/drone data
  useQuery({
    queryKey: ['recent-history'],
    queryFn: fetchRecentFireDroneData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: 10 * 60 * 1000,
    refetchIntervalInBackground: true,
  });

  // Warm the cache with initial notifications
  useQuery({
    queryKey: ['recent-notifications'],
    queryFn: fetchRecentNotifications,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: 10 * 60 * 1000,
    refetchIntervalInBackground: true,
  });

  const fireWsRef = useRef(null);
  const notifWsRef = useRef(null);
  const fireReconnectRef = useRef(null);
  const notifReconnectRef = useRef(null);
  const fireConnectingRef = useRef(false); // Prevent duplicate connections
  const notifConnectingRef = useRef(false);

  const mergeIncomingFireDrone = (incoming) => {
    const key = incoming.type === 'fire' ? 'fires' : 'drones';
    queryClient.setQueryData(['recent-history'], (old = { fires: [], drones: [] }) => {
      const merged = normalizeList([...(old[key] || []), incoming.payload]);
      return { ...old, [key]: merged };
    });
  };

  const mergeIncomingNotification = (notification) => {
    queryClient.setQueryData(['recent-notifications'], (old = { notifications: [] }) => {
      const merged = normalizeNotifications([...(old.notifications || []), notification]);
      return { notifications: merged };
    });

    // Show toast notification
    const toastConfig = getToastConfig(notification.severity);
    
    const ToastContent = () => (
      <div>
        <div className="font-bold text-sm mb-1">{notification.title}</div>
        <div className="text-xs">{notification.message}</div>
        <div className="text-xs mt-1 opacity-70">{notification.source}</div>
      </div>
    );

    switch (notification.severity) {
      case 'critical':
        toast.error(<ToastContent />, toastConfig);
        break;
      case 'high':
        toast.warning(<ToastContent />, toastConfig);
        break;
      case 'medium':
        toast.info(<ToastContent />, toastConfig);
        break;
      case 'low':
        toast.success(<ToastContent />, toastConfig);
        break;
      default:
        toast(<ToastContent />, toastConfig);
    }
  };

  // Fire/Drone WebSocket connection
  useEffect(() => {
    const connect = () => {
      // Prevent duplicate connections
      if (fireConnectingRef.current || (fireWsRef.current && fireWsRef.current.readyState === WebSocket.OPEN)) {
        return;
      }
      fireConnectingRef.current = true;

      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//localhost:8000/ws/fire-updates/`;
      const ws = new WebSocket(wsUrl);
      fireWsRef.current = ws;

      ws.addEventListener('open', () => {
        fireConnectingRef.current = false;
        console.debug('[Fire WS] connected');
      });

      ws.addEventListener('message', (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if ((data.type === 'fire' || data.type === 'drone') && data.payload) {
            mergeIncomingFireDrone(data);
          }
        } catch {
          // ignore malformed messages
        }
      });

      ws.addEventListener('close', () => {
        fireConnectingRef.current = false;
        fireReconnectRef.current = setTimeout(connect, 3000);
      });

      ws.addEventListener('error', () => {
        fireConnectingRef.current = false;
        try { ws.close(); } catch {}
      });
    };

    connect();

    return () => {
      fireConnectingRef.current = false;
      if (fireReconnectRef.current) {
        clearTimeout(fireReconnectRef.current);
        fireReconnectRef.current = null;
      }
      if (fireWsRef.current) {
        try { fireWsRef.current.close(); } catch {}
        fireWsRef.current = null;
      }
    };
  }, []); // Remove queryClient dependency

  // Notifications WebSocket connection
  useEffect(() => {
    const connect = () => {
      // Prevent duplicate connections
      if (notifConnectingRef.current || (notifWsRef.current && notifWsRef.current.readyState === WebSocket.OPEN)) {
        return;
      }
      notifConnectingRef.current = true;

      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//localhost:8000/ws/notifications/`;
      const ws = new WebSocket(wsUrl);
      notifWsRef.current = ws;

      ws.addEventListener('open', () => {
        notifConnectingRef.current = false;
        console.debug('[Notifications WS] connected');
      });

      ws.addEventListener('message', (ev) => {
        try {
          const notification = JSON.parse(ev.data);
          if (notification.id && notification.timestamp) {
            mergeIncomingNotification(notification);
          }
        } catch {
          // ignore malformed messages
        }
      });

      ws.addEventListener('close', () => {
        notifConnectingRef.current = false;
        notifReconnectRef.current = setTimeout(connect, 3000);
      });

      ws.addEventListener('error', () => {
        notifConnectingRef.current = false;
        try { ws.close(); } catch {}
      });
    };

    connect();

    return () => {
      notifConnectingRef.current = false;
      if (notifReconnectRef.current) {
        clearTimeout(notifReconnectRef.current);
        notifReconnectRef.current = null;
      }
      if (notifWsRef.current) {
        try { notifWsRef.current.close(); } catch {}
        notifWsRef.current = null;
      }
    };
  }, []); // Remove queryClient dependency

  return null;
}