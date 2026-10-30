import React, { useState } from 'react';
import { CartProvider } from './context/CartContext';
import { Header } from './components/Header';
import { MenuPage } from './pages/MenuPage';
import { KitchenDisplayPage } from './pages/KitchenDisplayPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { CartDrawer } from './components/CartDrawer';
import { MobileCartBar } from './components/MobileCartBar';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { ActiveOrderTrackerModal } from './components/ActiveOrderTrackerModal';
import { ToastNotification } from './components/ToastNotification';
import { UtensilsCrossed, ShieldCheck } from 'lucide-react';
import { RESTAURANT_INFO } from './data/menuData';

function App() {
  const [currentView, setCurrentView] = useState('menu'); // 'menu' | 'tracking' | 'kitchen' | 'admin'

  return (
    <CartProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-gray-900 selection:bg-orange-500 selection:text-white">
        {/* Navigation Header with Active Order Indicator & View Switcher */}
        <Header currentView={currentView} setCurrentView={setCurrentView} />

        {/* View Router: Customer Menu vs Order Tracker vs Kitchen Display vs Admin Dashboard */}
        <div className="flex-1">
          {currentView === 'menu' && <MenuPage />}
          {currentView === 'tracking' && (
            <OrderTrackingPage onBackToMenu={() => setCurrentView('menu')} />
          )}
          {currentView === 'kitchen' && (
            <KitchenDisplayPage onBackToMenu={() => setCurrentView('menu')} />
          )}
          {currentView === 'admin' && (
            <AdminDashboardPage onBackToMenu={() => setCurrentView('menu')} />
          )}
        </div>

        {/* Global Cart Slide-Over / Drawer */}
        <CartDrawer />

        {/* Mobile Sticky Floating Cart Bar */}
        <MobileCartBar />

        {/* Order Confirmation Receipt Modal with Item Removal Controls */}
        <OrderConfirmationModal />

        {/* Persistent Active Order / Kitchen Ticket Tracker */}
        <ActiveOrderTrackerModal />

        {/* Live Feedback Toast Notification */}
        <ToastNotification />

        {/* Restaurant Footer */}
        <footer className="border-t border-gray-200 bg-white text-gray-600 py-8 px-4 sm:px-6 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-center sm:text-left">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center">
                <UtensilsCrossed className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold text-gray-900 text-sm">
                {RESTAURANT_INFO.name}
              </span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500">Contactless Digital Ordering & Kitchen Display</span>
            </div>

            <div className="flex items-center gap-4 text-gray-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                FSSAI Certified
              </span>
              <span>•</span>
              <span>{RESTAURANT_INFO.openingHours}</span>
            </div>

            <div className="text-gray-400">
              © {new Date().getFullYear()} {RESTAURANT_INFO.name}. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </CartProvider>
  );
}

export default App;
