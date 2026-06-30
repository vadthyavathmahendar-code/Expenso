import React, { useEffect, useState } from 'react';
import { TransactionProvider, useTransactions } from './context/TransactionContext';
import { dbAuth } from './services/dbService';
import Auth from './views/Auth';
import NavigationSidebar from './components/NavigationSidebar';
import DashboardView from './views/DashboardView';
import LedgerView from './views/LedgerView';
import NetworksView from './views/NetworksView';
import VaultView from './views/VaultView';
import MahiBubble from './components/MahiBubble';
import AddTransactionModal from './components/AddTransactionModal';
import SecurityLock from './components/SecurityLock';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Listen to Auth Changes
  useEffect(() => {
    const unsubscribe = dbAuth.onAuthStateChange((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#09090A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <TransactionProvider>
      <div className="relative min-h-screen bg-[#09090A] text-white selection:bg-accent/30 selection:text-white overflow-x-hidden">
        {!user ? (
          <Auth onAuthSuccess={(loggedUser) => setUser(loggedUser)} />
        ) : (
          <SecurityLock>
            <AppContent user={user} onLogout={() => setUser(null)} />
          </SecurityLock>
        )}
      </div>
    </TransactionProvider>
  );
}

interface AppContentProps {
  user: any;
  onLogout: () => void;
}

const AppContent: React.FC<AppContentProps> = ({ user, onLogout }) => {
  const { primaryCurrency, setPrimaryCurrency, mahiOpen, setMahiOpen, toasts, removeToast } = useTransactions();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ledger' | 'networks' | 'vault'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + N -> Log Entry
      if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsModalOpen(true);
      }
      // Ctrl + F -> Search Ledger
      if (e.ctrlKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setActiveTab('ledger');
        setTimeout(() => {
          const searchInput = document.getElementById('ledger-search-input');
          if (searchInput) searchInput.focus();
        }, 150);
      }
      // Ctrl + Shift + A -> Open Mahi AI
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setMahiOpen(true);
      }
      // Esc -> Close Modals
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setMahiOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setMahiOpen]);

  // Get workspace title
  const getWorkspaceTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Command Center';
      case 'ledger': return 'Cash Flow Ledger';
      case 'networks': return 'P2P & Commitments';
      case 'vault': return 'Vault & Settings';
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Navigation Sidebar */}
      <NavigationSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        primaryCurrency={primaryCurrency}
        setPrimaryCurrency={setPrimaryCurrency}
        onLogout={onLogout}
        onToggleMahi={() => setMahiOpen(!mahiOpen)}
        isMahiOpen={mahiOpen}
      />
      
      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Global Header */}
        <header className="flex justify-between items-center px-8 py-5 border-b border-white/5 bg-black/10 backdrop-blur-md sticky top-0 z-20">
          <div>
            <span className="text-primary text-[9px] font-bold uppercase tracking-widest block font-sans">Workspace</span>
            <h2 className="text-white text-lg font-black tracking-tight mt-0.5 font-sans">
              {getWorkspaceTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Log Entry Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-tr from-primary to-secondary text-black font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-primary/10 hover:brightness-110 active:scale-[0.99] transition-all duration-150 cursor-pointer"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Log Entry</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content Pane */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#09090A]">
          <div className="max-w-7xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="w-full"
              >
                {activeTab === 'dashboard' && <DashboardView onNavigateToVault={() => setActiveTab('vault')} />}
                {activeTab === 'ledger' && <LedgerView onOpenAddTransaction={() => setIsModalOpen(true)} />}
                {activeTab === 'networks' && <NetworksView />}
                {activeTab === 'vault' && <VaultView user={user} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Toast Notification Container */}
      <div className="fixed top-6 right-6 z-[120] flex flex-col gap-2.5 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="pointer-events-auto bg-[#0F0F11]/90 backdrop-blur-md border border-white/10 p-3 px-4 rounded-2xl flex items-center justify-between gap-4 shadow-2xl min-w-[280px]"
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  t.type === 'success' ? 'bg-primary animate-pulse' : t.type === 'error' ? 'bg-red-500' : 'bg-accent'
                }`} />
                <span className="text-xs font-semibold text-white">
                  {t.message}
                </span>
              </div>
              {t.action && (
                <button
                  onClick={() => {
                    t.action?.onClick();
                    removeToast(t.id);
                  }}
                  className="text-[9px] font-black text-primary hover:brightness-110 uppercase tracking-widest cursor-pointer px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/15 transition-all duration-150 shrink-0"
                >
                  {t.action.label}
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Floating AI Bubble & Draggable Terminal */}
      <MahiBubble isOpen={mahiOpen} setIsOpen={setMahiOpen} />

      {/* Global Add Transaction Modal */}
      <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
