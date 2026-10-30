import React from 'react';
import { Star, Clock, ChefHat, Sparkles, Utensils, ShieldCheck } from 'lucide-react';
import { RESTAURANT_INFO } from '../data/menuData';
import { useCart } from '../context/CartContext';

export const RestaurantBanner = () => {
  const { tableNumber, orderType } = useCart();

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-amber-950 via-stone-900 to-amber-900 text-white rounded-2xl md:rounded-3xl shadow-xl my-4 sm:my-6 border border-amber-900/40">
      {/* Decorative Warm Background Orbs */}
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-orange-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 px-5 sm:px-8 py-6 sm:py-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Column: Greeting & Info */}
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to Table Service • Freshly Prepared to Order</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            <span className="text-white block">Order Delicious Bites,</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200">
              Cooked Fresh in Our Tandoor
            </span>
          </h2>

          <p className="text-sm sm:text-base text-gray-300 font-normal leading-relaxed">
            Select your favorite curries, kebabs, and biryanis. Choose between 
            <span className="text-amber-300 font-semibold"> Half Plate</span> or 
            <span className="text-amber-300 font-semibold"> Full Plate</span> portions 
            tailored for your table.
          </p>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 pt-1 text-xs sm:text-sm text-gray-300">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="font-bold text-white">{RESTAURANT_INFO.rating}</span>
              <span className="text-gray-400">({RESTAURANT_INFO.reviewCount}+ reviews)</span>
            </div>

            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
              <Clock className="w-4 h-4 text-orange-400" />
              <span>Prep Time: </span>
              <span className="font-semibold text-white">{RESTAURANT_INFO.estimatedWait}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
              <ChefHat className="w-4 h-4 text-amber-400" />
              <span>Clay Oven Specialists</span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Table Status Card */}
        <div className="shrink-0 bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 flex flex-col justify-between space-y-3 min-w-[240px]">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs uppercase tracking-wider text-amber-300 font-bold">
              Current Session
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Live Kitchen
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Utensils className="w-5 h-5 text-orange-400" />
              <span>{orderType === 'Dine-in' ? tableNumber : 'Takeaway Order'}</span>
            </div>
            <p className="text-xs text-gray-300">
              Orders sent here will be routed directly to the kitchen display screen.
            </p>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center gap-2 text-[11px] text-gray-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Contactless Ordering Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
};
