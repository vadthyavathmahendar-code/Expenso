import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Transaction } from '../services/dbService';
import { currencyService, type CurrencyCode } from '../services/currency';
import { useTransactions } from '../context/TransactionContext';
import { 
  Utensils, 
  Car, 
  Briefcase, 
  Film, 
  Receipt, 
  HelpCircle, 
  Trash2,
  Scissors,
  Filter,
  Plus
} from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

interface TransactionLedgerProps {
  transactions: Transaction[];
  primaryCurrency: CurrencyCode;
  onDeleteTransaction: (id: string) => void;
  onSplitTransaction: (id: string) => void;
  initialCategoryFilter?: string | null;
  onCategoryFilterChange?: (category: string | null) => void;
  onOpenAddTransaction?: () => void;
}

type DateHorizon = 'all' | '7days' | '30days' | 'month';
type PaymentMethodFilter = 'all' | 'Cash' | 'Credit Card' | 'UPI' | 'Bank Transfer';

const getCategoryIcon = (category: string, color: string) => {
  const size = 16;
  switch (category.toLowerCase()) {
    case 'food':
      return <Utensils color={color} size={size} />;
    case 'transport':
      return <Car color={color} size={size} />;
    case 'salary':
      return <Briefcase color={color} size={size} />;
    case 'entertainment':
      return <Film color={color} size={size} />;
    case 'bills':
      return <Receipt color={color} size={size} />;
    default:
      return <HelpCircle color={color} size={size} />;
  }
};

