import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const MobileCartBar = () => {
  const { totalItemCount, grandTotal, setIsCartOpen, isCartOpen } = useCart();

  if (totalItemCount === 0 || isCartOpen) return null;

  return (
    <div className="md:hidden fixed bottom-4 inset-x-4 z-30 animate-in slide-in-from-bottom duration-300">
      <button
        type="button"
        onClick={() => setIsCartOpen(true)}
        className="w-full bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white p-3.5 rounded-2xl shadow-xl shadow-orange-600/30 flex items-center justify-between font-bold text-sm border border-orange-400/40 active:scale-98 transition-transform"
      >
        <div className="flex items-center gap-3">
          <div className="relative bg-white/20 p-2 rounded-xl">
            <ShoppingBag className="w-5 h-5 text-white" />
            <span className="absolute -top-1.5 -right-1.5 bg-white text-orange-600 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
              {totalItemCount}
            </span>
          </div>
          <div className="text-left">
            <div className="text-xs text-orange-100 font-medium leading-none">
              {totalItemCount} {totalItemCount === 1 ? 'Item' : 'Items'} Added
            </div>
            <div className="text-base font-black leading-tight mt-0.5">
              ₹{grandTotal} <span className="text-xs font-normal text-orange-200">(incl. tax)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider">
          <span>View Cart</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </button>
    </div>
  );
};
