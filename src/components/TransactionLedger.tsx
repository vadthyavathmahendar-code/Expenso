import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Transaction } from '../services/dbService';
import { currencyService, type CurrencyCode } from '../services/currency';
import { 
  Utensils, 
  Car, 
  Briefcase, 
  Film, 
  Receipt, 
  HelpCircle, 
  Trash2,
  Scissors,
  Calendar,
  CreditCard as CardIcon,
  Filter
} from 'lucide-react';

interface TransactionLedgerProps {
  transactions: Transaction[];
  primaryCurrency: CurrencyCode;
  onDeleteTransaction: (id: string) => void;
  onSplitTransaction: (id: string) => void;
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
}) => {
  const [dateFilter, setDateFilter] = useState<DateHorizon>('all');
  const [methodFilter, setMethodFilter] = useState<PaymentMethodFilter>('all');

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(item => {
      // 1. Filter by Payment Method
      if (methodFilter !== 'all' && item.paymentMethod !== methodFilter) {
        return false;
      }

      // 2. Filter by Date Horizon
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

      return true;
    });
  }, [transactions, dateFilter, methodFilter]);

  return (
    <div className="glass rounded-3xl p-6 flex flex-col h-full min-h-[460px]">
      
      {/* Ledger Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5 pb-4 border-b border-white/5">
        <div>
          <h3 className="text-white text-sm font-semibold uppercase tracking-wider">Transaction Ledger</h3>
          <span className="text-text-muted text-xs font-semibold block mt-0.5">
            Showing {filteredTransactions.length} of {transactions.length} Entries
          </span>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          {/* Date Horizon Filter */}
          <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
            {(['all', '7days', '30days', 'month'] as const).map((horizon) => {
              const label = horizon === 'all' ? 'All Time' : horizon === '7days' ? '7D' : horizon === '30days' ? '30D' : 'Month';
              return (
                <button
                  key={horizon}
                  onClick={() => setDateFilter(horizon)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all duration-150 ${
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

          {/* Payment Method Filter */}
          <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
            {(['all', 'Cash', 'Credit Card', 'UPI', 'Bank Transfer'] as const).map((method) => {
              const label = method === 'all' ? 'All Methods' : method === 'Credit Card' ? 'Card' : method;
              return (
                <button
                  key={method}
                  onClick={() => setMethodFilter(method)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all duration-150 ${
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

      {/* Ledger List */}
      <div className="flex-1 overflow-y-auto max-h-[360px] pr-1">
        {filteredTransactions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-16 text-center">
            <Filter className="text-text-muted mb-2 animate-pulse" size={24} />
            <p className="text-text-muted text-xs font-semibold">No transactions match current filters.</p>
            <button 
              onClick={() => { setDateFilter('all'); setMethodFilter('all'); }}
              className="text-primary text-[10px] font-bold uppercase mt-2 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {filteredTransactions.map((item) => {
                const isExpense = item.type === 'expense' || item.type === 'lent';
                const isP2P = item.type === 'lent' || item.type === 'borrowed';
                
                // Color codes:
                // Expense: Cyan, Income: Mint, Lent: Mint (receivable), Borrowed: Crimson (payable)
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
                          <h4 className="text-white text-xs font-bold truncate">
                            {item.note || item.category}
                          </h4>
                          {isP2P && (
                            <span className="text-[8px] px-1.5 py-0.2 rounded-full font-bold bg-white/5 border border-white/10 text-text-muted">
                              P2P
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-text-muted text-[8px] font-bold uppercase tracking-wider">
                            {new Date(item.date).toLocaleDateString(undefined, { 
                              month: 'short', 
                              day: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          {item.paymentMethod && (
                            <>
                              <span className="text-white/10 text-[8px]">•</span>
                              <span className="text-secondary text-[8px] font-bold uppercase tracking-wider">
                                {item.paymentMethod}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount & Action Triggers */}
                    <div className="flex items-center gap-3 ml-2 shrink-0">
                      <div className="text-right">
                        <span 
                          className="text-xs font-bold flex items-center justify-end gap-0.5"
                          style={{ color: (item.type === 'expense' || item.type === 'borrowed') ? '#FFFFFF' : '#39FF14' }}
                        >
                          {(item.type === 'expense' || item.type === 'borrowed') ? '-' : '+'}
                          {currencyService.format(item.amount, primaryCurrency)}
                        </span>
                        <span className="text-text-muted text-[8px] font-bold block uppercase tracking-wider">
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
                          onClick={() => onDeleteTransaction(item.id)}
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

    </div>
  );
};

export default TransactionLedger;
