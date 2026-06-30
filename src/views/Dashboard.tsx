import React, { useState, useMemo } from 'react';
import { useTransactions } from '../context/TransactionContext';
import { dbAuth } from '../services/dbService';
import { currencyService } from '../services/currency';
import SvgDonutChart from '../components/SvgDonutChart';
import SvgTrendChart from '../components/SvgTrendChart';
import TransactionLedger from '../components/TransactionLedger';
import RecurrenceShelf from '../components/RecurrenceShelf';
import AddTransactionModal from '../components/AddTransactionModal';
import AccountWorkspace from './AccountWorkspace';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  LogOut, 
  Plus,
  MessageSquare,
  Wallet,
  Download,
  ShieldAlert,
  Percent,
  Coins,
  LayoutDashboard,
  User
} from 'lucide-react';

interface DashboardProps {
  user: any;
  onLogout: () => void;
  onToggleMahi: () => void;
  isMahiOpen: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onToggleMahi, isMahiOpen }) => {
  const { 
    transactions,
    convertedTransactions, 
    loading, 
    aiInsights, 
    aiLoading,
    primaryCurrency,
    setPrimaryCurrency,
    addTransaction,
    deleteTransaction,
    userProfile,
    updateUserProfile
  } = useTransactions();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'account'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [limitInput, setLimitInput] = useState(userProfile.monthlyLimit.toString());
  const [showLimitEdit, setShowLimitEdit] = useState(false);

  // 1. Calculate Totals
  const totalIncome = useMemo(() => {
    return convertedTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [convertedTransactions]);

  const totalExpense = useMemo(() => {
    return convertedTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [convertedTransactions]);

  // Adjust balance: Income minus Expenses, and also subtract what has been funded to savings goals (since those are allocated out of core cash)
  const totalSavingsAllocated = useMemo(() => {
    return userProfile.savingsGoals.reduce((sum, g) => sum + g.current, 0);
  }, [userProfile.savingsGoals]);

  const totalBalance = totalIncome - totalExpense - totalSavingsAllocated;

  // 2. Calculate P2P Debt Matrix Totals
  const totalReceivables = useMemo(() => {
    return convertedTransactions
      .filter((t) => t.type === 'lent')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [convertedTransactions]);

  const totalPayables = useMemo(() => {
    return convertedTransactions
      .filter((t) => t.type === 'borrowed')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [convertedTransactions]);

  // 3. Calculate Current Month Expenses for Budget Cap
  const currentMonthExpenses = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return convertedTransactions
      .filter((t) => {
        const d = new Date(t.date);
        return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [convertedTransactions]);

  const budgetRatio = Math.min(1, currentMonthExpenses / userProfile.monthlyLimit);
  const budgetPercentage = Math.round(budgetRatio * 100);
  const isBudgetWarning = budgetRatio >= 0.8;

  const handleSignOut = async () => {
    await dbAuth.signOut();
    onLogout();
  };

  const formatCurrency = (val: number) => {
    return currencyService.format(val, primaryCurrency);
  };

  // 5. Split Transaction Implementation
  const handleSplitTransaction = async (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    // Delete the original transaction
    await deleteTransaction(id);

    // Create a new halved transaction labeled as Split
    await addTransaction(
      Math.round((tx.amount / 2) * 100) / 100,
      tx.category,
      tx.note.startsWith('Split: ') ? tx.note : `Split: ${tx.note}`,
      tx.type,
      tx.currency,
      tx.paymentMethod
    );
  };

  // 6. CSV Ledger Export Utility
  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Amount', 'Currency', 'Category', 'Note', 'Payment Method'];
    const rows = convertedTransactions.map(t => [
      new Date(t.date).toISOString().replace('T', ' ').substring(0, 19),
      t.type,
      t.amount,
      t.currency,
      t.category,
      t.note,
      t.paymentMethod || 'N/A'
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `expenso_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveLimit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(limitInput);
    if (!isNaN(val) && val > 0) {
      updateUserProfile({ monthlyLimit: val });
      setShowLimitEdit(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative pb-16 pt-6">
      <div className="max-w-7xl mx-auto w-full px-6">
        
        {/* Top Header Navigation */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <span className="text-primary text-[10px] font-bold uppercase tracking-widest block font-sans">Dashboard Terminal</span>
            <h1 className="text-white text-2xl font-black tracking-tight mt-0.5 font-sans">expenso</h1>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            
            {/* View Switcher (Dashboard vs Account & Goals) */}
            <div className="flex bg-white/3 border border-white/8 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xxs font-bold cursor-pointer transition-all duration-150 flex items-center gap-1 ${
                  activeTab === 'dashboard' 
                    ? 'bg-white/10 text-primary border border-white/5' 
                    : 'text-text-muted hover:text-white'
                }`}
              >
                <LayoutDashboard size={12} />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className={`px-3 py-1.5 rounded-lg text-xxs font-bold cursor-pointer transition-all duration-150 flex items-center gap-1 ${
                  activeTab === 'account' 
                    ? 'bg-white/10 text-primary border border-white/5' 
                    : 'text-text-muted hover:text-white'
                }`}
              >
                <User size={12} />
                <span>Account & Goals</span>
              </button>
            </div>

            {/* Primary Currency Switcher */}
            <div className="flex bg-white/3 border border-white/8 p-1 rounded-xl">
              {(['USD', 'EUR', 'INR'] as const).map((cur) => (
                <button
                  key={cur}
                  onClick={() => setPrimaryCurrency(cur)}
                  className={`px-3 py-1.5 rounded-lg text-xxs font-bold cursor-pointer transition-all duration-150 ${
                    primaryCurrency === cur 
                      ? 'bg-white/10 text-primary border border-white/5' 
                      : 'text-text-muted hover:text-white'
                  }`}
                >
                  {cur}
                </button>
              ))}
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="p-2 rounded-xl bg-white/3 border border-white/8 hover:border-white/15 text-text-muted hover:text-white transition-all duration-150 cursor-pointer flex items-center justify-center"
              title="Export Ledger to CSV"
            >
              <Download size={14} />
            </button>

            {/* Mahi AI Toggle Button */}
            <button
              onClick={onToggleMahi}
              className={`px-4 py-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all duration-150 cursor-pointer ${
                isMahiOpen 
                  ? 'bg-secondary/15 border-secondary text-secondary shadow-lg shadow-secondary/10' 
                  : 'bg-white/3 border-white/8 hover:border-white/15 text-white'
              }`}
            >
              <MessageSquare size={14} />
              <span>Mahi AI</span>
            </button>

            {/* Log Transaction Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-tr from-primary to-secondary text-black font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-primary/10 hover:brightness-110 active:scale-[0.99] transition-all duration-150 cursor-pointer"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Log Entry</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleSignOut}
              className="p-2 rounded-xl bg-white/3 border border-white/8 hover:border-red-500/30 hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-all duration-150 cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>

          </div>
        </header>

        {/* View Layout Switch Router */}
        <AnimatePresence mode="wait">
          {activeTab === 'account' ? (
            <motion.div
              key="account"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AccountWorkspace user={user} />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Top Grid: Balance, AI Diagnostics, and P2P Credit Matrix */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Balance & Budget Cap Card */}
                <div className="lg:col-span-2 glass rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                  <div className="absolute top-[-20%] right-[-10%] w-44 h-44 rounded-full opacity-5 bg-primary blur-3xl pointer-events-none" />
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="text-text-muted" size={14} />
                      <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider">
                        Available Balance (Liquidity)
                      </span>
                    </div>
                    
                    <h2 className="text-white text-4xl font-black tracking-tight">
                      {formatCurrency(totalBalance)}
                    </h2>

                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="text-primary" size={12} />
                        <span className="text-text-muted text-[10px]">In: <strong className="text-white">{formatCurrency(totalIncome)}</strong></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingDown className="text-secondary" size={12} />
                        <span className="text-text-muted text-[10px]">Out: <strong className="text-white">{formatCurrency(totalExpense)}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Budget Cap Engine Widget */}
                  <div className="mt-6 pt-4 border-t border-white/5">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert className={isBudgetWarning ? "text-red-400 animate-pulse" : "text-secondary"} size={14} />
                        <span className="text-white text-xs font-bold">Monthly Budget Cap</span>
                      </div>

                      {showLimitEdit ? (
                        <form onSubmit={handleSaveLimit} className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={limitInput}
                            onChange={(e) => setLimitInput(e.target.value)}
                            className="w-16 bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-xxs text-white font-bold outline-none"
                          />
                          <button type="submit" className="text-primary text-[10px] font-black uppercase">Set</button>
                        </form>
                      ) : (
                        <button 
                          onClick={() => setShowLimitEdit(true)}
                          className="text-text-muted hover:text-white text-[10px] font-bold uppercase transition-colors duration-150 animate-pulse"
                        >
                          Limit: {formatCurrency(userProfile.monthlyLimit)}
                        </button>
                      )}
                    </div>

                    {/* Progress Bar Container */}
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${budgetPercentage}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{
                          background: isBudgetWarning 
                            ? 'linear-gradient(90deg, #FF2D55 0%, #E6003A 100%)' 
                            : 'linear-gradient(90deg, #00F5FF 0%, #39FF14 100%)',
                          boxShadow: isBudgetWarning 
                            ? '0 0 8px rgba(255, 45, 85, 0.4)' 
                            : '0 0 8px rgba(0, 245, 255, 0.4)'
                        }}
                      />
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      <span className="text-text-muted text-[9px] font-bold uppercase tracking-wider">
                        Spent: {formatCurrency(currentMonthExpenses)}
                      </span>
                      <span 
                        className={`text-[9px] font-bold uppercase tracking-wider ${
                          isBudgetWarning ? 'text-red-400' : 'text-primary'
                        }`}
                      >
                        {budgetPercentage}% Consumed
                      </span>
                    </div>
                  </div>
                </div>

                {/* P2P Credit Ledger Card */}
                <div className="glass rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-[-10%] right-[-10%] w-32 h-32 rounded-full opacity-5 bg-secondary blur-2xl pointer-events-none" />

                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <Coins className="text-secondary" size={14} />
                      <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider">
                        P2P Credit Matrix
                      </span>
                    </div>
                    <span className="text-[9px] bg-white/5 border border-white/10 rounded-full px-2 py-0.5 font-bold text-text-muted">
                      Lending & Debt
                    </span>
                  </div>

                  <div className="space-y-4 my-2">
                    {/* Receivables (Lent) */}
                    <div className="flex justify-between items-center bg-white/2 border border-white/5 rounded-2xl p-3">
                      <div>
                        <span className="text-text-muted text-[9px] font-bold uppercase tracking-wider block">Receivables (Lent)</span>
                        <span className="text-primary text-base font-black mt-0.5 block">{formatCurrency(totalReceivables)}</span>
                      </div>
                      <div className="text-[10px] text-primary font-bold uppercase tracking-wider bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-lg">
                        To Collect
                      </div>
                    </div>

                    {/* Payables (Borrowed) */}
                    <div className="flex justify-between items-center bg-white/2 border border-white/5 rounded-2xl p-3">
                      <div>
                        <span className="text-text-muted text-[9px] font-bold uppercase tracking-wider block">Payables (Borrowed)</span>
                        <span className="text-red-400 text-base font-black mt-0.5 block">{formatCurrency(totalPayables)}</span>
                      </div>
                      <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-lg">
                        To Pay
                      </div>
                    </div>
                  </div>

                  <div className="text-[9px] text-text-muted leading-tight border-t border-white/5 pt-3.5 mt-2">
                    Mahi automatically parses lending statements: <em className="text-white/70">"I lent $30 to Sam"</em>.
                  </div>
                </div>

              </div>

              {/* Middle Grid: Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SvgDonutChart transactions={convertedTransactions} primaryCurrency={primaryCurrency} />
                <SvgTrendChart transactions={convertedTransactions} primaryCurrency={primaryCurrency} />
              </div>

              {/* Bottom Layout: Enclaves, Recurrence, and Ledger */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column (Span 2): Recurrence Shelf & Ledger */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Recurrence Shelf */}
                  <RecurrenceShelf transactions={transactions} primaryCurrency={primaryCurrency} />

                  {/* Transaction Ledger */}
                  <TransactionLedger 
                    transactions={convertedTransactions} 
                    primaryCurrency={primaryCurrency} 
                    onDeleteTransaction={deleteTransaction}
                    onSplitTransaction={handleSplitTransaction}
                  />
                </div>

                {/* Right Column (Span 1): Savings Enclaves Goals (Live mapped) */}
                <div className="glass rounded-3xl p-6 shadow-xl h-full flex flex-col justify-between min-h-[460px]">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Percent className="text-accent" size={14} />
                      <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider">
                        Savings Enclaves
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      {userProfile.savingsGoals.length === 0 ? (
                        <div className="py-12 text-center">
                          <p className="text-text-muted text-xxs">No active enclaves. Go to "Account & Goals" to initialize one!</p>
                        </div>
                      ) : (
                        userProfile.savingsGoals.slice(0, 4).map((goal) => {
                          const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));
                          
                          // SVG Circular Progress Settings
                          const radius = 22;
                          const strokeWidth = 4.5;
                          const circumference = 2 * Math.PI * radius;
                          const strokeDashoffset = circumference - (percent / 100) * circumference;

                          return (
                            <div 
                              key={goal.id} 
                              className="flex items-center justify-between p-3 bg-white/2 border border-white/5 rounded-2xl hover:bg-white/4 transition-colors duration-150"
                            >
                              <div className="min-w-0 flex-1 mr-3">
                                <h4 className="text-white text-xs font-bold truncate">{goal.name}</h4>
                                <span className="text-text-muted text-[9px] mt-0.5 block">
                                  Target: {formatCurrency(goal.target)}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right">
                                  <span className="text-white text-xs font-bold block">{formatCurrency(goal.current)}</span>
                                  <span className="text-text-muted text-[9px] block font-bold">{percent}%</span>
                                </div>
                                
                                {/* Circle SVG */}
                                <div className="relative w-12 h-12 flex items-center justify-center">
                                  <svg width="48" height="48" className="transform -rotate-90">
                                    <circle
                                      cx="24"
                                      cy="24"
                                      r={radius}
                                      fill="transparent"
                                      stroke="rgba(255,255,255,0.03)"
                                      strokeWidth={strokeWidth}
                                    />
                                    <circle
                                      cx="24"
                                      cy="24"
                                      r={radius}
                                      fill="transparent"
                                      stroke={goal.color}
                                      strokeWidth={strokeWidth}
                                      strokeDasharray={circumference}
                                      strokeDashoffset={strokeDashoffset}
                                      strokeLinecap="round"
                                      className="transition-all duration-500 ease-out"
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[8px] font-extrabold" style={{ color: goal.color }}>
                                      {percent}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="bg-white/2 border border-white/5 rounded-2xl p-4 mt-6">
                    <span className="text-text-muted text-[9px] font-bold uppercase tracking-wider block">Diagnostics</span>
                    <p className="text-white text-xxs leading-relaxed font-medium mt-1">
                      Allocating 15% of monthly dev retainers satisfies the Emergency Fund trajectory.
                    </p>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Modal Dialog */}
      <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

    </div>
  );
};

export default Dashboard;
