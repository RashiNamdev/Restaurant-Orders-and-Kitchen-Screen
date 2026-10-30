import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  fetchOrderByIdApi 
} from '../services/orderApi';
import socketService from '../services/socketService';
import { useCart } from '../context/CartContext';
import { 
  Clock, 
  ChefHat, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  ArrowLeft, 
  MapPin, 
  ShoppingBag, 
  UtensilsCrossed, 
  Wifi, 
  WifiOff, 
  Check, 
  Sparkles,
  Flame,
  BellRing,
  Award
} from 'lucide-react';
import { DietaryIcon } from '../components/DietaryBadge';

export const OrderTrackingPage = ({ initialOrderId, onBackToMenu }) => {
  const { activeOrder, setActiveOrder } = useCart();
  
  // Resolve orderId from prop or active order in cart context
  const [currentOrderId, setCurrentOrderId] = useState(
    initialOrderId || activeOrder?.orderId || ''
  );
  const [inputOrderId, setInputOrderId] = useState(currentOrderId);
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(Boolean(currentOrderId));
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load order data from backend
  const loadOrder = useCallback(async (id, isSilent = false) => {
    if (!id || !id.trim()) {
      setOrder(null);
      setLoading(false);
      return;
    }

    if (!isSilent) setLoading(true);
    setIsRefreshing(true);
    setError(null);

    try {
      const data = await fetchOrderByIdApi(id.trim());
      setOrder(data);
      setLastSyncTime(new Date());

      // If this matches active customer order, keep CartContext in sync
      if (activeOrder && activeOrder.orderId === data.orderId) {
        setActiveOrder((prev) => ({
          ...prev,
          status: data.status,
          updatedAt: data.updatedAt,
        }));
      }
    } catch (err) {
      console.error('Failed to load order:', err);
      setError(err.message || 'Unable to locate order. Please check the order ID.');
      setOrder(null);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [activeOrder, setActiveOrder]);

  // Initial fetch on mount or ID change
  useEffect(() => {
    if (currentOrderId) {
      loadOrder(currentOrderId);
    } else {
      setLoading(false);
    }
  }, [currentOrderId, loadOrder]);

  // Subscribe to real-time Socket.IO status updates & handle reconnect recovery
  useEffect(() => {
    if (!currentOrderId) return;

    // 1. Subscribe to order room
    const unsubscribe = socketService.subscribeToCustomerOrder({
      orderId: currentOrderId,
      onStatusUpdated: (payload) => {
        if (!payload || (payload.orderId && payload.orderId !== currentOrderId)) return;

        // Immediate local state update
        setOrder((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: payload.status,
            updatedAt: payload.updatedAt || new Date().toISOString(),
            statusHistory: payload.statusHistory || prev.statusHistory,
          };
        });

        setLastSyncTime(new Date());
      },
    });

    // 2. Recovery on socket reconnect
    const customerSocket = socketService.getCustomerSocket();
    const handleReconnect = () => {
      setSocketConnected(true);
      // Re-fetch authoritative status from API after recovering from disconnection
      loadOrder(currentOrderId, true);
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    customerSocket.on('connect', handleReconnect);
    customerSocket.on('disconnect', handleDisconnect);

    return () => {
      unsubscribe();
      customerSocket.off('connect', handleReconnect);
      customerSocket.off('disconnect', handleDisconnect);
    };
  }, [currentOrderId, loadOrder]);

  // Handle order search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (inputOrderId.trim()) {
      setCurrentOrderId(inputOrderId.trim());
    }
  };

  // Four-stage order progress definitions
  const STAGES = [
    {
      id: 'Received',
      name: 'Order Received',
      desc: 'Ticket sent to chef station',
      icon: CheckCircle2,
      color: 'emerald',
    },
    {
      id: 'Preparing',
      name: 'Preparing Dishes',
      desc: 'Freshly cooking on stove & tandoor',
      icon: Flame,
      color: 'amber',
    },
    {
      id: 'Ready',
      name: 'Ready for Service',
      desc: 'Plated, garnished & packaged',
      icon: BellRing,
      color: 'blue',
    },
    {
      id: 'Served',
      name: 'Order Served',
      desc: 'Delivered to your table',
      icon: Award,
      color: 'purple',
    },
  ];

  const statusOrder = ['Received', 'Preparing', 'Ready', 'Served'];
  const currentStatusIndex = order ? statusOrder.indexOf(order.status) : -1;
  const isCancelled = order?.status === 'Cancelled';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Top Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBackToMenu && (
              <button
                type="button"
                onClick={onBackToMenu}
                className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors shadow-2xs cursor-pointer"
                title="Back to Customer Menu"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <ChefHat className="w-6 h-6 text-orange-600" />
                Live Order Tracking
              </h1>
              <p className="text-xs text-gray-500">
                Real-time kitchen progress powered by Socket.IO
              </p>
            </div>
          </div>

          {/* Connection & Live Sync Indicator */}
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold border ${
                socketConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {socketConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <Wifi className="w-3.5 h-3.5" />
                  Live Sync Active
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <WifiOff className="w-3.5 h-3.5" />
                  Disconnected
                </>
              )}
            </span>

            {order && (
              <button
                type="button"
                onClick={() => loadOrder(order.orderId)}
                disabled={isRefreshing}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors"
                title="Refresh order status from server"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-orange-600' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Search / Lookup Bar for Order ID */}
        <div className="bg-white rounded-2xl p-3 shadow-xs border border-gray-200">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inputOrderId}
                onChange={(e) => setInputOrderId(e.target.value)}
                placeholder="Enter Order ID (e.g., KTC-2026-9815)..."
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 font-mono font-bold"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              Track
            </button>
          </form>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-orange-500 border-t-transparent animate-spin mx-auto" />
            <div>
              <h3 className="font-bold text-gray-900 text-base">Locating Your Kitchen Ticket...</h3>
              <p className="text-xs text-gray-500">Connecting to restaurant live stream</p>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {error && !loading && (
          <div className="bg-white rounded-3xl p-8 text-center border border-red-200 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-gray-900 text-base">Order Not Found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">{error}</p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => loadOrder(currentOrderId)}
                className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition-all"
              >
                Retry Search
              </button>
              {onBackToMenu && (
                <button
                  type="button"
                  onClick={onBackToMenu}
                  className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all"
                >
                  Return to Menu
                </button>
              )}
            </div>
          </div>
        )}

        {/* EMPTY NO ORDER SELECTED */}
        {!loading && !error && !order && (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-sm space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 mx-auto flex items-center justify-center">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-gray-900 text-base">No Order Selected</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Please enter an order ID above or place an order from the customer menu to start live tracking.
            </p>
            {onBackToMenu && (
              <button
                type="button"
                onClick={onBackToMenu}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 hover:bg-orange-700"
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                Browse Menu
              </button>
            )}
          </div>
        )}

        {/* ACTIVE ORDER CONTENT */}
        {!loading && !error && order && (
          <div className="space-y-6">

            {/* ORDER BANNER & TOP SUMMARY */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                    Customer Kitchen Receipt
                  </span>
                  <div className="flex items-center gap-2.5 mt-0.5">
                    <span className="text-xl sm:text-2xl font-black font-mono text-gray-900">
                      #{order.orderId}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                        isCancelled
                          ? 'bg-red-100 text-red-700'
                          : order.status === 'Served'
                          ? 'bg-purple-100 text-purple-800'
                          : order.status === 'Ready'
                          ? 'bg-blue-100 text-blue-800'
                          : order.status === 'Preparing'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 font-bold text-amber-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    <span>{order.orderType === 'Dine-in' ? `${order.tableNumber}` : 'Takeaway'}</span>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 font-medium text-gray-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              {/* FOUR-STAGE PROGRESS TRACKER */}
              {!isCancelled ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-orange-500" />
                      Kitchen Progress Tracker
                    </span>
                    <span className="text-gray-400">
                      Updated {lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'just now'}
                    </span>
                  </div>

                  {/* Desktop Progress Bar (4 Columns) */}
                  <div className="grid grid-cols-4 gap-2 sm:gap-3">
                    {STAGES.map((stg, idx) => {
                      const isComplete = idx < currentStatusIndex;
                      const isCurrent = idx === currentStatusIndex;
                      const Icon = stg.icon;

                      let cardStyle = 'bg-gray-50 border-gray-200 text-gray-400 opacity-60';
                      let iconBg = 'bg-gray-200 text-gray-400';

                      if (isComplete) {
                        cardStyle = 'bg-emerald-50/70 border-emerald-200 text-emerald-900';
                        iconBg = 'bg-emerald-600 text-white shadow-xs';
                      } else if (isCurrent) {
                        cardStyle = 'bg-orange-50 border-orange-300 text-orange-950 ring-2 ring-orange-300 ring-offset-1 shadow-sm';
                        iconBg = 'bg-orange-500 text-white animate-pulse shadow-md shadow-orange-500/30';
                      }

                      return (
                        <div
                          key={stg.id}
                          className={`p-3 rounded-2xl border transition-all text-center flex flex-col items-center justify-center ${cardStyle}`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 ${iconBg}`}>
                            {isComplete ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                          </div>
                          <span className="font-extrabold text-[11px] sm:text-xs block leading-tight">
                            {stg.name}
                          </span>
                          <span className="hidden sm:block text-[9px] text-gray-500 mt-0.5 line-clamp-1">
                            {stg.desc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <span>This order ticket was cancelled. Kitchen preparation has stopped.</span>
                </div>
              )}
            </div>

            {/* ITEMS BREAKDOWN & RECEIPT */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-600">
                Dishes on This Ticket ({order.items?.length || 0})
              </h3>

              <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                {order.items?.map((it, idx) => (
                  <div key={it._id || idx} className="p-3.5 flex items-center justify-between gap-3 hover:bg-gray-50/60">
                    <div className="flex items-center gap-3 min-w-0">
                      <DietaryIcon isVeg={it.isVeg} size="sm" />
                      <div className="min-w-0">
                        <span className="font-bold text-gray-900 text-xs sm:text-sm block truncate">
                          {it.name}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                          {it.variant && (
                            <span className="font-bold text-orange-700 bg-orange-50 px-1.5 py-0.2 rounded">
                              {it.variant} Plate
                            </span>
                          )}
                          <span>Qty: {it.quantity}</span>
                          <span>•</span>
                          <span>₹{it.unitPrice} each</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-black text-xs sm:text-sm text-gray-900 font-mono">
                        ₹{(it.unitPrice * it.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Kitchen notes */}
              {order.kitchenNotes && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900">
                  <span className="font-bold block mb-0.5">Special Cooking Instructions:</span>
                  <span>"{order.kitchenNotes}"</span>
                </div>
              )}

              {/* Financial Billing Calculation */}
              <div className="border-t border-gray-100 pt-3 space-y-1.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">₹{order.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span className="font-semibold text-gray-900">₹{order.taxAmount}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-gray-900 pt-2 border-t border-gray-100">
                  <span>Final Total</span>
                  <span className="text-orange-600 font-mono text-base">₹{order.totalAmount || order.grandTotal}</span>
                </div>
              </div>
            </div>

            {/* AUDIT STATUS HISTORY LOG */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500">
                  Order Status Timeline
                </h4>
                <div className="space-y-2">
                  {order.statusHistory.map((sh, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-none">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        <span className="font-bold text-gray-800">{sh.status}</span>
                        {sh.note && <span className="text-gray-400 italic">({sh.note})</span>}
                      </div>
                      <span className="text-gray-400 font-mono">
                        {new Date(sh.changedAt || Date.now()).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
