import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Flame, 
  ChefHat, 
  CheckCircle2, 
  AlertTriangle, 
  Utensils, 
  ShoppingBag, 
  MessageSquare,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { DietaryIcon } from '../DietaryBadge';

export const OrderCard = ({ order, onAdvanceStatus, isActionLoading }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    const startTime = new Date(order.receivedAt || order.createdAt || Date.now()).getTime();
    return Math.max(0, Math.floor((Date.now() - startTime) / 1000));
  });

  const [errorMessage, setErrorMessage] = useState(null);

  // Live timer tick every second for active orders
  useEffect(() => {
    const startTime = new Date(order.receivedAt || order.createdAt || Date.now()).getTime();

    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [order.receivedAt, order.createdAt]);

  // Format seconds into minutes & seconds string: "14m 25s"
  const formatElapsed = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const isUrgent = elapsedSeconds >= 15 * 60; // 15 mins or older is marked Urgent
  const isNew = order.status === 'Received';
  const isPreparing = order.status === 'Preparing';
  const isReady = order.status === 'Ready';

  // Format placed time
  const placedTimeStr = new Date(order.receivedAt || order.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleAdvance = async (nextStatus) => {
    setErrorMessage(null);
    const result = await onAdvanceStatus(order.orderId, nextStatus);
    if (!result.success) {
      setErrorMessage(result.error);
    }
  };

  // Card theme styling by state & urgency
  let headerBg = 'bg-stone-800 text-stone-100';
  let cardBorder = 'border-stone-200';
  let badgeColor = 'bg-stone-100 text-stone-700';

  if (isUrgent && (isNew || isPreparing)) {
    headerBg = 'bg-gradient-to-r from-red-600 to-rose-700 text-white animate-pulse';
    cardBorder = 'border-red-500 shadow-xl shadow-red-500/10 ring-2 ring-red-500/30';
  } else if (isNew) {
    headerBg = 'bg-gradient-to-r from-amber-500 to-orange-600 text-white';
    cardBorder = 'border-amber-300 shadow-md shadow-amber-500/10';
  } else if (isPreparing) {
    headerBg = 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white';
    cardBorder = 'border-blue-300 shadow-md shadow-blue-500/10';
  } else if (isReady) {
    headerBg = 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white';
    cardBorder = 'border-emerald-300 shadow-md shadow-emerald-500/10';
  }

  return (
    <div
      className={`bg-white rounded-2xl border ${cardBorder} flex flex-col justify-between overflow-hidden transition-all duration-200`}
    >
      <div>
        {/* Ticket Top Header Bar */}
        <div className={`px-4 py-2.5 flex items-center justify-between text-xs font-bold ${headerBg}`}>
          <div className="flex items-center gap-2">
            {isUrgent ? (
              <span className="flex items-center gap-1 uppercase tracking-wider font-extrabold bg-black/30 px-2 py-0.5 rounded-full">
                <Flame className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                Urgent Delay
              </span>
            ) : isNew ? (
              <span className="flex items-center gap-1 uppercase tracking-wider font-extrabold bg-black/20 px-2 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                New Order
              </span>
            ) : isPreparing ? (
              <span className="flex items-center gap-1 uppercase tracking-wider font-extrabold bg-black/20 px-2 py-0.5 rounded-full">
                <ChefHat className="w-3.5 h-3.5" />
                Cooking in Kitchen
              </span>
            ) : (
              <span className="flex items-center gap-1 uppercase tracking-wider font-extrabold bg-black/20 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ready to Serve
              </span>
            )}
          </div>

          {/* Live Elapsed Waiting Time Ticker */}
          <div
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-xs font-extrabold ${
              isUrgent
                ? 'bg-white text-red-700 shadow-xs'
                : 'bg-black/25 text-white'
            }`}
            title="Elapsed waiting time since order received"
          >
            <Clock className="w-3 h-3" />
            <span>{formatElapsed(elapsedSeconds)}</span>
          </div>
        </div>

        {/* Ticket Metadata Bar: Table, Dining Mode & Time */}
        <div className="p-3.5 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-stone-400 block uppercase tracking-wider font-mono">
              Ticket #{order.orderId}
            </span>
            <div className="flex items-center gap-1.5 font-black text-stone-900 text-sm sm:text-base">
              {order.orderType === 'Dine-in' ? (
                <>
                  <Utensils className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>{order.tableNumber || 'Table 04'}</span>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded uppercase">
                    Dine-in
                  </span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>{order.tableNumber || 'Takeaway Pickup'}</span>
                  <span className="text-[10px] font-bold bg-purple-100 text-purple-900 px-1.5 py-0.2 rounded uppercase">
                    Takeaway
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="text-right text-xs">
            <span className="text-stone-400 block text-[10px] uppercase font-semibold">Placed At</span>
            <span className="font-bold text-stone-800 font-mono">{placedTimeStr}</span>
          </div>
        </div>

        {/* Server Error Alert if any occurred during status update */}
        {errorMessage && (
          <div className="p-2.5 bg-red-50 border-b border-red-200 text-xs text-red-700 flex items-start gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <div className="flex-1 leading-snug">
              <span className="font-bold">Transition Blocked: </span>
              {errorMessage}
            </div>
          </div>
        )}

        {/* Kitchen Notes Banner if customer specified instructions */}
        {order.kitchenNotes && (
          <div className="p-2.5 bg-amber-50 border-b border-amber-200/80 text-xs text-amber-950 flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold uppercase text-[10px] tracking-wider text-amber-800 block">
                Customer Kitchen Note:
              </span>
              <p className="font-semibold text-amber-950 italic mt-0.5">
                "{order.kitchenNotes}"
              </p>
            </div>
          </div>
        )}

        {/* Dishes & Items List */}
        <div className="p-3.5 space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
            Items to Cook ({order.items.length})
          </span>

          <div className="divide-y divide-stone-100 border border-stone-200/70 rounded-xl overflow-hidden bg-white shadow-2xs">
            {order.items.map((it, idx) => (
              <div
                key={`${it.itemId}_${it.variantKey || idx}`}
                className="p-3 flex items-start justify-between gap-2.5 hover:bg-stone-50/70 transition-colors"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    <DietaryIcon isVeg={it.isVeg} size="sm" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-stone-900 text-sm leading-snug">
                      {it.name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-stone-500">
                      {it.variantLabel ? (
                        <span className="font-bold text-orange-800 bg-orange-50 border border-orange-200/60 px-1.5 py-0.2 rounded text-[11px]">
                          {it.variantLabel} {it.portion ? `(${it.portion})` : ''}
                        </span>
                      ) : (
                        it.portion && (
                          <span className="text-[11px] text-stone-500">
                            {it.portion}
                          </span>
                        )
                      )}
                      {it.notes && (
                        <span className="text-[11px] text-amber-700 italic">
                          • {it.notes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Big Quantity Pill for Kitchen readability */}
                <div className="shrink-0">
                  <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-stone-900 text-white font-black text-sm font-mono shadow-xs">
                    ×{it.quantity}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Struck-through Cancelled Items if any were removed */}
          {order.cancelledItems && order.cancelledItems.length > 0 && (
            <div className="pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 block mb-1">
                Removed from Ticket ({order.cancelledItems.length})
              </span>
              <div className="divide-y divide-red-100 border border-red-200/60 rounded-xl overflow-hidden bg-red-50/30">
                {order.cancelledItems.map((ci, idx) => (
                  <div key={idx} className="p-2 flex items-center justify-between text-xs text-stone-400">
                    <div className="flex items-center gap-1.5">
                      <span className="line-through text-stone-500 font-medium">{ci.name}</span>
                      {ci.variantLabel && (
                        <span className="text-[10px] bg-stone-100 px-1 py-0.2 rounded">
                          {ci.variantLabel}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-red-600 bg-red-100/80 px-2 py-0.2 rounded-full">
                      Cancelled
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Action Controls: Advancing Status */}
      <div className="p-3.5 bg-stone-50 border-t border-stone-200/80">
        {isNew && (
          <button
            type="button"
            disabled={isActionLoading}
            onClick={() => handleAdvance('Preparing')}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
          >
            {isActionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <ChefHat className="w-4 h-4" />
                <span>Start Preparing</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        )}

        {isPreparing && (
          <button
            type="button"
            disabled={isActionLoading}
            onClick={() => handleAdvance('Ready')}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
          >
            {isActionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark as Ready for Pickup</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        )}

        {isReady && (
          <button
            type="button"
            disabled={isActionLoading}
            onClick={() => handleAdvance('Served')}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-stone-800 via-stone-900 to-black hover:from-stone-900 hover:to-black text-white font-black text-sm shadow-md flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
          >
            {isActionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Complete & Served</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
