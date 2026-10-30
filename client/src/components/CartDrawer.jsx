import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ChefHat, 
  Clock, 
  Utensils, 
  MessageSquare,
  ArrowRight,
  AlertCircle,
  Loader2,
  Check
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { DietaryIcon } from './DietaryBadge';
import { RESTAURANT_INFO } from '../data/menuData';

const COMMON_TABLES = [
  'Table 01', 'Table 02', 'Table 03', 'Table 04',
  'Table 05', 'Table 06', 'Table 07', 'Table 08'
];

export const CartDrawer = () => {
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    tableNumber,
    setTableNumber,
    orderType,
    setOrderType,
    kitchenNotes,
    setKitchenNotes,
    totalItemCount,
    subtotal,
    taxAmount,
    grandTotal,
    placeOrder,
    isPlacingOrder,
    orderError,
    setOrderError,
  } = useCart();

  const [tableInputError, setTableInputError] = useState('');

  if (!isCartOpen) return null;

  const handleOrderTypeChange = (type) => {
    setOrderType(type);
    setTableInputError('');
    if (setOrderError) setOrderError(null);
  };

  const handleTableChange = (val) => {
    setTableNumber(val);
    if (val.trim()) {
      setTableInputError('');
      if (setOrderError) setOrderError(null);
    }
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;

    if (orderType === 'Dine-in') {
      const trimmed = (tableNumber || '').trim();
      if (!trimmed) {
        setTableInputError('Please enter or select a table number for Dine-in orders');
        return;
      }
    }

    try {
      await placeOrder();
    } catch {
      // Handled in CartContext state
    }
  };

  const isDineIn = orderType === 'Dine-in';
  const hasTableError = isDineIn && (!tableNumber || !tableNumber.trim());

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => !isPlacingOrder && setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 text-base sm:text-lg">
                  Order Checkout
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                  <span className="font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded">
                    {orderType} {isDineIn && tableNumber ? `• ${tableNumber}` : ''}
                  </span>
                  <span>•</span>
                  <span>{totalItemCount} {totalItemCount === 1 ? 'dish' : 'dishes'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cartItems.length > 0 && !isPlacingOrder && (
                <button
                  type="button"
                  onClick={clearCart}
                  title="Clear all items"
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                disabled={isPlacingOrder}
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body: Items, Dining Mode & Notes */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* 1. Dining Mode Selector (Dine-in vs Takeaway) */}
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                  Select Dining Mode
                </span>
                <span className="text-xs font-semibold text-orange-600">
                  {orderType}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleOrderTypeChange('Dine-in')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isDineIn
                      ? 'border-orange-500 bg-orange-600 text-white shadow-xs'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'
                  }`}
                >
                  <Utensils className="w-4 h-4" />
                  <span>Dine-in</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOrderTypeChange('Takeaway')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    !isDineIn
                      ? 'border-orange-500 bg-orange-600 text-white shadow-xs'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Takeaway</span>
                </button>
              </div>

              {/* Table Number Section for Dine-in */}
              {isDineIn ? (
                <div className="pt-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                      <span>Table Number</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-gray-500">
                      Required for table service
                    </span>
                  </div>

                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => handleTableChange(e.target.value)}
                    placeholder="e.g. Table 04"
                    className={`w-full px-3 py-2 bg-white rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                      hasTableError || tableInputError
                        ? 'border-red-400 bg-red-50/50 text-red-900 focus:ring-red-400'
                        : 'border-gray-200 text-gray-900 focus:border-orange-500'
                    }`}
                  />

                  {/* Quick Select Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {COMMON_TABLES.map((tbl) => (
                      <button
                        key={tbl}
                        type="button"
                        onClick={() => handleTableChange(tbl)}
                        className={`text-[11px] px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                          tableNumber === tbl
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {tbl}
                      </button>
                    ))}
                  </div>

                  {(tableInputError || (orderError && hasTableError)) && (
                    <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{tableInputError || 'Table number is required for Dine-in dining.'}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200/80 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Takeaway order will be packed and ready at the pick-up counter.</span>
                </div>
              )}
            </div>

            {/* 2. Cart Items List */}
            {cartItems.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center py-8 px-4 space-y-3">
                <div className="w-14 h-14 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500">
                  <Utensils className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-gray-800">Your cart is empty</h4>
                  <p className="text-xs text-gray-500 max-w-xs">
                    Explore our starters, curries, tandoor specials, or biryanis to add dishes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="mt-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
                >
                  Browse Dishes
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Items in your order ({cartItems.length})
                </span>

                {cartItems.map((ci) => (
                  <div
                    key={ci.cartKey}
                    className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
                  >
                    {/* Image Thumbnail */}
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-200">
                      <img
                        src={ci.image}
                        alt={ci.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1 left-1 bg-white/95 rounded-xs p-0.5 shadow-2xs">
                        <DietaryIcon isVeg={ci.isVeg} size="sm" />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                        {ci.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {ci.variantLabel ? (
                          <span className="inline-block text-[11px] font-semibold text-orange-800 bg-orange-100/80 px-1.5 py-0.2 rounded">
                            {ci.variantLabel} {ci.portion ? `(${ci.portion})` : ''}
                          </span>
                        ) : (
                          ci.portion && (
                            <span className="text-[11px] text-gray-500 font-medium">
                              {ci.portion}
                            </span>
                          )
                        )}
                      </div>
                      <div className="text-xs font-extrabold text-gray-800 mt-1">
                        ₹{ci.unitPrice * ci.quantity}
                        {ci.quantity > 1 && (
                          <span className="text-[10px] text-gray-400 font-normal ml-1">
                            (₹{ci.unitPrice} each)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stepper Controls */}
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shrink-0 shadow-2xs">
                      <button
                        type="button"
                        disabled={isPlacingOrder}
                        onClick={() => updateQuantity(ci.cartKey, ci.quantity - 1)}
                        className="p-1 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded cursor-pointer disabled:opacity-50"
                        title="Decrease"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold text-gray-900 min-w-[18px] text-center">
                        {ci.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={isPlacingOrder}
                        onClick={() => updateQuantity(ci.cartKey, ci.quantity + 1)}
                        className="p-1 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded cursor-pointer disabled:opacity-50"
                        title="Increase"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      type="button"
                      disabled={isPlacingOrder}
                      onClick={() => removeFromCart(ci.cartKey)}
                      className="text-gray-400 hover:text-red-500 p-1 cursor-pointer disabled:opacity-50"
                      title="Remove item"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* 3. Kitchen Instructions / Notes */}
                <div className="pt-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                    <span>Kitchen Notes / Instructions (Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={kitchenNotes}
                    onChange={(e) => setKitchenNotes(e.target.value)}
                    placeholder="E.g. Make butter chicken mild, serve naan crisp, extra mint dip..."
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:outline-hidden focus:ring-1 focus:ring-orange-500 focus:bg-white resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer: Price breakdown, validation errors & Place Order CTA */}
          {cartItems.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 space-y-3">
              {/* Submission Error Banner */}
              {orderError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold block">Order could not be submitted</span>
                    <span>{orderError}</span>
                  </div>
                </div>
              )}

              {/* Billing Breakdown */}
              <div className="space-y-1.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Item Subtotal</span>
                  <span className="font-semibold text-gray-800">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Restaurant GST ({RESTAURANT_INFO.gstPercent}%)</span>
                  <span className="font-semibold text-gray-800">₹{taxAmount}</span>
                </div>
                <div className="border-t border-gray-200/80 pt-2 flex justify-between text-sm sm:text-base font-extrabold text-gray-900">
                  <span>Grand Total</span>
                  <span className="text-orange-600 font-black">₹{grandTotal}</span>
                </div>
              </div>

              {/* Prep time info */}
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <Clock className="w-3.5 h-3.5 text-orange-500" />
                <span>Estimated kitchen prep time: </span>
                <span className="font-bold text-gray-700">{RESTAURANT_INFO.estimatedWait}</span>
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={isPlacingOrder || cartItems.length === 0}
                onClick={handlePlaceOrder}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-700 hover:to-amber-700 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 flex items-center justify-between active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  {isPlacingOrder ? (
                    <>
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                      <span>Sending to Kitchen...</span>
                    </>
                  ) : (
                    <>
                      <ChefHat className="w-5 h-5 text-white" />
                      <span>Send Order to Kitchen</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1.5 font-black text-sm bg-black/20 px-3 py-1 rounded-lg">
                  <span>₹{grandTotal}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
