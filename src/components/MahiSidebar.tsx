import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTransactions } from '../context/TransactionContext';
import { sendMessageToMahi, type ChatMessage } from '../services/ai';
import { Sparkles, Send, X, Bot, User, ArrowUp } from 'lucide-react';

interface MahiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Custom lightweight Markdown parser for Mahi's responses
const FormattedMessageText = ({ text }: { text: string }) => {
  const parts = text.split(/(\*\*.*?\*\*|\n)/g);
  
  return (
    <span className="text-white text-xs leading-relaxed font-medium">
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={index} className="font-bold text-primary">
              {part.slice(2, -2)}
            </strong>
          );
        } else if (part === '\n') {
          return <br key={index} />;
        }
        return part;
      })}
    </span>
  );
};

export const MahiSidebar: React.FC<MahiSidebarProps> = ({ isOpen, onClose }) => {
  const { transactions, addTransaction, userProfile, allocateSavings } = useTransactions();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: "Hey there! I'm **Mahi**, your AI financial assistant. I have scanned your transaction ledger. Ask me to log new expenses or query your spending history (e.g., *'Mahi, add an expense of $45 for Uber'* or *'how much did I spend?'*)!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', text: userMessage } as ChatMessage];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Send message to Gemini, passing local DB callbacks for tool-calling
      const reply = await sendMessageToMahi(userMessage, messages, {
        onAddTransaction: async (amount, category, note, type, currency) => {
          await addTransaction(amount, category, note, type, currency || 'USD');
          return { success: true };
        },
        onGetTransactions: async () => {
          return transactions;
        },
        onGetSavingsGoals: () => {
          return userProfile.savingsGoals;
        },
        onAllocateSavings: (goalId, amount) => {
          allocateSavings(goalId, amount);
        }
      });
      
      setMessages((prev) => [...prev, { role: 'model', text: reply }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: "Sorry, my compiler ran into an exception. Let's try that again!" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop dim overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-30 lg:hidden"
          />

          {/* Sidebar Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-[380px] sm:w-[400px] z-40 bg-surface/90 backdrop-blur-xl border-l border-white/8 flex flex-col shadow-2xl"
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-white/8 flex justify-between items-center bg-black/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent to-secondary flex items-center justify-center shadow-lg shadow-accent/20">
                  <Sparkles className="text-black" size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-white text-sm font-bold">Mahi</h3>
                  <span className="text-primary text-[9px] font-bold uppercase tracking-wider block">Financial Copilot</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/8 text-text-muted hover:text-white transition-all duration-150 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((item, index) => {
                const isUser = item.role === 'user';
                return (
                  <div
                    key={index}
                    className={`flex flex-col max-w-[85%] ${
                      isUser ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    {/* Role Label */}
                    <div className="flex items-center gap-1.5 mb-1 opacity-50 px-1">
                      {!isUser && <Bot size={10} className="text-accent" />}
                      <span className="text-text-muted text-[8px] font-bold uppercase tracking-wider">
                        {isUser ? 'You' : 'Mahi'}
                      </span>
                    </div>

                    {/* Chat Bubble */}
                    <div
                      className={`rounded-2xl px-3.5 py-3 border text-left ${
                        isUser
                          ? 'bg-black/30 border-secondary rounded-tr-none'
                          : 'bg-white/3 border-white/8 rounded-tl-none'
                      }`}
                      style={{
                        boxShadow: isUser ? '0 4px 20px rgba(0, 245, 255, 0.03)' : 'none',
                      }}
                    >
                      <FormattedMessageText text={item.text} />
                    </div>
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {loading && (
                <div className="flex flex-col max-w-[80%] mr-auto items-start">
                  <div className="flex items-center gap-1.5 mb-1 opacity-50 px-1">
                    <Bot size={10} className="text-accent" />
                    <span className="text-text-muted text-[8px] font-bold uppercase tracking-wider">Mahi</span>
                  </div>
                  <div className="rounded-2xl px-4 py-3 bg-white/3 border border-white/8 rounded-tl-none flex items-center gap-1 h-[34px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} className="p-4 border-t border-white/8 bg-black/10">
              <div 
                className="flex items-center bg-black/25 border rounded-2xl p-1.5 transition-all duration-200"
                style={{
                  borderColor: inputFocused ? '#00F5FF' : 'rgba(255, 255, 255, 0.08)',
                  boxShadow: inputFocused ? '0 0 15px rgba(0, 245, 255, 0.05)' : 'none',
                }}
              >
                <input
                  type="text"
                  placeholder="Ask Mahi to log or analyze..."
                  className="flex-1 bg-transparent text-white text-xs px-3 outline-none border-none py-2"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  disabled={loading}
                />
                
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    input.trim() && !loading
                      ? 'bg-gradient-to-tr from-secondary to-accent text-black shadow-md'
                      : 'bg-white/5 text-text-muted'
                  }`}
                >
                  <ArrowUp size={16} strokeWidth={2.5} />
                </button>
              </div>
            </form>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MahiSidebar;
