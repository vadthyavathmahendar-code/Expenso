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
    paymentMethod?: 'Cash' | 'Credit Card' | 'UPI' | 'Bank Transfer'
  ) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  refreshInsights: () => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [primaryCurrency, setPrimaryCurrency] = useState<CurrencyCode>('INR');
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
      monthlyIncome: 5000,
      monthlyLimit: 2000,
      savingsGoals: [
        { id: '1', name: 'Emergency Fund', target: 5000, current: 3750, targetDate: '2026-12-31', priority: 'High', color: '#39FF14' },
        { id: '2', name: 'Tesla Model S', target: 80000, current: 12000, targetDate: '2028-06-30', priority: 'Medium', color: '#00F5FF' },
        { id: '3', name: 'Crypto Bag', target: 1500, current: 900, targetDate: '2026-09-30', priority: 'Low', color: '#BD00FF' }
      ]
    };
  });

  // Save profile to localStorage when changed
  useEffect(() => {
    localStorage.setItem('expenso_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

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
  };

  // Subscribe to database changes
  useEffect(() => {
    setLoading(true);
    const unsubscribe = dbService.subscribeTransactions((updatedTxs) => {
      setTransactions(updatedTxs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Update AI insights on transaction changes
  useEffect(() => {
    if (transactions.length > 0) {
      refreshInsights();
    } else {
      setAiInsights(null);
    }
  }, [transactions]);

  const refreshInsights = async () => {
    if (transactions.length === 0) return;
    setAiLoading(true);
    try {
      const insights = await analyzeFinances(transactions);
      setAiInsights(insights);
    } catch (e) {
      console.error("Failed to fetch AI insights:", e);
    } finally {
      setAiLoading(false);
    }
  };

  // Compute converted transactions on the fly
  const convertedTransactions = useMemo(() => {
    return transactions.map((t) => ({
      ...t,
      amount: currencyService.convert(t.amount, t.currency || 'USD', primaryCurrency),
    }));
  }, [transactions, primaryCurrency]);

  const addTransaction = async (
    amount: number,
    category: string,
    note: string,
    type: 'income' | 'expense' | 'lent' | 'borrowed',
    currency: CurrencyCode = 'INR',
    paymentMethod?: 'Cash' | 'Credit Card' | 'UPI' | 'Bank Transfer'
  ) => {
    const newTx: Omit<Transaction, 'id'> = {
      amount,
      category,
      note,
      date: new Date().toISOString(),
      type,
      currency,
      paymentMethod,
    };

    const savedTx = await dbService.addTransaction(newTx);
    
    // For mock, manually trigger refresh (listener is local but helps ensure sync)
    if (dbService.getTransactionsSync) {
      setTransactions(dbService.getTransactionsSync());
    }

    return savedTx;
  };

  const deleteTransaction = async (id: string) => {
    await dbService.deleteTransaction(id);
    if (dbService.getTransactionsSync) {
      setTransactions(dbService.getTransactionsSync());
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
