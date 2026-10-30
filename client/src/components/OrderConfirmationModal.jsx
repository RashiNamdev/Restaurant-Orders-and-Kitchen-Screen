import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  Sparkles, 
  Utensils, 
  X, 
  Trash2, 
  AlertTriangle,
  RotateCcw,
  Check,
  ShieldAlert
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { DietaryIcon } from './DietaryBadge';
import { RemoveItemConfirmModal } from './RemoveItemConfirmModal';

export const OrderConfirmationModal = () => {
  const { 
    confirmedOrder, 
    setConfirmedOrder, 
    removeItemFromActiveOrder, 
    cancelActiveOrder,
    clearActiveOrder 
  } = useCart();

  const [itemToRemove, setItemToRemove] = useState(null);
  const [showCancelOrderConfirm, setShowCancelOrderConfirm] = useState(false);

  if (!confirmedOrder) return null;

  const isCancelled = confirmedOrder.status === 'Cancelled' || confirmedOrder.items.length === 0;

  const handleOpenRemoveItem = (item) => {
    setItemToRemove(item);
  };

  const handleConfirmRemoveItem = (cartKey, removeAll, reason) => {
    removeItemFromActiveOrder(cartKey, removeAll, reason);
    setItemToRemove(null);
  };

  const handleConfirmCancelEntireOrder = () => {
    cancelActiveOrder('Customer cancelled entire ticket');
    setShowCancelOrderConfirm(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div 
          className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Banner */}
          <div className={`p-6 text-center relative ${
            isCancelled 
              ? 'bg-gradient-to-br from-rose-700 via-red-800 to-stone-900 text-white'
              : 'bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 text-white'
          }`}>
            <button
              type="button"
              onClick={() => setConfirmedOrder(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-full bg-white/20 mx-auto flex items-center justify-center mb-3 backdrop-blur-xs">
              {isCancelled ? (
                <ShieldAlert className="w-10 h-10 text-white animate-in zoom-in" />
              ) : (
                <CheckCircle2 className="w-10 h-10 text-white animate-in zoom-in" />
              )}
            </div>

            <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest bg-white/25 px-3 py-1 rounded-full mb-1">
              {isCancelled ? 'Order Ticket Voided' : 'Order Sent to Kitchen'}
            </span>

            <h3 className="text-2xl font-black tracking-tight">
              {isCancelled ? 'Order Cancelled' : 'Order Confirmed!'}
            </h3>

            <p className="text-xs text-white/90 mt-1 max-w-xs mx-auto">
              {isCancelled
                ? 'All items in this order have been removed. No food will be cooked.'
                : 'Our chef has received your ticket and is preparing your meal fresh in the kitchen.'}
            </p>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
            {/* Quick Ticket Stats */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-xs">
              <div>
                <span className="text-gray-400 block font-medium">Order Number</span>
                <span className="font-extrabold text-sm text-gray-900 font-mono">
                  {confirmedOrder.orderId}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Table / Mode</span>
                <span className="font-bold text-sm text-amber-800">
                  {confirmedOrder.orderType === 'Dine-in'
                    ? `${confirmedOrder.tableNumber}`
                    : 'Takeaway'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Order Time</span>
                <span className="font-bold text-gray-800">{confirmedOrder.placedAt}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Kitchen Status</span>
                <span className={`font-bold flex items-center gap-1 ${
                  isCancelled ? 'text-red-600' : 'text-emerald-700'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  {isCancelled ? 'Cancelled' : confirmedOrder.status || 'Received'}
                </span>
              </div>
            </div>

            {/* Grace Window / Removal Helper Notice */}
            {!isCancelled && (
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
                <ChefHat className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Need to change or cancel a dish?</span>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    You can remove items from your active order below. The kitchen display screen updates in real time.
                  </p>
                </div>
              </div>
            )}

            {/* Active Items List */}
            {!isCancelled && confirmedOrder.items.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Active Kitchen Dishes ({confirmedOrder.items.length})
                  </span>
                  <span className="text-[11px] text-gray-400">Action</span>
                </div>

                <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden shadow-2xs">
                  {confirmedOrder.items.map((it) => (
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
                            <span className="font-medium">Qty: {it.quantity}</span>
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
                        className="inline-flex items-center gap-1 py-1.5 px-2.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-all shrink-0 active:scale-95 cursor-pointer"
                        title="Remove this dish from your kitchen ticket"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cancelled Items Section (if any were removed) */}
            {confirmedOrder.cancelledItems && confirmedOrder.cancelledItems.length > 0 && (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-red-500 mb-2 block">
                  Cancelled / Removed Dishes ({confirmedOrder.cancelledItems.length})
                </span>
                <div className="divide-y divide-red-100 border border-red-100 rounded-2xl overflow-hidden bg-red-50/30">
                  {confirmedOrder.cancelledItems.map((ci, idx) => (
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
                      <span className="text-[10px] font-bold text-red-600 bg-red-100/80 px-2 py-0.5 rounded-full">
                        Removed ({ci.cancelledAt})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Kitchen notes if any */}
            {confirmedOrder.kitchenNotes && (
              <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900">
                <span className="font-bold block mb-0.5">Kitchen Note:</span>
                <span>"{confirmedOrder.kitchenNotes}"</span>
              </div>
            )}

            {/* Bill Totals */}
            {!isCancelled && (
              <div className="pt-2 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">₹{confirmedOrder.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span className="font-semibold text-gray-900">₹{confirmedOrder.taxAmount}</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm text-gray-900 pt-1.5 border-t border-gray-100">
                  <span>Current Bill Total</span>
                  <span className="text-orange-600 font-black">₹{confirmedOrder.grandTotal}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-2">
              {!isCancelled ? (
                <>
                  <button
                    type="button"
                    onClick={() => setConfirmedOrder(null)}
                    className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-99 cursor-pointer"
                  >
                    Order More Dishes
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCancelOrderConfirm(true)}
                    className="w-full py-2.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel Entire Order
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    clearActiveOrder();
                    setConfirmedOrder(null);
                  }}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer"
                >
                  Create New Order
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Item Removal Confirmation Dialog */}
      <RemoveItemConfirmModal
        isOpen={Boolean(itemToRemove)}
        item={itemToRemove}
        orderId={confirmedOrder.orderId}
        onConfirm={handleConfirmRemoveItem}
        onClose={() => setItemToRemove(null)}
      />

      {/* Entire Order Cancellation Confirmation Dialog */}
      {showCancelOrderConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-gray-900">Cancel Entire Order?</h4>
              <p className="text-xs text-gray-500 mt-1">
                This will void order #{confirmedOrder.orderId} and instruct the kitchen to stop preparing all items on your ticket.
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
                onClick={handleConfirmCancelEntireOrder}
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
