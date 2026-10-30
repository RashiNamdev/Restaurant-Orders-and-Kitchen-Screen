import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Check, ChefHat } from 'lucide-react';
import { DietaryIcon } from './DietaryBadge';

export const RemoveItemConfirmModal = ({ isOpen, item, orderId, onConfirm, onClose }) => {
  const [selectedReason, setSelectedReason] = useState('Ordered by mistake');
  const [removeOption, setRemoveOption] = useState('all'); // 'one' | 'all'

  if (!isOpen || !item) return null;

  const isMultiple = item.quantity > 1;

  const handleConfirm = () => {
    onConfirm(item.cartKey, removeOption === 'all', selectedReason);
    onClose();
  };

  const REASONS = [
    'Ordered by mistake',
    'Want to choose a different dish',
    'Portion size was too much',
    'Change of dining preference',
  ];

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-red-50/80 border-b border-red-100 p-5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-extrabold text-gray-900 leading-tight">
              Remove Dish from Order?
            </h3>
            <p className="text-xs text-red-700 mt-0.5">
              Order #{orderId} • Live Kitchen Ticket
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dish Info */}
        <div className="p-5 space-y-4">
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/80 flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gray-200">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <DietaryIcon isVeg={item.isVeg} size="sm" />
                <span className="font-bold text-gray-900 text-sm truncate">{item.name}</span>
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                {item.variantLabel && (
                  <span className="font-semibold text-orange-700 bg-orange-100/70 px-1.5 py-0.2 rounded text-[11px]">
                    {item.variantLabel}
                  </span>
                )}
                <span>Qty: {item.quantity}</span>
                <span className="font-extrabold text-gray-800">₹{item.unitPrice * item.quantity}</span>
              </div>
            </div>
          </div>

          {/* Multiple quantity selector if item.quantity > 1 */}
          {isMultiple && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                How many would you like to remove?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRemoveOption('one')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    removeOption === 'one'
                      ? 'border-orange-500 bg-orange-50 text-orange-900 font-bold'
                      : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  Remove 1 Plate (Keep {item.quantity - 1})
                </button>
                <button
                  type="button"
                  onClick={() => setRemoveOption('all')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    removeOption === 'all'
                      ? 'border-red-500 bg-red-50 text-red-900 font-bold'
                      : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  Remove All ({item.quantity} Plates)
                </button>
              </div>
            </div>
          )}

          {/* Reason Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Reason for Cancellation
            </label>
            <div className="space-y-1.5">
              {REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedReason(r)}
                  className={`w-full text-left py-2 px-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${
                    selectedReason === r
                      ? 'border-orange-500 bg-orange-50/60 text-orange-950 font-semibold'
                      : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
                  }`}
                >
                  <span>{r}</span>
                  {selectedReason === r && <Check className="w-3.5 h-3.5 text-orange-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Kitchen notice */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200/70 text-[11px] text-amber-800">
            <ChefHat className="w-4 h-4 text-amber-600 shrink-0" />
            <span>The kitchen screen will instantly strike this item off your ticket and recalculate your bill.</span>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-xs transition-colors"
            >
              Keep Dish
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-md shadow-red-500/20 active:scale-98 flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Confirm Removal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
