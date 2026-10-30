import React from 'react';
import { ChefHat, Info } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const ToastNotification = () => {
  const { toastMessage } = useCart();

  if (!toastMessage) return null;

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-300 max-w-sm">
      <div className="bg-stone-900 text-white p-3.5 rounded-2xl shadow-2xl border border-stone-700/80 flex items-start gap-3 backdrop-blur-md">
        <div className="p-1.5 bg-orange-500/20 text-orange-400 rounded-xl shrink-0 mt-0.5">
          <ChefHat className="w-4 h-4" />
        </div>
        <div className="text-xs font-medium leading-relaxed pr-2">
          {toastMessage}
        </div>
      </div>
    </div>
  );
};
