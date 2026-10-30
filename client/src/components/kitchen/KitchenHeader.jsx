import React, { useState, useEffect } from 'react';
import { 
  ChefHat, 
  Clock, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  RefreshCw, 
  ArrowLeft,
  Utensils,
  History,
  ShieldCheck,
  Flame,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const KitchenHeader = ({
  activeTab,
  setActiveTab,
  statusFilter,
  setStatusFilter,
  activeCount,
  receivedCount,
  preparingCount,
  readyCount,
  historyCount,
  socketConnected,
  soundEnabled,
  setSoundEnabled,
  activeUserRole,
  setActiveUserRole,
  onRefresh,
  onBackToMenu,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Live clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <header className="sticky top-0 z-30 bg-stone-950 text-white border-b border-stone-800 shadow-xl">
      {/* Top Bar: Brand, Live Clock, Status Stats, Roles & Tools */}
      <div className="px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-stone-900">
        {/* Left: Branding & Back to Menu */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToMenu}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-bold transition-all border border-stone-800"
            title="Return to Customer Menu Page"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Customer Menu</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black shadow-md shadow-orange-600/30">
              <ChefHat className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black tracking-tight leading-none text-white uppercase">
                  Kitchen Display System
                </h1>
                <span className="text-[10px] font-extrabold bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.2 rounded uppercase">
                  KDS Live
                </span>
              </div>
              <p className="text-[11px] text-stone-400 font-mono hidden sm:block mt-0.5">
                Saffron & Spice Bistro • Clay Oven & Tandoor Station
              </p>
            </div>
          </div>
        </div>

        {/* Center: Live Digital Clock & Socket Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-stone-900 border border-stone-800 text-xs font-mono font-bold text-amber-400 shadow-inner">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span>{formattedTime}</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-stone-400">
            <span
              className={`w-2 h-2 rounded-full ${
                socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
              }`}
            />
            <span className="text-[11px] font-medium">
              {socketConnected ? 'Real-Time Stream' : 'Connecting Stream...'}
            </span>
          </div>
        </div>

        {/* Right: Role Switcher & Screen Tools */}
        <div className="flex items-center gap-2">
          {/* Role Check Tester Dropdown */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-900 border border-stone-800 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-stone-400 text-[11px] hidden sm:inline">Role:</span>
            <select
              value={activeUserRole}
              onChange={(e) => setActiveUserRole(e.target.value)}
              className="bg-transparent text-xs font-extrabold text-white focus:outline-hidden cursor-pointer"
              title="Test server-side role validation (select customer to verify 403 Forbidden rejection)"
            >
              <option value="kitchen" className="bg-stone-900 text-white">Kitchen Staff (Authorized)</option>
              <option value="admin" className="bg-stone-900 text-white">Head Chef / Admin (Authorized)</option>
              <option value="staff" className="bg-stone-900 text-white">Floor Staff (Authorized)</option>
              <option value="customer" className="bg-stone-900 text-white">Customer (Unauthorized - Test 403)</option>
            </select>
          </div>

          {/* Sound Alert Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-all ${
              soundEnabled
                ? 'bg-stone-900 text-amber-400 border-stone-800 hover:bg-stone-800'
                : 'bg-stone-900 text-stone-500 border-stone-800 hover:bg-stone-800'
            }`}
            title={soundEnabled ? 'Order Alert Chime: ON' : 'Order Alert Chime: OFF'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-stone-900 text-stone-300 hover:text-white border border-stone-800 hover:bg-stone-800 transition-all hidden sm:block"
            title="Toggle Kitchen Monitor Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            className="p-2 rounded-xl bg-stone-900 text-stone-300 hover:text-white border border-stone-800 hover:bg-stone-800 transition-all"
            title="Refresh tickets"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Bar: Active Orders vs History Tabs & Quick Filter Pills */}
      <div className="px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 bg-stone-900/90 backdrop-blur-md">
        {/* Main View Switcher: Active Tickets vs History */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-950 rounded-2xl border border-stone-800">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Active Tickets</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeTab === 'active' ? 'bg-white/20 text-white' : 'bg-stone-800 text-stone-300'
              }`}
            >
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-stone-800 text-white shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Order History / Completed</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeTab === 'history' ? 'bg-white/20 text-white' : 'bg-stone-800 text-stone-300'
              }`}
            >
              {historyCount}
            </span>
          </button>
        </div>

        {/* Status Stage Filter Chips (when viewing Active tab) */}
        {activeTab === 'active' && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-stone-950 font-black shadow-xs'
                  : 'bg-stone-950 text-stone-400 hover:text-white border border-stone-800'
              }`}
            >
              All Stages ({activeCount})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('Received')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold transition-all ${
                statusFilter === 'Received'
                  ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                  : 'bg-stone-950 text-amber-400 border border-stone-800 hover:border-amber-500/50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Received ({receivedCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('Preparing')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold transition-all ${
                statusFilter === 'Preparing'
                  ? 'bg-blue-500 text-white font-black shadow-xs'
                  : 'bg-stone-950 text-blue-400 border border-stone-800 hover:border-blue-500/50'
              }`}
            >
              <Flame className="w-3 h-3 text-blue-400" />
              <span>Preparing ({preparingCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('Ready')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold transition-all ${
                statusFilter === 'Ready'
                  ? 'bg-emerald-500 text-stone-950 font-black shadow-xs'
                  : 'bg-stone-950 text-emerald-400 border border-stone-800 hover:border-emerald-500/50'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Ready ({readyCount})</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
