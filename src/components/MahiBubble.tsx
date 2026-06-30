import React, { useState, useRef, useEffect } from 'react';
import { 
  motion, 
  AnimatePresence, 
  useDragControls 
} from 'framer-motion';
import { 
  MessageSquare, 
  X, 
  Sparkles, 
  Send, 
  Bot, 
  GripHorizontal,
  Download,
  Trash2,
  Copy,
  Check,
  Paperclip,
  RefreshCw
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { sendMessageToMahi, type ChatMessage } from '../services/ai';
import { ConfirmationModal } from './ConfirmationModal';

// Custom lightweight Markdown parser for Mahi's responses, supporting tables, bold text, and confirmation actions
const FormattedMessageText = ({ 
  text,
  onAction 
}: { 
  text: string;
  onAction?: (actionType: string, payload: any) => void;
}) => {
  const lines = text.split('\n');
  const renderedElements: React.ReactNode[] = [];
  
  let inTable = false;
  let tableRows: string[][] = [];
  
  const parseInlineStyles = (txt: string) => {
    const parts = txt.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-bold text-primary">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Intercept CONFIRM_RECEIPT tag
    if (line.startsWith('[CONFIRM_RECEIPT:') && line.endsWith(']')) {
      const match = line.match(/\[CONFIRM_RECEIPT:([0-9.]+):([a-zA-Z0-9\s]+):([^:]*):?([^\]]*)\]/i);
      if (match) {
        const amount = parseFloat(match[1]);
        const category = match[2];
        const note = match[3];
        const merchant = match[4];
        
        renderedElements.push(
          <div key={`confirm-btn-${i}`} className="mt-3 bg-white/3 border border-white/8 p-3 rounded-2xl flex flex-col gap-2">
            <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider block font-sans">Telemetric Logging Confirmation</span>
            <button
              type="button"
              onClick={() => onAction?.('CONFIRM_RECEIPT', { amount, category, note, merchant })}
              className="py-2 rounded-xl bg-gradient-to-tr from-primary to-secondary text-black font-bold text-[10px] uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-98 transition-all duration-150 cursor-pointer text-center font-sans"
            >
              Confirm & Log Entry
            </button>
          </div>
        );
        continue;
      }
    }

    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      tableRows.push(cells);
    } else {
      if (inTable && tableRows.length >= 2) {
        const hasHeaders = tableRows.length > 0;
        renderedElements.push(
          <div key={`table-${i}`} className="my-3 overflow-x-auto border border-white/8 rounded-xl bg-black/35">
            <table className="w-full text-left border-collapse text-[10px]">
              {hasHeaders && (
                <thead>
                  <tr className="border-b border-white/10 bg-white/3">
                    {tableRows[0].map((cell, idx) => (
                      <th key={idx} className="p-2 font-black text-primary uppercase tracking-wider font-sans">{parseInlineStyles(cell)}</th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {tableRows.slice(2).map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-white/5 last:border-none hover:bg-white/2">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-2 font-medium text-white font-sans">{parseInlineStyles(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        inTable = false;
      }
      
      if (line === '') {
        // Add vertical spacing
        renderedElements.push(<div key={`br-${i}`} className="h-2" />);
      } else {
        renderedElements.push(
          <div key={`line-${i}`} className="mb-1 font-sans">
            {parseInlineStyles(lines[i])}
          </div>
        );
      }
    }
  }

  if (inTable && tableRows.length >= 2) {
    renderedElements.push(
      <div key="table-end" className="my-3 overflow-x-auto border border-white/8 rounded-xl bg-black/35">
        <table className="w-full text-left border-collapse text-[10px]">
          <thead>
            <tr className="border-b border-white/10 bg-white/3">
              {tableRows[0].map((cell, idx) => (
                <th key={idx} className="p-2 font-black text-primary uppercase tracking-wider font-sans">{parseInlineStyles(cell)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.slice(2).map((row, rIdx) => (
              <tr key={rIdx} className="border-b border-white/5 last:border-none hover:bg-white/2">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="p-2 font-medium text-white font-sans">{parseInlineStyles(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="text-white text-[11px] leading-relaxed font-medium">
      {renderedElements}
    </div>
  );
};

interface MahiBubbleProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const MahiBubble: React.FC<MahiBubbleProps> = ({ isOpen, setIsOpen }) => {
  const { 
    transactions, 
    addTransaction, 
    userProfile, 
    updateUserProfile, 
    allocateSavings, 
    primaryCurrency, 
    accounts,
    mahiTriggerText,
    setMahiTriggerText
  } = useTransactions();

  const [persona, setPersona] = useState<'friend' | 'intelligent' | 'roast' | 'hype'>(() => {
    return (localStorage.getItem('expenso_mahi_persona') as 'friend' | 'intelligent' | 'roast' | 'hype') || 'intelligent';
  });
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: "Hey there! I'm **Mahi**, your AI financial assistant and universal developer co-pilot. I have scanned your transaction ledger. Ask me anything—whether it's logging expenses, configuring budget limits, calculating savings roadmaps, or general questions! 🚀",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [grillStep, setGrillStep] = useState(0);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragControls = useDragControls();

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages, loading]);

  // Listen to external Mahi AI triggers (e.g., Explain My Spending button)
  useEffect(() => {
    if (mahiTriggerText) {
      setIsOpen(true);
      handleSuggestedQuestion(mahiTriggerText);
      setMahiTriggerText('');
    }
  }, [mahiTriggerText]);

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearConversation = () => {
    setGrillStep(0);
    setMessages([
      {
        role: 'model',
        text: "Hey there! I'm **Mahi**, your AI financial assistant and universal developer co-pilot. I have scanned your transaction ledger. Ask me anything—whether it's logging expenses, configuring budget limits, calculating savings roadmaps, or general questions! 🚀",
      }
    ]);
  };

  const handleDownloadReport = () => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netSavings = totalIncome - totalExpense;
    const currencySymbol = primaryCurrency === 'INR' ? '₹' : primaryCurrency === 'EUR' ? '€' : '$';

    // Categories breakdown
    const categories: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(e => {
      categories[e.category] = (categories[e.category] || 0) + e.amount;
    });
    let categoryListText = '';
    Object.entries(categories).forEach(([cat, amt]) => {
      categoryListText += `  - ${cat}: ${currencySymbol}${amt.toFixed(2)}\n`;
    });

    // Goals breakdown
    let goalsText = '';
    userProfile.savingsGoals.forEach(g => {
      goalsText += `  - ${g.name}: ${currencySymbol}${g.current.toFixed(2)} / ${currencySymbol}${g.target.toFixed(2)} (${Math.round((g.current / g.target) * 100)}% complete)\n`;
    });

    // Accounts breakdown
    let accountsText = '';
    accounts.forEach(a => {
      accountsText += `  - ${a.accountName} (${a.accountType}): ${currencySymbol}${a.balance.toFixed(2)} (Alert limit: ${currencySymbol}${a.lowBalanceAlertLimit})\n`;
    });

    const ratio = totalIncome > 0 ? totalExpense / totalIncome : 0;
    const healthScore = ratio === 0 ? 100 : Math.max(0, Math.min(100, Math.round((1 - ratio) * 100)));

    const reportText = `=========================================
expenso - PERSONAL FINANCIAL REPORT
Generated on: ${new Date().toLocaleString()}
=========================================

1. LIQUIDITY & TELEMETRY SUMMARY
  - Total Income Logged: ${currencySymbol}${totalIncome.toFixed(2)}
  - Total Expenses Logged: ${currencySymbol}${totalExpense.toFixed(2)}
  - Net Savings Surplus: ${currencySymbol}${netSavings.toFixed(2)}
  - Financial Health Score: ${healthScore}/100

2. CATEGORY OUTFLOWS BREAKDOWN
${categoryListText || '  - No expenses logged yet.\n'}
3. CONNECTED BANK NODES & WALLETS
${accountsText || '  - No bank accounts connected.\n'}
4. SAVINGS ENCLAVES PROGRESS
${goalsText || '  - No active savings goals.\n'}
=========================================
Thank you for using expenso. Keep optimizing!
=========================================`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expenso_financial_report_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAction = async (actionType: string, payload: any) => {
    if (actionType === 'CONFIRM_RECEIPT') {
      const { amount, category, note } = payload;
      try {
        // Link to first bank account if available
        const linkAccount = accounts.length > 0 ? accounts[0].id : undefined;
        await addTransaction(amount, category, note, 'expense', primaryCurrency, 'UPI', linkAccount);
        
        setMessages(prev => [
          ...prev,
          { role: 'model', text: `✅ **Transaction Logged Successfully!**\n\nI have added **${primaryCurrency === 'INR' ? '₹' : '$'}${amount.toFixed(2)}** for **"${note}"** to your **${category}** ledger.` }
        ]);
      } catch (err) {
        console.error(err);
        alert("Failed to log transaction.");
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      setLoading(true);
      setMessages(prev => [...prev, { role: 'user', text: "📸 [Uploaded Receipt Image]" }]);

      try {
        const { analyzeReceipt } = await import('../services/ai');
        const result = await analyzeReceipt(base64String);
        if (result) {
          const currencySymbol = primaryCurrency === 'INR' ? '₹' : primaryCurrency === 'EUR' ? '€' : '$';
          const confirmTag = `[CONFIRM_RECEIPT:${result.amount}:${result.category}:${result.note}:${result.merchant || ''}]`;
          
          setMessages(prev => [
            ...prev,
            {
              role: 'model',
              text: `📸 **Receipt Parsed Successfully!**\n\n` +
                    `* **Merchant**: **${result.merchant || 'Unknown'}**\n` +
                    `* **Amount**: **${currencySymbol}${result.amount.toFixed(2)}**\n` +
                    `* **Category**: **${result.category}**\n` +
                    `* **Note**: **${result.note}**\n\n` +
                    `Would you like me to log this transaction to your ledger?\n\n` +
                    `${confirmTag}`
            }
          ]);
        } else {
          setMessages(prev => [...prev, { role: 'model', text: "Could not parse receipt details. Make sure the image is clear and contains readable text!" }]);
        }
      } catch (err) {
        console.error(err);
        setMessages(prev => [...prev, { role: 'model', text: "Failed to process receipt image due to an internal error." }]);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSuggestedQuestion = async (qText: string) => {
    if (loading) return;
    const newMessages = [...messages, { role: 'user', text: qText } as ChatMessage];
    setMessages(newMessages);
    setLoading(true);
    const startTime = performance.now();

    try {
      const reply = await sendMessageToMahi(qText, messages, primaryCurrency, persona, {
        monthlyIncome: userProfile.monthlyIncome,
        monthlyLimit: userProfile.monthlyLimit,
        savingsGoals: userProfile.savingsGoals,
        accounts: accounts,
        categoryLimits: userProfile.categoryLimits
      }, {
        onAddTransaction: async (amount, category, note, type, currency) => {
          await addTransaction(amount, category, note, type, currency || primaryCurrency);
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
        },
        onUpdateUserProfile: (profile) => {
          updateUserProfile(profile);
        }
      });
      const endTime = performance.now();
      const genTime = ((endTime - startTime) / 1000).toFixed(1);
      
      setMessages((prev) => [...prev, { role: 'model', text: reply, meta: { genTime } }]);
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

  const handleRegenerateResponse = async () => {
    if (messages.length < 2 || loading) return;
    
    // Find the last user message
    let lastUserMsg = '';
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMsg = messages[i].text;
        break;
      }
    }
    if (!lastUserMsg) return;

    // Remove the last model response
    setMessages(prev => {
      if (prev[prev.length - 1].role === 'model') {
        return prev.slice(0, -1);
      }
      return prev;
    });

    setLoading(true);
    const startTime = performance.now();
    try {
      const reply = await sendMessageToMahi(lastUserMsg, messages.slice(0, -2), primaryCurrency, persona, {
        monthlyIncome: userProfile.monthlyIncome,
        monthlyLimit: userProfile.monthlyLimit,
        savingsGoals: userProfile.savingsGoals,
        accounts: accounts,
        categoryLimits: userProfile.categoryLimits
      }, {
        onAddTransaction: async (amount, category, note, type, currency) => {
          await addTransaction(amount, category, note, type, currency || primaryCurrency);
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
        },
        onUpdateUserProfile: (profile) => {
          updateUserProfile(profile);
        }
      });
      const endTime = performance.now();
      const genTime = ((endTime - startTime) / 1000).toFixed(1);
      setMessages(prev => [...prev, { role: 'model', text: reply, meta: { genTime } }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, my compiler encountered an exception. Let's try again!" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    const currencySymbol = primaryCurrency === 'INR' ? '₹' : primaryCurrency === 'EUR' ? '€' : '$';

    // --- Grill Me Interview Mode ---
    if (userMessage === '/grill-me') {
      setGrillStep(1);
      setMessages(prev => [
        ...prev,
        { role: 'user', text: userMessage },
        { role: 'model', text: "🔥 **Mahi Financial Grill Mode Activated!**\n\nI'm going to audit your financial setup. Answer honestly.\n\n**Question 1**: What is your absolute monthly fixed overhead cost? (Rent, utilities, insurance, etc. in your active currency)" }
      ]);
      return;
    }

    if (grillStep > 0) {
      const parsedNum = parseFloat(userMessage.replace(/[^0-9.]/g, '')) || 0;
      
      if (grillStep === 1) {
        localStorage.setItem('expenso_grill_overhead', parsedNum.toString());
        setGrillStep(2);
        setMessages(prev => [
          ...prev,
          { role: 'user', text: userMessage },
          { role: 'model', text: `Got it. Fixed overheads of **${currencySymbol}${parsedNum.toLocaleString()}** locked in. 🔒\n\n**Question 2**: How much do you want to save every single month? (Enter a percentage like '20%' or a flat amount like '5000')` }
        ]);
        return;
      }
      
      if (grillStep === 2) {
        const isPercent = userMessage.includes('%');
        if (isPercent) {
          localStorage.setItem('expenso_grill_savings_pct', parsedNum.toString());
          localStorage.removeItem('expenso_grill_savings_flat');
        } else {
          localStorage.setItem('expenso_grill_savings_flat', parsedNum.toString());
          localStorage.removeItem('expenso_grill_savings_pct');
        }
        
        setGrillStep(3);
        setMessages(prev => [
          ...prev,
          { role: 'user', text: userMessage },
          { role: 'model', text: `Understood. Savings target mapped. 📈\n\n**Question 3**: What is your biggest financial stress point right now? (e.g., food delivery, rent, subscription bloat, P2P debts)` }
        ]);
        return;
      }
      
      if (grillStep === 3) {
        const stressPoint = userMessage;
        const overhead = parseFloat(localStorage.getItem('expenso_grill_overhead') || '0');
        const pct = parseFloat(localStorage.getItem('expenso_grill_savings_pct') || '0');
        const flat = parseFloat(localStorage.getItem('expenso_grill_savings_flat') || '0');
        
        setGrillStep(0);
        
        const income = userProfile.monthlyIncome || 50000;
        const targetSavings = pct > 0 ? (income * pct / 100) : flat;
        const discretionary = income - overhead - targetSavings;
        
        let report = '';
        if (persona === 'roast') {
          report = `🔥 **MAHI AUDIT REPORT: EXTREME SATURATION**\n\n` +
                   `* **Income Base**: **${currencySymbol}${income.toLocaleString()}**\n` +
                   `* **Fixed Overheads**: **${currencySymbol}${overhead.toLocaleString()}** (${Math.round(overhead / income * 100)}% of income)\n` +
                   `* **Target Savings**: **${currencySymbol}${targetSavings.toLocaleString()}**\n` +
                   `* **Discretionary Runway**: **${currencySymbol}${discretionary.toLocaleString()}**\n\n` +
                   `**Mahi Roast Diagnostic**:\n` +
                   `${discretionary < 0 
                     ? `🚨 **Warning!** You are running a negative runway of **${currencySymbol}${Math.abs(discretionary).toLocaleString()}**! Your financial server is about to crash.` 
                     : `You have a discretionary pool of **${currencySymbol}${discretionary.toLocaleString()}**. If you keep blowing it on luxury purchases, it will trigger an immediate buffer overflow.`}\n\n` +
                   `Stop crying about **"${stressPoint}"** and optimize your spending immediately! 💀`;
        } else if (persona === 'hype') {
          report = `🎉 **MAHI HYPE AUDIT REPORT**\n\n` +
                   `* **Monthly Income**: **${currencySymbol}${income.toLocaleString()}**\n` +
                   `* **Fixed Overheads**: **${currencySymbol}${overhead.toLocaleString()}**\n` +
                   `* **Target Savings**: **${currencySymbol}${targetSavings.toLocaleString()}**\n` +
                   `* **Discretionary Runway**: **${currencySymbol}${discretionary.toLocaleString()}**\n\n` +
                   `**Mahi Cheering Protocol**:\n` +
                   `This is amazing! By dedicating **${currencySymbol}${targetSavings.toLocaleString()}** to our savings goals, we are building serious wealth! We can easily conquer our stress about **"${stressPoint}"** by setting up automated pay-day transfers! Let's go! 🚀✨`;
        } else if (persona === 'friend') {
          report = `🤝 **MAHI COOPERATIVE AUDIT REPORT**\n\n` +
                   `* **Monthly Income**: **${currencySymbol}${income.toLocaleString()}**\n` +
                   `* **Fixed Overheads**: **${currencySymbol}${overhead.toLocaleString()}** (${Math.round(overhead / income * 100)}% of income)\n` +
                   `* **Target Savings**: **${currencySymbol}${targetSavings.toLocaleString()}**\n` +
                   `* **Discretionary Runway**: **${currencySymbol}${discretionary.toLocaleString()}**\n\n` +
                   `**Mahi Advice**:\n` +
                   `We can manage your stress about **"${stressPoint}"** by automating our **${currencySymbol}${targetSavings.toLocaleString()}** savings target on payday. This leaves us a safe discretionary pool of **${currencySymbol}${discretionary.toLocaleString()}** to spend guilt-free! We've got this! 😊`;
        } else {
          report = `[Mahi Telemetry Audit Report]\n\n` +
                   `* Income Base: ${currencySymbol}${income.toLocaleString()}\n` +
                   `* Fixed Commitments: ${currencySymbol}${overhead.toLocaleString()} (${(overhead / income * 100).toFixed(1)}%)\n` +
                   `* Target Savings Rate: ${((targetSavings / income) * 100).toFixed(1)}% (${currencySymbol}${targetSavings.toLocaleString()})\n` +
                   `* Residual Operating Capital: ${currencySymbol}${discretionary.toLocaleString()}\n\n` +
                   `**Diagnostic**: Stress point identified as "${stressPoint}". Recommendation: Automate savings diversion immediately to prevent variable outflow leakage.`;
        }
        
        setMessages(prev => [
          ...prev,
          { role: 'user', text: userMessage },
          { role: 'model', text: report }
        ]);
        return;
      }
    }

    // Intercept chat commands to switch persona
    let commandExecuted = false;
    let feedbackMessage = '';
    
    if (userMessage === '/roast') {
      setPersona('roast');
      localStorage.setItem('expenso_mahi_persona', 'roast');
      commandExecuted = true;
      feedbackMessage = "🔄 **Mahi has entered Roast Mode.** I'm ready to critique your spending with extreme prejudice. Ask me about your habits if you dare. 💀";
    } else if (userMessage === '/hype') {
      setPersona('hype');
      localStorage.setItem('expenso_mahi_persona', 'hype');
      commandExecuted = true;
      feedbackMessage = "🔄 **Mahi has entered Hype Mode!** Let's celebrate our wins and pump up those savings! Ask me how we are doing! 🎉✨";
    } else if (userMessage === '/friend') {
      setPersona('friend');
      localStorage.setItem('expenso_mahi_persona', 'friend');
      commandExecuted = true;
      feedbackMessage = "🔄 **Mahi has entered Friend Mode.** Warm, encouraging, and collaborative budgeting is active! 💖";
    } else if (userMessage === '/intelligent') {
      setPersona('intelligent');
      localStorage.setItem('expenso_mahi_persona', 'intelligent');
      commandExecuted = true;
      feedbackMessage = "🔄 **Mahi has entered Intelligent Mode.** Quantitative analysis, burn rates, and financial metrics are active. 📊";
    }

    if (commandExecuted) {
      setMessages(prev => [
        ...prev, 
        { role: 'user', text: userMessage },
        { role: 'model', text: feedbackMessage }
      ]);
      return;
    }

    const newMessages = [...messages, { role: 'user', text: userMessage } as ChatMessage];
    setMessages(newMessages);
    setLoading(true);
    const startTime = performance.now();

    try {
      const reply = await sendMessageToMahi(userMessage, messages, primaryCurrency, persona, {
        monthlyIncome: userProfile.monthlyIncome,
        monthlyLimit: userProfile.monthlyLimit,
        savingsGoals: userProfile.savingsGoals,
        accounts: accounts,
        categoryLimits: userProfile.categoryLimits
      }, {
        onAddTransaction: async (amount, category, note, type, currency) => {
          await addTransaction(amount, category, note, type, currency || primaryCurrency);
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
        },
        onUpdateUserProfile: (profile) => {
          updateUserProfile(profile);
        }
      });
      const endTime = performance.now();
      const genTime = ((endTime - startTime) / 1000).toFixed(1);
      
      setMessages((prev) => [...prev, { role: 'model', text: reply, meta: { genTime } }]);
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
    <>
      {/* Floating Bubble Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: [
            '0 0 15px rgba(0, 245, 255, 0.3)',
            '0 0 25px rgba(189, 0, 255, 0.5)',
            '0 0 15px rgba(0, 245, 255, 0.3)'
          ]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-tr from-primary via-accent to-secondary flex items-center justify-center text-black cursor-pointer group"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X size={22} strokeWidth={2.5} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              className="relative"
            >
              <MessageSquare size={22} strokeWidth={2.5} />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-[#09090A] rounded-full animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Floating Draggable Chat Terminal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            dragElastic={0.05}
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] sm:w-[380px] h-[520px] bg-surface/85 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header / Drag Handle */}
            <div 
              onPointerDown={(e) => dragControls.start(e)}
              className="p-4 border-b border-white/8 flex justify-between items-center bg-black/20 cursor-grab active:cursor-grabbing select-none shrink-0"
            >
              <div className="flex items-center gap-2">
                <GripHorizontal className="text-text-muted hover:text-white transition-colors" size={14} />
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-accent to-secondary flex items-center justify-center shadow-md">
                  <Sparkles className="text-black" size={14} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-white text-xs font-black font-sans">Mahi AI</h3>
                  <span className="text-primary text-[8px] font-bold uppercase tracking-wider block font-sans">Omnipresent Copilot</span>
                </div>
              </div>

              {/* Persona Selector Toggle */}
              <div className="flex items-center gap-1 bg-white/5 border border-white/8 p-0.5 rounded-xl mr-1.5 ml-auto">
                <button
                  onClick={() => {
                    setPersona('friend');
                    localStorage.setItem('expenso_mahi_persona', 'friend');
                  }}
                  className={`px-2 py-1 rounded-lg text-[8px] font-bold transition-all duration-200 cursor-pointer ${
                    persona === 'friend'
                      ? 'bg-gradient-to-tr from-primary to-secondary text-black shadow-md'
                      : 'text-text-muted hover:text-white'
                  }`}
                  title="Friend Mode"
                >
                  Friend
                </button>
                <button
                  onClick={() => {
                    setPersona('intelligent');
                    localStorage.setItem('expenso_mahi_persona', 'intelligent');
                  }}
                  className={`px-2 py-1 rounded-lg text-[8px] font-bold transition-all duration-200 cursor-pointer ${
                    persona === 'intelligent'
                      ? 'bg-gradient-to-tr from-accent to-secondary text-black shadow-md'
                      : 'text-text-muted hover:text-white'
                  }`}
                  title="Intelligent Mode"
                >
                  Brain
                </button>
              </div>

              <div className="flex items-center gap-1">
                {/* Clear Conversation Button */}
                <button
                  onClick={() => setIsConfirmClearOpen(true)}
                  className="p-1 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/8 text-text-muted hover:text-white transition-all duration-150 cursor-pointer"
                  title="Clear Conversation"
                >
                  <Trash2 size={13} />
                </button>

                {/* Download Report Button */}
                <button
                  onClick={handleDownloadReport}
                  className="p-1 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/8 text-text-muted hover:text-white transition-all duration-150 cursor-pointer"
                  title="Download Financial Report"
                >
                  <Download size={13} />
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/8 text-text-muted hover:text-white transition-all duration-150 cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((item, index) => {
                const isUser = item.role === 'user';
                const isLast = index === messages.length - 1;
                
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

                    {/* Message Bubble */}
                    <div className="relative group/bubble max-w-full">
                      <div
                        className={`p-3 rounded-2xl border ${
                          isUser
                            ? 'bg-gradient-to-tr from-white/3 to-white/6 border-white/8 text-white rounded-tr-none'
                            : 'bg-black/20 border-white/5 text-white rounded-tl-none'
                        }`}
                      >
                        <FormattedMessageText text={item.text} onAction={handleAction} />
                      </div>
                      
                      {!isUser && (
                        <div className="absolute -bottom-5 right-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-150 flex items-center gap-2 bg-[#09090A]/80 backdrop-blur-sm rounded-md px-1.5 py-0.5 border border-white/5 shadow-sm">
                          {item.meta?.genTime && (
                            <span className="text-[7.5px] text-text-muted font-bold font-sans">
                              Generated in {item.meta.genTime}s
                            </span>
                          )}
                          <button
                            onClick={() => handleCopyText(item.text, index)}
                            className="text-[9px] text-text-muted hover:text-white flex items-center gap-1 cursor-pointer"
                          >
                            {copiedIndex === index ? <Check size={8} className="text-primary" /> : <Copy size={8} />}
                            <span>{copiedIndex === index ? 'Copied' : 'Copy'}</span>
                          </button>
                          {isLast && (
                            <button
                              onClick={handleRegenerateResponse}
                              className="text-[9px] text-text-muted hover:text-white flex items-center gap-1 cursor-pointer"
                              title="Regenerate Response"
                            >
                              <RefreshCw size={8} className={loading ? 'animate-spin' : ''} />
                              <span>Retry</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex flex-col max-w-[85%] mr-auto items-start">
                  <div className="flex items-center gap-1.5 mb-1 opacity-50 px-1">
                    <Bot size={10} className="text-accent" />
                    <span className="text-text-muted text-[8px] font-bold uppercase tracking-wider">Mahi</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-black/25 border border-white/5 rounded-tl-none flex flex-col gap-2">
                    <span className="text-[9px] text-primary font-bold uppercase tracking-wider block animate-pulse">
                      Analyzing your finances...
                    </span>
                    <div className="flex gap-1 items-center">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Suggested Questions */}
              {!loading && (
                <div className="pt-4 space-y-1.5">
                  <span className="text-text-muted text-[8px] font-bold uppercase tracking-wider block px-1">Suggested Questions</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "What is my highest expense?",
                      "Check my account balances",
                      "Give me a savings plan"
                    ].map((q, qIdx) => (
                      <button
                        key={qIdx}
                        disabled={loading}
                        onClick={() => handleSuggestedQuestion(q)}
                        className="text-[9.5px] px-2.5 py-1.5 rounded-xl bg-white/3 hover:bg-white/7 border border-white/5 hover:border-white/10 text-white transition-all duration-150 cursor-pointer font-semibold text-left disabled:opacity-50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Hidden File Input for Receipt Scanning */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {/* Input Form */}
            <form
              onSubmit={handleSend}
              className={`p-3 border-t border-white/8 bg-black/20 flex gap-2 items-center shrink-0 transition-all duration-150 ${
                inputFocused ? 'border-t-white/15' : ''
              }`}
            >
              <div className="flex-1 flex bg-black/30 border border-white/8 rounded-xl px-3 py-2 items-center gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => fileInputRef.current?.click()}
                  className="text-text-muted hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                  title="Upload Receipt Image"
                >
                  <Paperclip size={14} />
                </button>
                <input
                  type="text"
                  value={input}
                  disabled={loading}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder={loading ? "Analyzing..." : "Ask Mahi anything..."}
                  className="bg-transparent text-white text-xs outline-none border-none w-full disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-black shadow-lg hover:brightness-110 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
              >
                <Send size={12} strokeWidth={2.5} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear Conversation Confirmation Dialog */}
      <ConfirmationModal
        isOpen={isConfirmClearOpen}
        onClose={() => setIsConfirmClearOpen(false)}
        onConfirm={handleClearConversation}
        title="Clear Conversation"
        description="Are you sure you want to clear this conversation history? This action cannot be undone."
        confirmLabel="Clear"
      />
    </>
  );
};

export default MahiBubble;
