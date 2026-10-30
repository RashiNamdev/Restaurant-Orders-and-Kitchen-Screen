import React from 'react';
import { X, Check, Utensils, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

const TABLES = [
  'Table 01', 'Table 02', 'Table 03', 'Table 04',
  'Table 05', 'Table 06', 'Table 07', 'Table 08',
  'Table 09', 'Table 10', 'Table 11', 'Table 12'
];

export const TableSelectModal = ({ isOpen, onClose }) => {
  const { tableNumber, setTableNumber, orderType, setOrderType } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Dining Mode & Table</h3>
            <p className="text-xs text-gray-500">Choose where your food will be served</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Mode Switcher */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
              Service Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOrderType('Dine-in')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                  orderType === 'Dine-in'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-xs'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                }`}
              >
                <Utensils className="w-4 h-4 text-amber-600" />
                <span>Dine-in</span>
              </button>
              <button
                type="button"
                onClick={() => setOrderType('Takeaway')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                  orderType === 'Takeaway'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-xs'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-amber-600" />
                <span>Takeaway</span>
              </button>
            </div>
          </div>

          {/* Table Selector (only for Dine-in) */}
          {orderType === 'Dine-in' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
                Select Your Table
              </label>
              <div className="grid grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {TABLES.map((tbl) => {
                  const isSelected = tableNumber === tbl;
                  return (
                    <button
                      key={tbl}
                      type="button"
                      onClick={() => setTableNumber(tbl)}
                      className={`relative flex items-center justify-center py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                        isSelected
                          ? 'border-orange-500 bg-orange-500 text-white shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-gray-50/50'
                      }`}
                    >
                      <span>{tbl}</span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 absolute right-2 text-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom table note */}
          <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-200/60 text-xs text-amber-800 flex items-start gap-2">
            <span className="font-bold">Note:</span>
            <span>Your kitchen screen and server will automatically tag this table to prepare and deliver your items hot & fresh.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold rounded-xl shadow-md shadow-orange-500/20 transition-all active:scale-[0.99]"
          >
            Confirm & Continue
          </button>
        </div>
      </div>
    </div>
  );
};
