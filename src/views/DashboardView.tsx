import React, { useMemo, useState } from 'react';
import { useTransactions } from '../context/TransactionContext';
import { currencyService } from '../services/currency';
import SvgTrendChart from '../components/SvgTrendChart';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardViewProps {
  onNavigateToVault?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateToVault }) => {
  const { 
    convertedTransactions, 
    primaryCurrency,
    userProfile,
    updateUserProfile,
    accounts,
    setMahiOpen,
    setMahiTriggerText
  } = useTransactions();

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

  const totalSavingsAllocated = useMemo(() => {
    return userProfile.savingsGoals.reduce((sum, g) => sum + g.current, 0);
  }, [userProfile.savingsGoals]);

  const totalBalance = useMemo(() => {
    return totalIncome - totalExpense - totalSavingsAllocated;
  }, [totalIncome, totalExpense, totalSavingsAllocated]);

  // Budget Cap Calculations
  const currentMonthExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return convertedTransactions
      .filter((t) => {
        if (t.type !== 'expense') return false;
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [convertedTransactions]);

  const budgetPercentage = useMemo(() => {
    if (userProfile.monthlyLimit <= 0) return 0;
    const pct = Math.round((currentMonthExpenses / userProfile.monthlyLimit) * 100);
    return Math.min(100, pct);
  }, [currentMonthExpenses, userProfile.monthlyLimit]);

  const isBudgetWarning = useMemo(() => {
    return budgetPercentage >= 85;
  }, [budgetPercentage]);

  const formatCurrency = (val: number) => {
    return currencyService.format(val, primaryCurrency);
  };

  const handleSaveLimit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(limitInput);
    if (!isNaN(val) && val > 0) {
      updateUserProfile({ monthlyLimit: val });
      setShowLimitEdit(false);
    }
  };

  // --- KPI Card Calculations ---
  
  // Today's Spending
  const todaySpending = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return convertedTransactions
      .filter((t) => t.type === 'expense' && t.date.split('T')[0] === todayStr)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [convertedTransactions]);

  // Monthly Savings (Income - Expenses for this month)
  const monthlySavings = useMemo(() => {
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();

    const monthIncome = convertedTransactions
      .filter((t) => t.type === 'income' && new Date(t.date).getMonth() === curMonth && new Date(t.date).getFullYear() === curYear)
      .reduce((sum, t) => sum + t.amount, 0);

    const monthExpense = convertedTransactions
      .filter((t) => t.type === 'expense' && new Date(t.date).getMonth() === curMonth && new Date(t.date).getFullYear() === curYear)
      .reduce((sum, t) => sum + t.amount, 0);

    return monthIncome - monthExpense;
  }, [convertedTransactions]);

  // Upcoming Bills (sum of Bills category this month)
  const upcomingBills = useMemo(() => {
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();
    return convertedTransactions
      .filter((t) => t.type === 'expense' && t.category === 'Bills' && new Date(t.date).getMonth() === curMonth && new Date(t.date).getFullYear() === curYear)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [convertedTransactions]);

  // Total Transactions
  const totalTransactionsCount = convertedTransactions.length;

  return (
    <div className="space-y-6">
      
      {/* Top Grid: Balance and Budget Cap Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Balance & Budget Cap Card (Spans 2 columns) */}
        <div className="lg:col-span-2 glass rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="absolute top-[-20%] right-[-10%] w-44 h-44 rounded-full opacity-5 bg-primary blur-3xl pointer-events-none" />
          
          <div>
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <Wallet className="text-text-muted" size={14} />
                <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider font-sans">
                  Available Balance (Liquidity)
                </span>
              </div>

              {/* Explain My Spending Button */}
              <button
                onClick={() => {
                  setMahiTriggerText("Explain my spending");
                  setMahiOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-tr from-accent to-secondary text-black font-black text-[9px] uppercase tracking-wider shadow-md hover:brightness-110 active:scale-98 transition-all duration-150 cursor-pointer flex items-center gap-1 font-sans"
              >
                <Sparkles size={10} />
                <span>Explain My Spending</span>
              </button>
            </div>
            
            <h2 className="text-white text-4xl font-black tracking-tight font-sans">
              {formatCurrency(totalBalance)}
            </h2>

            <div className="flex justify-between items-center mt-4 text-[9px] text-text-muted font-bold font-sans">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <TrendingUp className="text-primary" size={12} />
                  <span>In: <strong className="text-white">{formatCurrency(totalIncome)}</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingDown className="text-secondary" size={12} />
                  <span>Out: <strong className="text-white">{formatCurrency(totalExpense)}</strong></span>
                </div>
              </div>
              <span className="opacity-70 font-sans">
                Analytics Last Updated: Just now
              </span>
            </div>
          </div>

          {/* Budget Cap Engine Widget */}
          <div className="mt-6 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className={isBudgetWarning ? "text-red-400 animate-pulse" : "text-secondary"} size={14} />
                <span className="text-white text-xs font-bold font-sans">Monthly Budget Cap</span>
              </div>

              {showLimitEdit ? (
                <form onSubmit={handleSaveLimit} className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={limitInput}
                    onChange={(e) => setLimitInput(e.target.value)}
                    className="w-16 bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-xxs text-white font-bold outline-none"
                  />
                  <button type="submit" className="text-primary text-[10px] font-black uppercase font-sans">Set</button>
                </form>
              ) : (
                <button 
                  onClick={() => setShowLimitEdit(true)}
                  className="text-text-muted hover:text-white text-[10px] font-bold uppercase transition-colors duration-150 animate-pulse font-sans"
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

            <div className="flex justify-between items-center mt-2 font-sans">
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

        {/* Connected Liquidity Nodes Card (Spans 1 column) */}
        <div className="glass rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="absolute top-[-10%] right-[-10%] w-32 h-32 rounded-full opacity-5 bg-secondary blur-2xl pointer-events-none" />
          
          <div className="w-full">
            <div className="flex justify-between items-center mb-4">
              <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider block font-sans">Connected Liquidity Nodes</span>
              <span className="text-[8px] bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5 font-bold text-text-muted font-sans">
                Accounts
              </span>
            </div>

            {accounts.length === 0 ? (
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <div className="text-2xl mb-1.5 animate-pulse">🏦</div>
                <p className="text-text-muted text-[10px] font-semibold font-sans">No accounts connected.</p>
                <p className="text-text-muted text-[8px] mt-0.5 font-sans">Connect your first bank account to track balances.</p>
                <button
                  onClick={onNavigateToVault}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-primary font-bold text-[9px] uppercase tracking-wider transition-all duration-150 cursor-pointer font-sans"
                >
                  + Add Account
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                {accounts.map(acc => {
                  const isLow = acc.balance < acc.lowBalanceAlertLimit;
                  return (
                    <div
                      key={acc.id}
                      className={`p-3 rounded-2xl bg-white/2 border transition-all duration-300 flex justify-between items-center ${
                        isLow 
                          ? 'border-orange-500/40 bg-orange-500/5 shadow-[0_0_10px_rgba(249,115,22,0.15)] animate-pulse' 
                          : 'border-white/5 hover:bg-white/4'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white text-xs font-black truncate font-sans">{acc.accountName}</span>
                          <span className="text-[8px] opacity-60 text-text-muted font-sans">({acc.accountType})</span>
                        </div>
                        {isLow && (
                          <span className="text-[8px] text-orange-400 font-bold uppercase tracking-wider mt-0.5 block font-sans">
                            Low Liquidity Reminder
                          </span>
                        )}
                      </div>
                      <span className={`text-xs font-black shrink-0 ml-2 font-sans ${isLow ? 'text-orange-400' : 'text-white'}`}>
                        {formatCurrency(acc.balance)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-white/5 pt-3 mt-4 flex justify-between items-center font-sans">
            <span className="text-text-muted text-[9px] font-bold uppercase tracking-wider">Total Net Liquidity</span>
            <span className="text-accent text-sm font-black">{formatCurrency(accounts.reduce((sum, a) => sum + a.balance, 0))}</span>
          </div>
        </div>

      </div>

      {/* 4 Compact KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-4 flex flex-col justify-between min-h-[75px] hover:border-white/10 transition-colors">
          <span className="text-text-muted text-[9.5px] font-bold uppercase tracking-wider font-sans">Today's Spending</span>
          <h4 className="text-white text-base font-black mt-1 font-sans">{formatCurrency(todaySpending)}</h4>
        </div>
        <div className="glass rounded-2xl p-4 flex flex-col justify-between min-h-[75px] hover:border-white/10 transition-colors">
          <span className="text-text-muted text-[9.5px] font-bold uppercase tracking-wider font-sans">Monthly Savings</span>
          <h4 className="text-white text-base font-black mt-1 font-sans">{formatCurrency(monthlySavings)}</h4>
        </div>
        <div className="glass rounded-2xl p-4 flex flex-col justify-between min-h-[75px] hover:border-white/10 transition-colors">
          <span className="text-text-muted text-[9.5px] font-bold uppercase tracking-wider font-sans">Upcoming Bills</span>
          <h4 className="text-white text-base font-black mt-1 font-sans">{formatCurrency(upcomingBills)}</h4>
        </div>
        <div className="glass rounded-2xl p-4 flex flex-col justify-between min-h-[75px] hover:border-white/10 transition-colors">
          <span className="text-text-muted text-[9.5px] font-bold uppercase tracking-wider font-sans">Total Transactions</span>
          <h4 className="text-white text-base font-black mt-1 font-sans">{totalTransactionsCount}</h4>
        </div>
      </div>

      {/* Cash Flow Forecast Graph */}
      <div className="glass rounded-3xl p-6 shadow-xl">
        <div className="mb-4">
          <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider block font-sans">Predictive Cash Flow</span>
          <h3 className="text-white text-base font-black font-sans">7-Day Outflow & 3-Day Neon Forecasting</h3>
        </div>
        <SvgTrendChart transactions={convertedTransactions} primaryCurrency={primaryCurrency} />
      </div>

    </div>
  );
};

export default DashboardView;
