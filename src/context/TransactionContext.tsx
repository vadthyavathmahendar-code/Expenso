import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { dbService, type Transaction } from '../services/dbService';
import { analyzeFinances, type AIInsights } from '../services/ai';
import { currencyService, type CurrencyCode } from '../services/currency';

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  targetDate: string;
  priority: 'High' | 'Medium' | 'Low';
  color: string;
}

export interface UserProfile {
  monthlyIncome: number;
  monthlyLimit: number;
  savingsGoals: SavingsGoal[];
  fullName?: string;
  jobTitle?: string;
  phoneNumber?: string;
  email?: string;
  avatar?: string;
  categoryLimits?: Record<string, number>;
}

export interface BankAccount {
  id: string;
  accountName: string;
  balance: number;
  accountType: 'Savings' | 'Current' | 'Wallet';
  lowBalanceAlertLimit: number;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface TransactionContextType {
  transactions: Transaction[];
  convertedTransactions: Transaction[];
  loading: boolean;
  aiInsights: AIInsights | null;
  aiLoading: boolean;
  primaryCurrency: CurrencyCode;
  setPrimaryCurrency: (currency: CurrencyCode) => void;
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  allocateSavings: (goalId: string, amount: number) => void;
  addTransaction: (
    amount: number,
    category: string,
    note: string,
    type: 'income' | 'expense' | 'lent' | 'borrowed',
    currency?: CurrencyCode,
    paymentMethod?: 'Cash' | 'Credit Card' | 'UPI' | 'Bank Transfer',
    bankAccountId?: string
  ) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  refreshInsights: () => Promise<void>;
  
  // Bank Account CRUD
  accounts: BankAccount[];
  addBankAccount: (account: Omit<BankAccount, 'id'>) => void;
  updateBankAccount: (id: string, updates: Partial<BankAccount>) => void;
  deleteBankAccount: (id: string) => void;

  // Savings Goal CRUD additions
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;

  // Zero-Based Budget Rollover
  triggerMonthlyRollover: () => void;

  // Toast System
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info', action?: { label: string; onClick: () => void }) => void;
  removeToast: (id: string) => void;

  // Global Mahi AI Trigger State
  mahiOpen: boolean;
  setMahiOpen: (open: boolean) => void;
  mahiTriggerText: string;
  setMahiTriggerText: (text: string) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [primaryCurrency, setPrimaryCurrency] = useState<CurrencyCode>('INR');
  
  // Global Mahi AI trigger states
  const [mahiOpen, setMahiOpen] = useState(false);
  const [mahiTriggerText, setMahiTriggerText] = useState('');

  // Toast Notification state
  const [toasts, setToasts] = useState<Toast[]>([]);

  // User Profile starts as empty/baseline
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const cached = localStorage.getItem('expenso_user_profile');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Failed to parse cached user profile:', e);
      }
    }
    return {
      monthlyIncome: 0,
      monthlyLimit: 0,
      fullName: 'Vadthya Mahi',
      jobTitle: 'Senior Software Developer',
      phoneNumber: '+1 (555) 234-5678',
      email: 'mahi@expenso.dev',
      avatar: '💻',
      savingsGoals: [], // Zero-data baseline
      categoryLimits: {}
    };
  });

  // Bank Accounts state (Zero-data baseline)
  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    const cached = localStorage.getItem('expenso_bank_accounts');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Failed to parse cached bank accounts:', e);
      }
    }
    return []; // Starts as completely empty
  });

  // Save profile to localStorage when changed
  useEffect(() => {
    localStorage.setItem('expenso_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  // Save accounts to localStorage when changed
  useEffect(() => {
    localStorage.setItem('expenso_bank_accounts', JSON.stringify(accounts));
  }, [accounts]);

  // Subscribe to Live Transactions
  useEffect(() => {
    setLoading(true);
    const unsubscribe = dbService.subscribeTransactions((list) => {
      setTransactions(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch AI Insights when transactions change
  useEffect(() => {
    if (transactions.length === 0) {
      setAiInsights(null);
      return;
    }
    
    const triggerAnalysis = async () => {
      setAiLoading(true);
      try {
        const insights = await analyzeFinances(transactions);
        setAiInsights(insights);
      } catch (e) {
        console.error(e);
      } finally {
        setAiLoading(false);
      }
    };

    triggerAnalysis();
  }, [transactions]);

  // Convert Transactions dynamically based on selected currency
  const convertedTransactions = useMemo(() => {
    return transactions.map((tx) => {
      if (tx.currency === primaryCurrency) return tx;
      const amountInBase = currencyService.convert(tx.amount, tx.currency, primaryCurrency);
      return {
        ...tx,
        amount: amountInBase,
        currency: primaryCurrency,
      };
    });
  }, [transactions, primaryCurrency]);

  // Toast System Helpers
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success', action?: { label: string; onClick: () => void }) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, message, type, action };
    setToasts((prev) => [...prev, newToast]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const updateUserProfile = (profileUpdate: Partial<UserProfile>) => {
    setUserProfile((prev) => ({
      ...prev,
      ...profileUpdate,
    }));
  };

  const allocateSavings = (goalId: string, amount: number) => {
    setUserProfile((prev) => {
      const updatedGoals = prev.savingsGoals.map((goal) => {
        if (goal.id === goalId) {
          return {
            ...goal,
            current: Math.max(0, Math.min(goal.target, goal.current + amount)),
          };
        }
        return goal;
      });
      return {
        ...prev,
        savingsGoals: updatedGoals,
      };
    });
    showToast(`Allocated ${currencyService.format(amount, primaryCurrency)} to Savings Enclave!`, 'success');
  };

  // Helper to adjust bank balance
  const updateBankAccountBalance = (accountId: string, amount: number, type: 'income' | 'expense' | 'lent' | 'borrowed') => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id === accountId) {
        let newBalance = acc.balance;
        if (type === 'income' || type === 'borrowed') {
          newBalance += amount;
        } else if (type === 'expense' || type === 'lent') {
          newBalance -= amount;
        }
        return { ...acc, balance: newBalance };
      }
      return acc;
    }));
  };

  const addTransaction = async (
    amount: number,
    category: string,
    note: string,
    type: 'income' | 'expense' | 'lent' | 'borrowed',
    currency?: CurrencyCode,
    paymentMethod?: 'Cash' | 'Credit Card' | 'UPI' | 'Bank Transfer',
    bankAccountId?: string
  ) => {
    const tx = await dbService.addTransaction({
      amount,
      category,
      note,
      date: new Date().toISOString(),
      type,
      currency: currency || primaryCurrency,
      paymentMethod,
      bankAccountId
    });

    setTransactions((prev) => [tx, ...prev]);

    // Update linked bank account balance
    if (bankAccountId) {
      updateBankAccountBalance(bankAccountId, amount, type);
    }

    showToast(`Transaction added successfully!`, 'success', {
      label: 'Undo',
      onClick: () => {
        deleteTransaction(tx.id);
        showToast('Transaction undone!', 'info');
      }
    });

    return tx;
  };

  const deleteTransaction = async (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;

    // Temporary local state backup
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    if (tx.bankAccountId) {
      const reverseType = tx.type === 'income' ? 'expense' : 'income';
      updateBankAccountBalance(tx.bankAccountId, tx.amount, reverseType);
    }

    showToast(`Transaction removed.`, 'success', {
      label: 'Undo',
      onClick: () => {
        // Restore transaction
        dbService.addTransaction(tx).then((restoredTx) => {
          setTransactions((prev) => [restoredTx, ...prev]);
          if (tx.bankAccountId) {
            updateBankAccountBalance(tx.bankAccountId, tx.amount, tx.type);
          }
          showToast('Transaction restored!', 'success');
        });
      }
    });

    // Actually delete from DB after a 5s delay if not undone
    setTimeout(async () => {
      const stillDeleted = !transactions.some(t => t.id === id);
      if (stillDeleted) {
        await dbService.deleteTransaction(id);
      }
    }, 5100);
  };

  const addBankAccount = (account: Omit<BankAccount, 'id'>) => {
    const newAccount: BankAccount = {
      ...account,
      id: Math.random().toString(36).substring(2, 9)
    };
    setAccounts(prev => [...prev, newAccount]);
    showToast(`Bank account "${newAccount.accountName}" connected!`, 'success');
  };

  const updateBankAccount = (id: string, updates: Partial<BankAccount>) => {
    setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, ...updates } : acc));
    showToast('Bank account updated.', 'success');
  };

  const deleteBankAccount = (id: string) => {
    const accountToDelete = accounts.find(a => a.id === id);
    if (!accountToDelete) return;

    setAccounts(prev => prev.filter(acc => acc.id !== id));
    showToast(`Account "${accountToDelete.accountName}" removed.`, 'success', {
      label: 'Undo',
      onClick: () => {
        setAccounts(prev => [...prev, accountToDelete]);
        showToast('Account restored!', 'success');
      }
    });
  };

  const addSavingsGoal = (goal: Omit<SavingsGoal, 'id'>) => {
    const newGoal: SavingsGoal = {
      ...goal,
      id: Math.random().toString(36).substring(2, 9)
    };
    setUserProfile((prev) => ({
      ...prev,
      savingsGoals: [...prev.savingsGoals, newGoal]
    }));
    showToast(`Savings goal "${newGoal.name}" created!`, 'success');
  };

  const deleteSavingsGoal = (id: string) => {
    const goalToDelete = userProfile.savingsGoals.find(g => g.id === id);
    if (!goalToDelete) return;

    setUserProfile((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.filter(g => g.id !== id)
    }));

    showToast(`Goal "${goalToDelete.name}" deleted.`, 'success', {
      label: 'Undo',
      onClick: () => {
        setUserProfile((prev) => ({
          ...prev,
          savingsGoals: [...prev.savingsGoals, goalToDelete]
        }));
        showToast('Goal restored!', 'success');
      }
    });
  };

  const updateSavingsGoal = (id: string, updates: Partial<SavingsGoal>) => {
    setUserProfile((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.map(g => g.id === id ? { ...g, ...updates } : g)
    }));
    showToast("Savings goal updated!", 'success');
  };

  const triggerMonthlyRollover = () => {
    if (userProfile.savingsGoals.length === 0) {
      showToast("Please create at least one Savings Enclave to receive the rollover surplus!", 'error');
      return;
    }

    // Define category limit percentages of the global monthly limit
    const categoryAllocation: Record<string, number> = {
      'Food': 0.30,
      'Transport': 0.20,
      'Bills': 0.30,
      'Entertainment': 0.15,
      'Other': 0.05
    };

    // Calculate spending per category for the current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const categorySpending: Record<string, number> = {};
    convertedTransactions.forEach(t => {
      if (t.type !== 'expense') return;
      const d = new Date(t.date);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
      }
    });

    let totalSurplus = 0;

    // Calculate surplus for each category
    Object.entries(categoryAllocation).forEach(([cat, pct]) => {
      const limit = userProfile.monthlyLimit * pct;
      const spent = categorySpending[cat] || 0;
      const surplus = limit - spent;
      if (surplus > 0) {
        totalSurplus += surplus;
      }
    });

    if (totalSurplus <= 0) {
      showToast("No unspent surplus detected this month to rollover!", 'error');
      return;
    }

    // Allocate totalSurplus to the primary (first) Savings Enclave
    const primaryGoal = userProfile.savingsGoals[0];
    allocateSavings(primaryGoal.id, totalSurplus);

    // Save to rollover history
    const historyItem = {
      id: Math.random().toString(36).substring(2, 9),
      month: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
      amount: totalSurplus,
      targetGoal: primaryGoal.name,
      date: now.toISOString()
    };
    const existingHistory = JSON.parse(localStorage.getItem('expenso_rollover_history') || '[]');
    localStorage.setItem('expenso_rollover_history', JSON.stringify([historyItem, ...existingHistory]));

    showToast(`Rollover Executed! ${currencyService.format(totalSurplus, primaryCurrency)} swept to "${primaryGoal.name}"! 🚀`, 'success');
  };

  const refreshInsights = async () => {
    setAiLoading(true);
    try {
      const insights = await analyzeFinances(transactions);
      setAiInsights(insights);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        convertedTransactions,
        loading,
        aiInsights,
        aiLoading,
        primaryCurrency,
        setPrimaryCurrency,
        userProfile,
        updateUserProfile,
        allocateSavings,
        addTransaction,
        deleteTransaction,
        refreshInsights,
        accounts,
        addBankAccount,
        updateBankAccount,
        deleteBankAccount,
        addSavingsGoal,
        updateSavingsGoal,
        deleteSavingsGoal,
        triggerMonthlyRollover,
        toasts,
        showToast,
        removeToast,
        mahiOpen,
        setMahiOpen,
        mahiTriggerText,
        setMahiTriggerText
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};
