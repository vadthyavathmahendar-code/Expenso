import { supabase, isSupabaseConfigured } from './supabase';
import { auth as firebaseAuth, db as firebaseDb, isFirebaseConfigured } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore';

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  note: string;
  date: string;
  type: 'income' | 'expense' | 'lent' | 'borrowed';
  currency: 'USD' | 'EUR' | 'INR';
  paymentMethod?: 'Cash' | 'Credit Card' | 'UPI' | 'Bank Transfer';
  bankAccountId?: string;
}

// Preloaded mock transactions for immediate presentation (wiped for zero-data baseline)
const DEFAULT_MOCK_TRANSACTIONS: Transaction[] = [];

const loadMockTransactions = (): Transaction[] => {
  const stored = localStorage.getItem('expenso_transactions_v2');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored mock transactions:', e);
    }
  }
  localStorage.setItem('expenso_transactions_v2', JSON.stringify(DEFAULT_MOCK_TRANSACTIONS));
  return DEFAULT_MOCK_TRANSACTIONS;
};

let mockTransactions: Transaction[] = loadMockTransactions();

let activeProvider: 'supabase' | 'firebase' | 'mock' = 'mock';

if (isSupabaseConfigured()) {
  activeProvider = 'supabase';
} else if (isFirebaseConfigured()) {
  activeProvider = 'firebase';
}

export const getActiveProvider = () => activeProvider;

// --- AUTHENTICATION CONTROLLER ---
export const dbAuth = {
  async signUp(email: string, password: string) {
    if (activeProvider === 'supabase') {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return data.user;
    } else if (activeProvider === 'firebase') {
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      return userCredential.user;
    } else {
      // Mock signup: Save user to local storage and return it
      const user = { id: 'mock-user-id', email };
      localStorage.setItem('secretpay_mock_user', JSON.stringify(user));
      return user;
    }
  },

  async signIn(email: string, password: string) {
    if (activeProvider === 'supabase') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data.user;
    } else if (activeProvider === 'firebase') {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      return userCredential.user;
    } else {
      // Mock signin
      const user = { id: 'mock-user-id', email };
      localStorage.setItem('secretpay_mock_user', JSON.stringify(user));
      return user;
    }
  },

  async signOut() {
    if (activeProvider === 'supabase') {
      await supabase.auth.signOut();
    } else if (activeProvider === 'firebase') {
      await firebaseAuth.signOut();
    } else {
      localStorage.removeItem('secretpay_mock_user');
    }
  },

  onAuthStateChange(callback: (user: any) => void) {
    if (activeProvider === 'supabase') {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
        callback(session?.user || null);
      });
      return () => subscription.unsubscribe();
    } else if (activeProvider === 'firebase') {
      return firebaseAuth.onAuthStateChanged((user: any) => {
        callback(user ? { id: user.uid, email: user.email } : null);
      });
    } else {
      // Mock Auth listener using localStorage
      const checkUser = () => {
        const storedUser = localStorage.getItem('secretpay_mock_user');
        callback(storedUser ? JSON.parse(storedUser) : null);
      };
      
      checkUser();
      window.addEventListener('storage', checkUser);
      return () => window.removeEventListener('storage', checkUser);
    }
  }
};

// --- DATABASE CONTROLLER ---
export const dbService = {
  async getTransactions(): Promise<Transaction[]> {
    if (activeProvider === 'supabase') {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      return data as Transaction[];
    } else if (activeProvider === 'firebase') {
      try {
        const q = query(collection(firebaseDb, 'transactions'), orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        const list: Transaction[] = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Transaction);
        });
        return list;
      } catch (error) {
        console.warn('Firebase Firestore read failed (likely due to Security Rules). Falling back to local storage:', error);
        return [...mockTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    } else {
      return [...mockTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  },

  async addTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    // Sanitize transaction: Firestore does not support 'undefined' values
    const sanitizedTx = { ...transaction };
    Object.keys(sanitizedTx).forEach((key) => {
      if (sanitizedTx[key as keyof typeof sanitizedTx] === undefined) {
        delete sanitizedTx[key as keyof typeof sanitizedTx];
      }
    });

    const newTx: Transaction = {
      ...sanitizedTx,
      id: Math.random().toString(36).substring(2, 9),
    } as Transaction;

    if (activeProvider === 'supabase') {
      const { data, error } = await supabase
        .from('transactions')
        .insert([sanitizedTx])
        .select()
        .single();
      if (error) throw error;
      return data as Transaction;
    } else if (activeProvider === 'firebase') {
      try {
        const docRef = await addDoc(collection(firebaseDb, 'transactions'), sanitizedTx);
        return { id: docRef.id, ...sanitizedTx } as Transaction;
      } catch (error) {
        console.warn('Firebase Firestore write failed (likely due to Security Rules). Falling back to local storage:', error);
        mockTransactions.unshift(newTx);
        localStorage.setItem('expenso_transactions_v2', JSON.stringify(mockTransactions));
        window.dispatchEvent(new Event('storage'));
        return newTx;
      }
    } else {
      mockTransactions.unshift(newTx);
      localStorage.setItem('expenso_transactions_v2', JSON.stringify(mockTransactions));
      window.dispatchEvent(new Event('storage'));
      return newTx;
    }
  },

  async deleteTransaction(id: string): Promise<void> {
    if (activeProvider === 'supabase') {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } else if (activeProvider === 'firebase') {
      try {
        const { doc, deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(firebaseDb, 'transactions', id));
      } catch (error) {
        console.warn('Firebase Firestore delete failed (likely due to Security Rules). Falling back to local storage:', error);
        mockTransactions = mockTransactions.filter(t => t.id !== id);
        localStorage.setItem('expenso_transactions_v2', JSON.stringify(mockTransactions));
        window.dispatchEvent(new Event('storage'));
      }
    } else {
      mockTransactions = mockTransactions.filter(t => t.id !== id);
      localStorage.setItem('expenso_transactions_v2', JSON.stringify(mockTransactions));
      window.dispatchEvent(new Event('storage'));
    }
  },

  subscribeTransactions(callback: (transactions: Transaction[]) => void) {
    if (activeProvider === 'supabase') {
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transactions' },
          async () => {
            const txs = await this.getTransactions();
            callback(txs);
          }
        )
        .subscribe();
      
      this.getTransactions().then(callback);
      return () => {
        supabase.removeChannel(channel);
      };
    } else if (activeProvider === 'firebase') {
      const q = query(collection(firebaseDb, 'transactions'), orderBy('date', 'desc'));
      return onSnapshot(
        q, 
        (querySnapshot) => {
          const list: Transaction[] = [];
          querySnapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() } as Transaction);
          });
          callback(list);
        },
        (error) => {
          console.warn('Firebase Firestore subscription failed (likely due to Security Rules). Falling back to local storage:', error);
          callback(this.getTransactionsSync());
        }
      );
    } else {
      // Mock Subscription
      const handleUpdate = () => {
        callback(this.getTransactionsSync());
      };
      
      handleUpdate();
      window.addEventListener('storage', handleUpdate);
      return () => window.removeEventListener('storage', handleUpdate);
    }
  },

  getTransactionsSync(): Transaction[] {
    return [...mockTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
};
