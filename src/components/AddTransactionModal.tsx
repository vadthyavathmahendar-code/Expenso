import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTransactions } from '../context/TransactionContext';
import type { CurrencyCode } from '../services/currency';
import OcrScanner from './OcrScanner';
import { X, Check, Tag, FileText } from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = ['Food', 'Transport', 'Bills', 'Entertainment', 'Salary', 'Other'];
const CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'INR'];

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose }) => {
  const { addTransaction } = useTransactions();
  
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [note, setNote] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [currency, setCurrency] = useState<CurrencyCode>('INR');

  const [amountFocused, setAmountFocused] = useState(false);
  const [noteFocused, setNoteFocused] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      await addTransaction(parsedAmount, category, note || category, type, currency);
      // Reset form
      setAmount('');
      setCategory('Food');
      setNote('');
      setType('expense');
      setCurrency('USD');
      onClose();
    } catch (e) {
      console.error(e);
      alert('Failed to save transaction');
    }
  };

  const handleOcrSuccess = (data: {
    amount: number;
    category: string;
    note: string;
    currency: CurrencyCode;
  }) => {
    setAmount(data.amount.toString());
    setCategory(data.category);
    setNote(data.note);
    setCurrency(data.currency);
    setType('expense'); // Receipts are always expenses
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="glass-elevated w-full max-w-lg rounded-3xl p-6 shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-white text-lg font-bold">Log Transaction</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 flex items-center justify-center text-text-muted hover:text-white transition-colors duration-150 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* OCR Receipt Scanner Component */}
            <div className="mb-5">
              <OcrScanner onScanSuccess={handleOcrSuccess} />
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              
              {/* Toggle Type (Income / Expense) */}
              <div className="flex bg-black/30 p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className="flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer"
                  style={{
                    backgroundColor: type === 'expense' ? 'rgba(0, 245, 255, 0.15)' : 'transparent',
                    color: type === 'expense' ? '#00F5FF' : '#8E8E93'
                  }}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className="flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer"
                  style={{
                    backgroundColor: type === 'income' ? 'rgba(57, 255, 20, 0.15)' : 'transparent',
                    color: type === 'income' ? '#39FF14' : '#8E8E93'
                  }}
                >
                  Income
                </button>
              </div>

              {/* Amount & Currency Row */}
              <div>
                <label className="text-text-muted text-[10px] font-bold uppercase tracking-wider block mb-1.5">
                  Amount
                </label>
                <div className="flex gap-2">
                  
                  {/* Amount Input */}
                  <div 
                    className="flex-1 flex-row items-center bg-black/20 border rounded-xl px-4 py-2.5 flex"
                    style={{ 
                      borderColor: amountFocused 
                        ? (type === 'expense' ? '#00F5FF' : '#39FF14') 
                        : 'rgba(255,255,255,0.08)'
                    }}
                  >
                    <span className="text-text-muted text-sm mr-2 font-bold">{currency}</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="flex-1 bg-transparent text-white text-lg font-bold outline-none border-none"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      onFocus={() => setAmountFocused(true)}
                      onBlur={() => setAmountFocused(false)}
                      required
                    />
                  </div>

                  {/* Currency Selector */}
                  <div className="bg-black/20 border border-white/8 rounded-xl flex items-center p-1">
                    {CURRENCIES.map((cur) => (
                      <button
                        key={cur}
                        type="button"
                        onClick={() => setCurrency(cur)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all duration-150 ${
                          currency === cur 
                            ? 'bg-white/10 text-white border border-white/5' 
                            : 'text-text-muted hover:text-white'
                        }`}
                      >
                        {cur}
                      </button>
                    ))}
                  </div>

                </div>
              </div>

              {/* Category Selector */}
              <div>
                <label className="text-text-muted text-[10px] font-bold uppercase tracking-wider block mb-2">
                  Category Tag
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className="px-3 py-1.5 rounded-xl border flex items-center gap-1 text-[10px] font-bold transition-all duration-150 cursor-pointer"
                        style={{
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)',
                          borderColor: isSelected 
                            ? (type === 'expense' ? '#00F5FF' : '#39FF14') 
                            : 'rgba(255,255,255,0.08)',
                          color: isSelected ? '#FFFFFF' : '#8E8E93'
                        }}
                      >
                        <Tag size={10} style={{ color: isSelected ? (type === 'expense' ? '#00F5FF' : '#39FF14') : '#8E8E93' }} />
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Note Input */}
              <div>
                <label className="text-text-muted text-[10px] font-bold uppercase tracking-wider block mb-1.5">
                  Transaction Note
                </label>
                <div 
                  className="flex items-start bg-black/20 border rounded-xl px-4 py-2.5"
                  style={{ 
                    borderColor: noteFocused 
                      ? (type === 'expense' ? '#00F5FF' : '#39FF14') 
                      : 'rgba(255,255,255,0.08)'
                  }}
                >
                  <FileText className="text-text-muted mr-2.5 mt-0.5" size={16} />
                  <input
                    type="text"
                    placeholder="Merchant name, description..."
                    className="flex-1 bg-transparent text-white text-sm outline-none border-none"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onFocus={() => setNoteFocused(true)}
                    onBlur={() => setNoteFocused(false)}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="mt-2 py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm text-black cursor-pointer shadow-lg transition-all duration-200 hover:brightness-110 active:scale-[0.99]"
                style={{
                  background: type === 'expense' 
                    ? 'linear-gradient(135deg, #00F5FF 0%, #00C2FF 100%)' 
                    : 'linear-gradient(135deg, #39FF14 0%, #2EE610 100%)',
                  boxShadow: type === 'expense'
                    ? '0 10px 20px -3px rgba(0, 245, 255, 0.3)'
                    : '0 10px 20px -3px rgba(57, 255, 20, 0.3)'
                }}
              >
                <Check size={16} strokeWidth={2.5} />
                Compile Transaction
              </button>

            </form>
          </motion.div>

        </div>
      )}
    </AnimatePresence>
  );
};

export default AddTransactionModal;
