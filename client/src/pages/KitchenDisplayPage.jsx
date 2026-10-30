import React, { useState } from 'react';
import { useKitchenOrders } from '../hooks/useKitchenOrders';
import { KitchenHeader } from '../components/kitchen/KitchenHeader';
import { OrderCard } from '../components/kitchen/OrderCard';
import { OrderHistoryView } from '../components/kitchen/OrderHistoryView';
import { 
  ChefHat, 
  RotateCcw, 
  Sparkles, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Plus
} from 'lucide-react';

export const KitchenDisplayPage = ({ onBackToMenu }) => {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Received' | 'Preparing' | 'Ready'

  const {
    orders,
    allActiveOrders,
    historyOrders,
    loading,
    error,
    actionLoadingId,
    socketConnected,
    soundEnabled,
    setSoundEnabled,
    activeUserRole,
    setActiveUserRole,
    advanceOrderStatus,
    refreshOrders,
    handleSeedOrders,
  } = useKitchenOrders(activeTab, statusFilter);

  // Group counts for header badges
  const receivedCount = allActiveOrders.filter((o) => o.status === 'Received').length;
  const preparingCount = allActiveOrders.filter((o) => o.status === 'Preparing').length;
  const readyCount = allActiveOrders.filter((o) => o.status === 'Ready').length;

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col font-sans">
      {/* Top Navigation & Status Bar */}
      <KitchenHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        activeCount={allActiveOrders.length}
        receivedCount={receivedCount}
        preparingCount={preparingCount}
        readyCount={readyCount}
        historyCount={historyOrders.length}
        socketConnected={socketConnected}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        activeUserRole={activeUserRole}
        setActiveUserRole={setActiveUserRole}
        onRefresh={() => refreshOrders(false)}
        onBackToMenu={onBackToMenu}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center justify-center py-20 space-x-3 text-stone-400">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <span className="text-sm font-bold">Connecting to kitchen display stream...</span>
          </div>
        )}

        {/* Error Alert */}
        {error && !loading && (
          <div className="mb-6 p-4 rounded-2xl bg-red-950/80 border border-red-800 text-red-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => refreshOrders(true)}
              className="px-3 py-1.5 rounded-xl bg-red-800 hover:bg-red-700 font-bold text-white transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* ACTIVE ORDERS VIEW */}
        {!loading && activeTab === 'active' && (
          <div>
            {orders.length === 0 ? (
              /* Empty Active Tickets State */
              <div className="bg-stone-950 border border-stone-800 rounded-3xl p-12 text-center max-w-md mx-auto my-8 space-y-4 shadow-xl">
                <div className="w-16 h-16 rounded-3xl bg-stone-900 border border-stone-800 mx-auto flex items-center justify-center text-orange-500">
                  <ChefHat className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">All Kitchen Tickets Cleared!</h3>
                  <p className="text-xs text-stone-400 max-w-xs mx-auto">
                    {statusFilter !== 'all'
                      ? `No orders currently in the "${statusFilter}" stage.`
                      : 'Great job, chef! No orders are currently waiting in the queue.'}
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleSeedOrders}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-md shadow-orange-600/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Load Demo Test Orders</span>
                  </button>
                  <button
                    type="button"
                    onClick={onBackToMenu}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs border border-stone-700 transition-all cursor-pointer"
                  >
                    <span>Place Order from Menu</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Responsive Grid: 1 col mobile, 2 col tablet, 3-4 col desktop */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {orders.map((ord) => (
                  <OrderCard
                    key={ord.orderId}
                    order={ord}
                    onAdvanceStatus={advanceOrderStatus}
                    isActionLoading={actionLoadingId === ord.orderId}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ORDER HISTORY VIEW */}
        {!loading && activeTab === 'history' && (
          <OrderHistoryView historyOrders={historyOrders} />
        )}
      </main>
    </div>
  );
};
