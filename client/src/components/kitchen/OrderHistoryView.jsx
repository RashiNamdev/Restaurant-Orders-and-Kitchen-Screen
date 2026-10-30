import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Utensils, 
  ShoppingBag, 
  Search, 
  Calendar,
  DollarSign,
  ChefHat
} from 'lucide-react';
import { DietaryIcon } from '../DietaryBadge';

export const OrderHistoryView = ({ historyOrders = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) return historyOrders;
    const term = searchTerm.toLowerCase().trim();
    return historyOrders.filter((ord) => {
      const matchId = ord.orderId.toLowerCase().includes(term);
      const matchTable = (ord.tableNumber || '').toLowerCase().includes(term);
      const matchItem = ord.items.some((it) => it.name.toLowerCase().includes(term));
      return matchId || matchTable || matchItem;
    });
  }, [historyOrders, searchTerm]);

  // Compute turnaround time between receivedAt and servedAt
  const getTurnaroundTime = (order) => {
    if (!order.servedAt || !order.receivedAt) return null;
    const diffMs = new Date(order.servedAt).getTime() - new Date(order.receivedAt).getTime();
    const diffMins = Math.max(1, Math.round(diffMs / (1000 * 60)));
    return `${diffMins} min turnaround`;
  };

  return (
    <div className="space-y-4">
      {/* Search & Header Stats */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
              Completed Orders History
            </h3>
            <p className="text-xs text-stone-500">
              {historyOrders.length} {historyOrders.length === 1 ? 'order' : 'orders'} served or closed
            </p>
          </div>
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Order #, table, dish..."
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>
      </div>

      {/* History Grid or Empty State */}
      {filteredHistory.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-md mx-auto my-6 space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-stone-100 mx-auto flex items-center justify-center text-stone-400">
            <Clock className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-stone-800 text-sm">No completed orders yet</h4>
          <p className="text-xs text-stone-500">
            When kitchen staff marks an order as "Complete & Served", it will appear here in the history log.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHistory.map((ord) => {
            const isServed = ord.status === 'Served';
            const turnaround = getTurnaroundTime(ord);
            const servedTimeStr = ord.servedAt
              ? new Date(ord.servedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : new Date(ord.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={ord.orderId}
                className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3 shadow-2xs hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2.5">
                  <div>
                    <span className="font-black text-sm text-stone-900 font-mono">
                      #{ord.orderId}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
                      {ord.orderType === 'Dine-in' ? (
                        <>
                          <Utensils className="w-3.5 h-3.5 text-orange-600" />
                          <span className="font-bold text-stone-800">{ord.tableNumber}</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5 text-purple-600" />
                          <span className="font-bold text-stone-800">Takeaway</span>
                        </>
                      )}
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-black uppercase px-2 py-0.5 rounded-full ${
                      isServed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {isServed ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Served</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-red-600" />
                        <span>Cancelled</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Timing stats */}
                <div className="flex items-center justify-between text-[11px] text-stone-500 bg-stone-50 p-2 rounded-xl">
                  <span>Served at: <strong className="text-stone-800 font-mono">{servedTimeStr}</strong></span>
                  {turnaround && (
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60">
                      ⏱ {turnaround}
                    </span>
                  )}
                </div>

                {/* Items summary */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                    Dishes Served ({ord.items.length})
                  </span>
                  <div className="divide-y divide-stone-100 border border-stone-100 rounded-xl overflow-hidden bg-stone-50/50">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="p-2 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <DietaryIcon isVeg={it.isVeg} size="sm" />
                          <span className="font-semibold text-stone-800 truncate">{it.name}</span>
                          {it.variantLabel && (
                            <span className="text-[10px] bg-stone-200/80 px-1 py-0.2 rounded text-stone-600 shrink-0">
                              {it.variantLabel}
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-stone-900 shrink-0 font-mono">
                          ×{it.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bill total */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-stone-700">
                  <span>Bill Total</span>
                  <span className="text-stone-900 font-black font-mono">₹{ord.grandTotal}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
