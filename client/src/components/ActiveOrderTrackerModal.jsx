import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Clock, 
  ChefHat, 
  Utensils, 
  AlertTriangle, 
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { DietaryIcon } from './DietaryBadge';
import { RemoveItemConfirmModal } from './RemoveItemConfirmModal';

export const ActiveOrderTrackerModal = () => {
  const { 
    activeOrder, 
    isOrderTrackerOpen, 
    setIsOrderTrackerOpen, 
    removeItemFromActiveOrder,
    cancelActiveOrder,
    clearActiveOrder
  } = useCart();

  const [itemToRemove, setItemToRemove] = useState(null);
  const [showCancelOrderConfirm, setShowCancelOrderConfirm] = useState(false);

  if (!isOrderTrackerOpen || !activeOrder) return null;

  const isCancelled = activeOrder.status === 'Cancelled' || activeOrder.items.length === 0;

  const handleOpenRemoveItem = (item) => {
    setItemToRemove(item);
  };

  const handleConfirmRemove = (cartKey, removeAll, reason) => {
    removeItemFromActiveOrder(cartKey, removeAll, reason);
    setItemToRemove(null);
  };

  const handleConfirmCancelOrder = () => {
    cancelActiveOrder('Customer cancelled active ticket');
    setShowCancelOrderConfirm(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div 
          className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-black">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-gray-900 text-base">
                    Active Kitchen Ticket
                  </h3>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    isCancelled
                      ? 'bg-red-100 text-red-700'
                      : 'bg-emerald-100 text-emerald-800 flex items-center gap-1'
                  }`}>
                    {!isCancelled && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                    {isCancelled ? 'Cancelled' : activeOrder.status || 'Received'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Order #{activeOrder.orderId} • {activeOrder.orderType === 'Takeaway' ? 'Takeaway' : activeOrder.tableNumber}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOrderTrackerOpen(false)}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Ticket Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
            {/* Dynamic Real-time Status Steps */}
            {!isCancelled && (() => {
              const stages = [
                { id: 'Received', label: '1. Received', icon: '✓' },
                { id: 'Preparing', label: '2. Cooking', icon: '👨‍🍳' },
                { id: 'Ready', label: '3. Plated', icon: '🔔' },
                { id: 'Served', label: '4. Served', icon: '🍽️' },
              ];
              const statusOrder = ['Received', 'Preparing', 'Ready', 'Served'];
              const currentIdx = statusOrder.indexOf(activeOrder.status || 'Received');

              return (
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-amber-950 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Live Kitchen Progress
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Socket Sync
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-center text-[11px] font-bold">
                    {stages.map((stage, idx) => {
                      const isCompleted = idx < currentIdx;
                      const isCurrent = idx === currentIdx;

                      let style = 'bg-white text-gray-400 border border-gray-200';
                      if (isCompleted) {
                        style = 'bg-emerald-600 text-white shadow-2xs';
                      } else if (isCurrent) {
                        style = 'bg-amber-400 text-amber-950 shadow-xs ring-2 ring-amber-300 ring-offset-1 animate-pulse';
                      }

                      return (
                        <div
                          key={stage.id}
                          className={`p-1.5 rounded-lg transition-all flex flex-col items-center justify-center ${style}`}
                        >
                          <span className="text-[10px]">{stage.icon}</span>
                          <span className="leading-tight text-[10px] sm:text-[11px] truncate max-w-full">
                            {stage.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-amber-900 mt-2.5">
                    💡 <span className="font-semibold">Live Updates:</span> Any status change by the chef updates your screen in real time without refreshing.
                  </p>
                </div>
              );
            })()}

            {/* Active Items */}
            {!isCancelled && activeOrder.items.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-gray-500">
                    Dishes on Ticket ({activeOrder.items.length})
                  </span>
                  <span className="text-[11px] text-gray-400">Tap to Cancel Dish</span>
                </div>

                <div className="divide-y divide-gray-100 border border-gray-200/80 rounded-2xl overflow-hidden shadow-2xs">
                  {activeOrder.items.map((it) => (
                    <div 
                      key={it.cartKey}
                      className="p-3 bg-white flex items-center justify-between gap-3 hover:bg-gray-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <DietaryIcon isVeg={it.isVeg} size="sm" />
                        <div className="min-w-0">
                          <span className="font-bold text-gray-900 text-xs sm:text-sm block truncate">
                            {it.name}
                          </span>
                          <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                            {it.variantLabel && (
                              <span className="font-semibold text-orange-700 bg-orange-50 px-1.5 py-0.2 rounded">
                                {it.variantLabel}
                              </span>
                            )}
                            <span>Qty: {it.quantity}</span>
                            <span>•</span>
                            <span className="font-extrabold text-gray-900">
                              ₹{it.unitPrice * it.quantity}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenRemoveItem(it)}
                        className="inline-flex items-center gap-1 py-1.5 px-3 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-all shrink-0 active:scale-95 cursor-pointer"
                        title="Remove dish from active kitchen order"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Item</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cancelled Items List (if any) */}
            {activeOrder.cancelledItems && activeOrder.cancelledItems.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-red-500 block">
                  Cancelled Dishes ({activeOrder.cancelledItems.length})
                </span>
                <div className="divide-y divide-red-100 border border-red-100 rounded-2xl overflow-hidden bg-red-50/30">
                  {activeOrder.cancelledItems.map((ci, idx) => (
                    <div key={`${ci.cartKey}_${idx}`} className="p-2.5 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <span className="line-through text-gray-400 font-medium">{ci.name}</span>
                        {ci.variantLabel && (
                          <span className="text-[10px] bg-gray-100 px-1.5 py-0.2 rounded text-gray-400">
                            {ci.variantLabel}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400">× {ci.quantity}</span>
                      </div>
                      <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                        Cancelled at {ci.cancelledAt}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Kitchen notes */}
            {activeOrder.kitchenNotes && (
              <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900">
                <span className="font-bold block mb-0.5">Kitchen Note:</span>
                <span>"{activeOrder.kitchenNotes}"</span>
              </div>
            )}

            {/* Updated Total */}
            {!isCancelled && (
              <div className="pt-2 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">₹{activeOrder.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span className="font-semibold text-gray-900">₹{activeOrder.taxAmount}</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm text-gray-900 pt-1.5 border-t border-gray-100">
                  <span>Active Bill Total</span>
                  <span className="text-orange-600 font-black">₹{activeOrder.grandTotal}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-2">
              {!isCancelled ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsOrderTrackerOpen(false)}
                    className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-99 cursor-pointer"
                  >
                    Back to Menu
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCancelOrderConfirm(true)}
                    className="w-full py-2.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel Entire Order Ticket
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    clearActiveOrder();
                    setIsOrderTrackerOpen(false);
                  }}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer"
                >
                  Start New Order
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Remove Confirmation Dialog */}
      <RemoveItemConfirmModal
        isOpen={Boolean(itemToRemove)}
        item={itemToRemove}
        orderId={activeOrder.orderId}
        onConfirm={handleConfirmRemove}
        onClose={() => setItemToRemove(null)}
      />

      {/* Entire Order Cancel Confirm */}
      {showCancelOrderConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-gray-900">Cancel Entire Order?</h4>
              <p className="text-xs text-gray-500 mt-1">
                This will void order #{activeOrder.orderId} and notify the kitchen to stop preparing your meal.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelOrderConfirm(false)}
                className="py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100"
              >
                No, Keep It
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelOrder}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md"
              >
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
