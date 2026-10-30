import React, { useState } from 'react';
import { 
  ShoppingBag, 
  MapPin, 
  Clock, 
  UtensilsCrossed, 
  ChevronDown, 
  Sparkles, 
  Phone, 
  ChefHat,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { RESTAURANT_INFO } from '../data/menuData';
import { TableSelectModal } from './TableSelectModal';

export const Header = ({ currentView = 'menu', setCurrentView }) => {
  const { 
    totalItemCount, 
    subtotal, 
    setIsCartOpen, 
    tableNumber, 
    orderType, 
    activeOrder, 
    setIsOrderTrackerOpen 
  } = useCart();
  
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  const hasActiveOrder = activeOrder && activeOrder.items && activeOrder.items.length > 0 && activeOrder.status !== 'Cancelled';

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-xs">
        {/* Top Info Bar (Desktop only) */}
        <div className="hidden md:block bg-gradient-to-r from-amber-900 via-stone-900 to-amber-950 text-white/90 text-xs py-1.5 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5 text-amber-300 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Live Digital Menu & Kitchen Display System
              </span>
              <span className="flex items-center gap-1 text-gray-300">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Hours: {RESTAURANT_INFO.openingHours}
              </span>
              <span className="flex items-center gap-1 text-gray-300">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                {RESTAURANT_INFO.phone}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-300 font-semibold">{RESTAURANT_INFO.kitchenStatus}</span>
            </div>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          {/* Brand Info */}
          <div 
            onClick={() => setCurrentView && setCurrentView('menu')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-md shadow-orange-500/20 text-white shrink-0">
              <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-extrabold text-gray-900 tracking-tight leading-none">
                  {RESTAURANT_INFO.name}
                </h1>
                <span className="hidden sm:inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded uppercase">
                  Live
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block mt-0.5">
                {RESTAURANT_INFO.tagline}
              </p>
            </div>
          </div>

          {/* Center Navigation Switcher (Menu, Live Tracker, Kitchen, Admin) */}
          {setCurrentView && (
            <div className="flex items-center bg-gray-100/90 p-1 rounded-xl border border-gray-200/90 text-xs font-bold">
              <button
                type="button"
                onClick={() => setCurrentView('menu')}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'menu'
                    ? 'bg-white text-orange-600 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Menu</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentView('tracking')}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer relative ${
                  currentView === 'tracking'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Live Tracker</span>
                {hasActiveOrder && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setCurrentView('kitchen')}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'kitchen'
                    ? 'bg-stone-900 text-amber-400 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kitchen (KDS)</span>
                <span className="sm:hidden">KDS</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentView('admin')}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            </div>
          )}

          {/* Right Action Controls: Table Selector, Active Order Tracker & Cart Button */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Live Active Order Pill (if order has been placed) */}
            {hasActiveOrder && (
              <button
                type="button"
                onClick={() => setIsOrderTrackerOpen(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs sm:text-sm font-bold transition-all shadow-xs group animate-in zoom-in-95 cursor-pointer"
                title="View active kitchen ticket & remove dishes"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <ChefHat className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <div className="text-left hidden md:block">
                  <span className="block leading-none text-[9px] text-emerald-700 font-bold uppercase tracking-wider">
                    Kitchen Ticket
                  </span>
                  <span className="font-extrabold text-emerald-950 leading-tight">
                    #{activeOrder.orderId}
                  </span>
                </div>
                <span className="md:hidden text-xs font-black text-emerald-950">
                  #{activeOrder.orderId.replace('KTC-', '')}
                </span>
              </button>
            )}

            {/* Table / Order Mode Pill */}
            <button
              type="button"
              onClick={() => setIsTableModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 text-amber-900 text-xs sm:text-sm font-semibold transition-all group cursor-pointer"
              title="Click to change dining mode or table number"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <div className="text-left">
                <span className="block leading-none text-[10px] text-amber-700 font-medium hidden sm:block">
                  {orderType}
                </span>
                <span className="font-bold text-gray-900 leading-tight text-xs sm:text-sm">
                  {orderType === 'Dine-in' ? tableNumber : 'Takeaway'}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-amber-700 group-hover:translate-y-0.5 transition-transform" />
            </button>

            {/* Cart Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4" />
                {totalItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-orange-600 text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-in zoom-in">
                    {totalItemCount}
                  </span>
                )}
              </div>
              <span className="hidden md:inline font-bold">Cart</span>
              {totalItemCount > 0 && (
                <span className="border-l border-white/30 pl-1.5 font-bold">
                  ₹{subtotal}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Table Change Modal */}
      <TableSelectModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
      />
    </>
  );
};
