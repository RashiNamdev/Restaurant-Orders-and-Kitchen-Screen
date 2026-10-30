import { useState, useEffect, useCallback, useRef } from 'react';
import socketService from '../services/socketService';
import { fetchOrders, updateOrderStatusApi, seedDemoOrdersApi } from '../services/orderApi';

export const useKitchenOrders = (view = 'active', selectedStatusFilter = 'all') => {
  const [orders, setOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeUserRole, setActiveUserRole] = useState('kitchen'); // 'kitchen' | 'admin' | 'staff' | 'customer'
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const socketRef = useRef(null);

  // Play gentle web audio chime on new ticket
  const playNewOrderChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // AudioContext not allowed without user interaction
    }
  }, [soundEnabled]);

  // Load orders from API
  const refreshOrders = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [activeData, historyData] = await Promise.all([
        fetchOrders('active'),
        fetchOrders('history'),
      ]);

      // If active list is completely empty, try auto-seeding demo orders
      if (activeData.length === 0 && historyData.length === 0 && isInitial) {
        await seedDemoOrdersApi();
        const reloaded = await fetchOrders('active');
        setOrders(reloaded);
      } else {
        setOrders(activeData);
      }

      setHistoryOrders(historyData);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load kitchen orders:', err);
      setError(err.message || 'Could not connect to kitchen order stream');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  // Connect to Socket.IO server and manage live kitchen stream
  useEffect(() => {
    // Initial fetch to load history and backup active orders
    refreshOrders(true);

    const socket = socketService.getKitchenSocket(activeUserRole);
    socketRef.current = socket;

    const handleConnect = () => {
      setSocketConnected(true);
      // Ensure kitchen room subscription
      socket.emit('join:kitchen');
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    // 1. Initial snapshot of active orders pushed immediately on connection
    const handleActiveSnapshot = (snapshotOrders) => {
      if (Array.isArray(snapshotOrders)) {
        setOrders(snapshotOrders);
        setLoading(false);
        setError(null);
        setLastUpdated(new Date());
      }
    };

    // 2. Real-time incoming new order ticket
    const handleNewOrder = (newOrder) => {
      if (!newOrder || !newOrder.orderId) return;
      setOrders((prev) => {
        // Prevent duplicate tickets if already rendered
        if (prev.some((o) => o.orderId === newOrder.orderId)) return prev;
        return [newOrder, ...prev];
      });
      playNewOrderChime();
      setLastUpdated(new Date());
    };

    // 3. Real-time order status transition (Received -> Preparing -> Ready -> Served)
    const handleStatusUpdate = (updatedOrder) => {
      if (!updatedOrder || !updatedOrder.orderId) return;
      const isTerminal = ['Served', 'Cancelled'].includes(updatedOrder.status);

      setOrders((prev) => {
        if (isTerminal) {
          return prev.filter((o) => o.orderId !== updatedOrder.orderId);
        }
        return prev.map((o) =>
          o.orderId === updatedOrder.orderId ? { ...o, ...updatedOrder } : o
        );
      });

      if (isTerminal) {
        setHistoryOrders((prev) => [
          updatedOrder,
          ...prev.filter((o) => o.orderId !== updatedOrder.orderId),
        ]);
      }

      setLastUpdated(new Date());
    };

    // Attach event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('kitchen:active_snapshot', handleActiveSnapshot);
    socket.on('order:new', handleNewOrder);
    socket.on('order:created', handleNewOrder);
    socket.on('order:statusUpdated', handleStatusUpdate);
    socket.on('order:status_updated', handleStatusUpdate);

    if (socket.connected) {
      setSocketConnected(true);
      socket.emit('join:kitchen');
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('kitchen:active_snapshot', handleActiveSnapshot);
      socket.off('order:new', handleNewOrder);
      socket.off('order:created', handleNewOrder);
      socket.off('order:statusUpdated', handleStatusUpdate);
      socket.off('order:status_updated', handleStatusUpdate);
    };
  }, [activeUserRole, refreshOrders, playNewOrderChime]);

  // Advance order status action
  const advanceOrderStatus = async (orderId, nextStatus, note = '') => {
    setActionLoadingId(orderId);
    try {
      const updated = await updateOrderStatusApi(orderId, nextStatus, activeUserRole, note);

      // Optimistic state update
      const isTerminal = ['Served', 'Cancelled'].includes(nextStatus);

      setOrders((prev) => {
        if (isTerminal) {
          return prev.filter((o) => o.orderId !== orderId);
        }
        return prev.map((o) => (o.orderId === orderId ? updated : o));
      });

      if (isTerminal) {
        setHistoryOrders((prev) => [updated, ...prev.filter((o) => o.orderId !== orderId)]);
      }

      return { success: true, order: updated };
    } catch (err) {
      console.error(`Error advancing order #${orderId} to ${nextStatus}:`, err);
      return { success: false, error: err.message };
    } finally {
      setActionLoadingId(null);
    }
  };

  // Re-seed demo orders button
  const handleSeedOrders = async () => {
    setLoading(true);
    try {
      await seedDemoOrdersApi();
      await refreshOrders(false);
    } finally {
      setLoading(false);
    }
  };

  // Filter active orders by status tab if requested
  const filteredActiveOrders = orders.filter((o) => {
    if (selectedStatusFilter === 'all') return true;
    return o.status === selectedStatusFilter;
  });

  return {
    orders: filteredActiveOrders,
    allActiveOrders: orders,
    historyOrders,
    loading,
    error,
    actionLoadingId,
    socketConnected,
    soundEnabled,
    setSoundEnabled,
    activeUserRole,
    setActiveUserRole,
    lastUpdated,
    advanceOrderStatus,
    refreshOrders,
    handleSeedOrders,
  };
};