export const TransactionLedger: React.FC<TransactionLedgerProps> = ({
  transactions,
  primaryCurrency,
  onDeleteTransaction,
  onSplitTransaction,
  initialCategoryFilter,
  onCategoryFilterChange,
  onOpenAddTransaction,
}) => {
  const { accounts } = useTransactions();
  
  // Date and Payment Method filters
  const [dateFilter, setDateFilter] = useState<DateHorizon>('all');
  const [methodFilter, setMethodFilter] = useState<PaymentMethodFilter>('all');

  // Advanced Filters
  const [searchVal, setSearchVal] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');

  // Confirmation modal state
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState<string | null>(null);

  // Sync category filter with prop from Donut Chart
  useEffect(() => {
    if (initialCategoryFilter) {
      setCategoryFilter(initialCategoryFilter);
    } else {
      setCategoryFilter('all');
    }
  }, [initialCategoryFilter]);

  // Search input debouncer
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchVal);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchVal]);

  const handleCategoryChange = (val: string) => {
    setCategoryFilter(val);
    onCategoryFilterChange?.(val === 'all' ? null : val);
  };

  const handleResetFilters = () => {
    setDateFilter('all');
    setMethodFilter('all');
    setSearchVal('');
    setDebouncedSearch('');
    setCategoryFilter('all');
    onCategoryFilterChange?.(null);
    setAccountFilter('all');
    setMinAmount('');
    setMaxAmount('');
  };

  const handleDeleteClick = (id: string) => {
    setTxToDelete(id);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (txToDelete) {
      onDeleteTransaction(txToDelete);
      setTxToDelete(null);
    }
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(item => {
      // 1. Payment Method Filter
      if (methodFilter !== 'all' && item.paymentMethod !== methodFilter) {
        return false;
      }

      // 2. Date Horizon Filter
      const txDate = new Date(item.date).getTime();
      const now = new Date().getTime();
      const diffDays = (now - txDate) / (1000 * 60 * 60 * 24);

      if (dateFilter === '7days' && diffDays > 7) return false;
      if (dateFilter === '30days' && diffDays > 30) return false;
      if (dateFilter === 'month') {
        const tDate = new Date(item.date);
        const currentDate = new Date();
        if (tDate.getMonth() !== currentDate.getMonth() || tDate.getFullYear() !== currentDate.getFullYear()) {
          return false;
        }
      }

      // 3. Category Filter
      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }

      // 4. Bank Account Filter
      if (accountFilter !== 'all' && item.bankAccountId !== accountFilter) {
        return false;
      }

      // 5. Amount Range Filter
      if (minAmount !== '') {
        const min = parseFloat(minAmount);
        if (!isNaN(min) && item.amount < min) return false;
      }
      if (maxAmount !== '') {
        const max = parseFloat(maxAmount);
        if (!isNaN(max) && item.amount > max) return false;
      }

      // 6. Search Term Filter (Note or Category)
      if (debouncedSearch.trim() !== '') {
        const term = debouncedSearch.toLowerCase();
        const noteMatch = item.note?.toLowerCase().includes(term);
        const catMatch = item.category.toLowerCase().includes(term);
        if (!noteMatch && !catMatch) return false;
      }

      return true;
    });
  }, [transactions, dateFilter, methodFilter, categoryFilter, accountFilter, minAmount, maxAmount, debouncedSearch]);

  return (
    <div className="glass rounded-3xl p-6 flex flex-col h-full min-h-[460px]">
      
      {/* Ledger Header & Advanced Filters */}
      <div className="flex flex-col gap-4 mb-5 pb-4 border-b border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider font-sans">Transaction Ledger</h3>
            <span className="text-text-muted text-xs font-semibold block mt-0.5 font-sans">
              Showing {filteredTransactions.length} of {transactions.length} Entries
            </span>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Date Horizon */}
            <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
              {(['all', '7days', '30days', 'month'] as const).map((horizon) => {
                const label = horizon === 'all' ? 'All Time' : horizon === '7days' ? '7D' : horizon === '30days' ? '30D' : 'Month';
                return (
                  <button
                    key={horizon}
                    onClick={() => setDateFilter(horizon)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all duration-150 font-sans ${
                      dateFilter === horizon 
                        ? 'bg-white/10 text-white' 
                        : 'text-text-muted hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Payment Method */}
            <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
              {(['all', 'Cash', 'Credit Card', 'UPI', 'Bank Transfer'] as const).map((method) => {
                const label = method === 'all' ? 'All Methods' : method === 'Credit Card' ? 'Card' : method;
                return (
                  <button
                    key={method}
                    onClick={() => setMethodFilter(method)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all duration-150 font-sans ${
                      methodFilter === method 
                        ? 'bg-white/10 text-secondary' 
                        : 'text-text-muted hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Advanced Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-black/10 p-3 rounded-2xl border border-white/5">
          {/* Search bar */}
          <div className="flex flex-col gap-1">
            <label className="text-[8px] text-text-muted font-bold uppercase tracking-wider font-sans">Search Note/Merchant</label>
            <input
              id="ledger-search-input"
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Type to search..."
              className="bg-black/30 border border-white/8 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-white/15 font-sans"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[8px] text-text-muted font-bold uppercase tracking-wider font-sans">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="bg-black/30 border border-white/8 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-white/15 font-sans"
            >
              <option value="all">All Categories</option>
              <option value="Food">Food</option>
              <option value="Transport">Transport</option>
              <option value="Bills">Bills</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Salary">Salary</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Bank Account Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[8px] text-text-muted font-bold uppercase tracking-wider font-sans">Bank Account</label>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="bg-black/30 border border-white/8 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-white/15 font-sans"
            >
              <option value="all">All Accounts</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.accountName}</option>
              ))}
            </select>
          </div>

          {/* Amount Range Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[8px] text-text-muted font-bold uppercase tracking-wider font-sans">Amount Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="w-1/2 bg-black/30 border border-white/8 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-white/15 font-sans"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="w-1/2 bg-black/30 border border-white/8 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-white/15 font-sans"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ledger List */}
      <div className="flex-1 overflow-y-auto max-h-[360px] pr-1">
        {transactions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-16 text-center">
            <div className="text-3xl mb-2 animate-pulse">📄</div>
            <p className="text-text-muted text-xs font-semibold font-sans">No transactions yet.</p>
            <p className="text-text-muted text-[9px] mt-1 font-sans">Start tracking your spending by logging your first expense.</p>
            <button
              onClick={onOpenAddTransaction}
              className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-tr from-primary to-secondary text-black font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-primary/10 hover:brightness-110 active:scale-98 transition-all duration-150 cursor-pointer font-sans"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Add Transaction</span>
            </button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-16 text-center">
            <Filter className="text-text-muted mb-2 animate-pulse" size={24} />
            <p className="text-text-muted text-xs font-semibold font-sans">No transactions match current filters.</p>
            <button 
              onClick={handleResetFilters}
              className="text-primary text-[10px] font-bold uppercase mt-2 hover:underline cursor-pointer font-sans"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {filteredTransactions.map((item) => {
                const isP2P = item.type === 'lent' || item.type === 'borrowed';
                
                let accentColor = '#39FF14'; // Default Mint
                if (item.type === 'expense') accentColor = '#00F5FF'; // Cyan
                if (item.type === 'borrowed') accentColor = '#FF2D55'; // Crimson
                
                const iconBg = item.type === 'expense' 
                  ? 'rgba(0, 245, 255, 0.04)' 
                  : item.type === 'borrowed'
                    ? 'rgba(255, 45, 85, 0.04)'
                    : 'rgba(57, 255, 20, 0.04)';
                    
                const iconBorder = item.type === 'expense' 
                  ? 'rgba(0, 245, 255, 0.12)' 
                  : item.type === 'borrowed'
                    ? 'rgba(255, 45, 85, 0.12)'
                    : 'rgba(57, 255, 20, 0.12)';

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="bg-white/2 border border-white/5 rounded-2xl p-3 flex justify-between items-center hover:bg-white/4 group transition-colors duration-150"
                  >
                    {/* Left: Icon & Details */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div 
                        className="w-9 h-9 rounded-xl flex items-center justify-center border shrink-0"
                        style={{ backgroundColor: iconBg, borderColor: iconBorder }}
                      >
                        {getCategoryIcon(item.category, accentColor)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-white text-xs font-bold truncate font-sans">
                            {item.note || item.category}
                          </h4>
                          {isP2P && (
                            <span className="text-[8px] px-1.5 py-0.2 rounded-full font-bold bg-white/5 border border-white/10 text-text-muted font-sans">
                              P2P
                            </span>
                          )}
                        </div>
                        
                        {/* Three distinct badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className="text-[7.5px] px-1.5 py-0.5 rounded-md font-bold bg-white/5 border border-white/8 text-primary uppercase tracking-wider font-sans">
                            {item.category}
                          </span>
                          {item.paymentMethod && (
                            <span className="text-[7.5px] px-1.5 py-0.5 rounded-md font-bold bg-white/5 border border-white/8 text-secondary uppercase tracking-wider font-sans">
                              {item.paymentMethod}
                            </span>
                          )}
                          {(() => {
                            const linkedAcc = accounts.find(a => a.id === item.bankAccountId);
                            if (!linkedAcc) return null;
                            return (
                              <span className="text-[7.5px] px-1.5 py-0.5 rounded-md font-bold bg-white/5 border border-white/8 text-accent uppercase tracking-wider font-sans">
                                {linkedAcc.accountName}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount & Action Triggers */}
                    <div className="flex items-center gap-3 ml-2 shrink-0">
                      <div className="text-right">
                        <span 
                          className="text-xs font-bold flex items-center justify-end gap-0.5 font-sans"
                          style={{ color: (item.type === 'expense' || item.type === 'borrowed') ? '#FFFFFF' : '#39FF14' }}
                        >
                          {(item.type === 'expense' || item.type === 'borrowed') ? '-' : '+'}
                          {currencyService.format(item.amount, primaryCurrency)}
                        </span>
                        <span className="text-text-muted text-[8px] font-bold block uppercase tracking-wider font-sans">
                          {item.currency || 'USD'}
                        </span>
                      </div>

                      {/* Action Panel (Visible on Hover) */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-all duration-150">
                        {/* Split Button */}
                        <button
                          onClick={() => onSplitTransaction(item.id)}
                          className="p-1.5 rounded-lg bg-secondary/10 hover:bg-secondary/20 text-secondary hover:text-cyan-300 border border-secondary/20 transition-all duration-150 cursor-pointer"
                          title="Split / Halve Transaction"
                        >
                          <Scissors size={12} />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteClick(item.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-all duration-150 cursor-pointer"
                          title="Delete Transaction"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction? This action will reverse the balance adjustment."
        confirmLabel="Delete"
      />

    </div>
  );
};

export default TransactionLedger;
