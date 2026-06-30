import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Coins, 
  Wallet, 
  LogOut, 
  MessageSquare 
} from 'lucide-react';
import { type CurrencyCode } from '../services/currency';

interface NavigationSidebarProps {
  activeTab: 'dashboard' | 'ledger' | 'networks' | 'vault';
  setActiveTab: (tab: 'dashboard' | 'ledger' | 'networks' | 'vault') => void;
  primaryCurrency: CurrencyCode;
  setPrimaryCurrency: (currency: CurrencyCode) => void;
  onLogout: () => void;
  onToggleMahi: () => void;
  isMahiOpen: boolean;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeTab,
  setActiveTab,
  primaryCurrency,
  setPrimaryCurrency,
  onLogout,
  onToggleMahi,
  isMahiOpen
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'ledger', label: 'Cash Flow', icon: Receipt },
    { id: 'networks', label: 'P2P & Bills', icon: Coins },
    { id: 'vault', label: 'Account & Vault', icon: Wallet },
  ] as const;

  return (
    <aside className="w-64 bg-surface/40 backdrop-blur-xl border-r border-white/8 flex flex-col justify-between p-6 h-screen sticky top-0 z-30 select-none">
      {/* Brand Logo */}
      <div className="flex flex-col mb-8">
        <span className="text-primary text-[9px] font-bold uppercase tracking-widest block font-sans">Wealth Terminal</span>
        <h1 className="text-white text-2xl font-black tracking-tight mt-0.5 font-sans bg-gradient-to-r from-white via-white to-primary/80 bg-clip-text text-transparent">
          expenso
        </h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer relative group ${
                isActive 
                  ? 'bg-white/5 text-primary border border-white/5 shadow-inner' 
                  : 'text-text-muted hover:text-white hover:bg-white/2'
              }`}
            >
              {/* Active Indicator Line */}
              {isActive && (
                <span className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full shadow-[0_0_8px_#00F5FF]" />
              )}
              <Icon size={15} className={isActive ? 'text-primary' : 'text-text-muted group-hover:text-white'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Controls */}
      <div className="space-y-4 border-t border-white/5 pt-5">
        
        {/* Mahi Shortcut (Mobile/Global Option) */}
        <button
          onClick={onToggleMahi}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer ${
            isMahiOpen 
              ? 'bg-secondary/15 border-secondary text-secondary shadow-lg shadow-secondary/10' 
              : 'bg-white/3 border-white/8 hover:border-white/15 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <MessageSquare size={14} className={isMahiOpen ? 'animate-pulse' : ''} />
            <span>Mahi AI</span>
          </div>
          <span className={`w-2 h-2 rounded-full ${isMahiOpen ? 'bg-secondary animate-ping' : 'bg-primary'}`} />
        </button>

        {/* Currency Toggle */}
        <div>
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block mb-2 px-1">Active Currency</span>
          <div className="grid grid-cols-3 bg-black/30 border border-white/8 p-0.5 rounded-xl">
            {(['USD', 'EUR', 'INR'] as const).map((cur) => (
              <button
                key={cur}
                onClick={() => setPrimaryCurrency(cur)}
                className={`py-1.5 rounded-lg text-[9px] font-bold transition-all duration-150 cursor-pointer ${
                  primaryCurrency === cur 
                    ? 'bg-gradient-to-tr from-primary to-secondary text-black shadow-md font-extrabold' 
                    : 'text-text-muted hover:text-white'
                }`}
              >
                {cur}
              </button>
            ))}
          </div>
        </div>

        {/* Log Out Button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-transparent hover:border-red-500/30 hover:bg-red-500/10 text-text-muted hover:text-red-400 text-xs font-bold transition-all duration-150 cursor-pointer"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>

      </div>
    </aside>
  );
};

export default NavigationSidebar;
