import React, { useMemo, useState } from 'react';
import { useTransactions } from '../context/TransactionContext';
import { currencyService } from '../services/currency';
import RecurrenceShelf from '../components/RecurrenceShelf';
import OcrScanner from '../components/OcrScanner';
import { Coins, ShieldAlert } from 'lucide-react';
import type { CurrencyCode } from '../services/currency';
import { ConfirmationModal } from '../components/ConfirmationModal';
import type { Transaction } from '../services/dbService';

export const NetworksView: React.FC = () => {
  const { 
    transactions,
    convertedTransactions, 
    primaryCurrency,
    addTransaction,
    deleteTransaction,
    showToast
  } = useTransactions();

  const [showHistory, setShowHistory] = useState(false);
  const [settledHistory, setSettledHistory] = useState<{ id: string; person: string; amount: number; type: 'lent' | 'borrowed'; date: string }[]>(() => {
    const cached = localStorage.getItem('expenso_settled_p2p');
    return cached ? JSON.parse(cached) : [];
  });

  const [isConfirmSettleOpen, setIsConfirmSettleOpen] = useState(false);
  const [txToSettle, setTxToSettle] = useState<Transaction | null>(null);

  // Calculate P2P Matrix
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

  const p2pTransactions = useMemo(() => {
    return convertedTransactions.filter(t => t.type === 'lent' || t.type === 'borrowed');
  }, [convertedTransactions]);

  const formatCurrency = (val: number) => {
    return currencyService.format(val, primaryCurrency);
  };

  const handleScanSuccess = async (data: {
    amount: number;
    category: string;
    note: string;
    currency: CurrencyCode;
    merchant?: string;
  }) => {
    try {
      await addTransaction(data.amount, data.category, data.merchant || data.note, 'expense', data.currency);
      showToast("Receipt imported successfully!", "success");
    } catch (e) {
      console.error('Failed to log scanned transaction:', e);
      showToast("OCR extraction failed.", "error");
    }
  };

  const handleConfirmSettle = async () => {
    if (!txToSettle) return;

    try {
      const displayName = txToSettle.note || (txToSettle.type === 'lent' ? 'Lent Capital' : 'Borrowed Capital');
      const cleanName = displayName
        .replace(/Lent to/i, '')
        .replace(/Borrowed from/i, '')
        .trim();

      // Add to history
      const newHistoryItem = {
        id: txToSettle.id,
        person: cleanName,
        amount: txToSettle.amount,
        type: txToSettle.type as 'lent' | 'borrowed',
        date: new Date().toISOString()
      };

      const updatedHistory = [newHistoryItem, ...settledHistory];
      setSettledHistory(updatedHistory);
      localStorage.setItem('expenso_settled_p2p', JSON.stringify(updatedHistory));

      // Remove from active transactions
      await deleteTransaction(txToSettle.id);
      showToast(`Settled transaction with ${cleanName}!`, 'success');
      setTxToSettle(null);
    } catch (e) {
      console.error(e);
      showToast("Failed to settle P2P record.", 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Grid: P2P Credit Matrix & OCR Receipt Scanner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* P2P Credit Matrix Card */}
        <div className="glass rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[340px]">
          <div className="absolute top-[-10%] right-[-10%] w-32 h-32 rounded-full opacity-5 bg-secondary blur-2xl pointer-events-none" />

          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Coins className="text-secondary" size={16} />
                <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider font-sans">
                  P2P Credit Matrix
                </span>
              </div>
              <span className="text-[9px] bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5 font-bold text-text-muted font-sans">
                Lending & Debt
              </span>
            </div>

            <p className="text-text-muted text-xs leading-relaxed mb-4 font-sans">
              Track outstanding personal loans, shared bill splits, and informal debts. Mahi automatically logs these when you talk to her.
            </p>

            <div className="space-y-4 my-2">
              {/* Receivables (Lent) */}
              <div className="flex justify-between items-center bg-white/2 border border-white/5 rounded-2xl p-3.5">
                <div>
                  <span className="text-text-muted text-[9px] font-bold uppercase tracking-wider block font-sans">Receivables (Lent)</span>
                  <span className="text-primary text-lg font-black mt-0.5 block font-sans">{formatCurrency(totalReceivables)}</span>
                </div>
                <div className="text-[10px] text-primary font-bold uppercase tracking-wider bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg font-sans">
                  To Collect
                </div>
              </div>

              {/* Payables (Borrowed) */}
              <div className="flex justify-between items-center bg-white/2 border border-white/5 rounded-2xl p-3.5">
                <div>
                  <span className="text-text-muted text-[9px] font-bold uppercase tracking-wider block font-sans">Payables (Borrowed)</span>
                  <span className="text-red-400 text-lg font-black mt-0.5 block font-sans">{formatCurrency(totalPayables)}</span>
                </div>
                <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-lg font-sans">
                  To Pay
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-text-muted leading-tight border-t border-white/5 pt-4 mt-4 flex items-start gap-2">
            <ShieldAlert size={12} className="text-accent mt-0.5 shrink-0" />
            <span className="font-sans">
              Mahi parses natural statements: <em className="text-white/70">"I lent ₹500 to Amit for lunch"</em> or <em className="text-white/70">"Borrowed ₹250 from Sam"</em>.
            </span>
          </div>
        </div>

        {/* OCR Receipt Scanner Card */}
        <div className="glass rounded-3xl p-6 shadow-xl flex flex-col justify-between min-h-[340px]">
          <div>
            <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider block mb-1 font-sans">Optical Engine</span>
            <h3 className="text-white text-base font-black mb-2 font-sans">Mahi OCR Receipt Scanner</h3>
            <p className="text-text-muted text-xs leading-relaxed mb-4 font-sans">
              Upload a receipt image or select one of our pre-compiled invoice templates. Mahi's vision model will instantly extract the merchant, amount, category, and notes to log the entry.
            </p>
          </div>

          <div className="bg-black/20 border border-white/5 rounded-2xl p-4 flex-1 flex flex-col justify-center">
            <OcrScanner onScanSuccess={handleScanSuccess} />
          </div>
        </div>

      </div>

      {/* Recent Settlements Section */}
      <div className="glass rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider block font-sans">Recent Settlements</span>
          <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setShowHistory(false)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all duration-150 font-sans ${
                !showHistory ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all duration-150 font-sans ${
                showHistory ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white'
              }`}
            >
              History
            </button>
          </div>
        </div>

        {showHistory ? (
          settledHistory.length === 0 ? (
            <div className="py-8 text-center text-text-muted text-xs font-sans">No settlement history logged.</div>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {settledHistory.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-white/2 border border-white/5 p-2.5 rounded-2xl">
                  <div>
                    <span className="text-white text-xs font-bold block font-sans">{item.person}</span>
                    <span className="text-text-muted text-[8px] block mt-0.5 font-sans">Settled on {new Date(item.date).toLocaleDateString()}</span>
                  </div>
                  <span className="text-[10px] font-black text-primary font-sans">
                    {item.type === 'lent' ? 'Collected' : 'Paid'} {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          )
        ) : (
          p2pTransactions.length === 0 ? (
            <div className="py-8 text-center text-text-muted text-xs font-sans">No active P2P settlements pending.</div>
          ) : (
            <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
              {p2pTransactions.map((t) => {
                const isLent = t.type === 'lent';
                const displayName = t.note || (isLent ? 'Lent Capital' : 'Borrowed Capital');
                const cleanName = displayName
                  .replace(/Lent to/i, '')
                  .replace(/Borrowed from/i, '')
                  .trim();

                const handleCopyUPI = () => {
                  const message = `Hey ${cleanName}, hope you are doing well! Just a quick reminder to settle the ${formatCurrency(t.amount)} due. You can transfer it via UPI. Thanks!`;
                  navigator.clipboard.writeText(message);
                  showToast(`UPI Settlement Request copied to clipboard for ${cleanName}!`, 'success');
                };

                const handleMarkAsPaidClick = () => {
                  setTxToSettle(t);
                  setIsConfirmSettleOpen(true);
                };

                return (
                  <div key={t.id} className="flex justify-between items-center bg-white/2 border border-white/5 p-3 rounded-2xl hover:bg-white/4 transition-colors">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white text-xs font-bold block truncate font-sans">{cleanName}</span>
                        <span className={`text-[7px] px-1.5 py-0.2 rounded-full font-bold uppercase font-sans ${
                          isLent ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {isLent ? 'Lent' : 'Borrowed'}
                        </span>
                      </div>
                      <span className="text-text-muted text-[8px] block mt-0.5 font-sans font-medium">
                        Due: {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-black font-sans mr-1.5 ${isLent ? 'text-primary' : 'text-red-400'}`}>
                        {formatCurrency(t.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyUPI}
                        className="text-[9px] px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/8 transition-all font-sans cursor-pointer"
                        title="Send UPI Payment Reminder"
                      >
                        Remind
                      </button>
                      <button
                        type="button"
                        onClick={handleMarkAsPaidClick}
                        className="text-[9px] px-2 py-1 rounded-lg bg-gradient-to-tr from-primary to-secondary text-black font-bold shadow-sm hover:brightness-110 transition-all font-sans cursor-pointer"
                      >
                        Settle
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Subscription commitments Shelf */}
      <RecurrenceShelf transactions={transactions} primaryCurrency={primaryCurrency} />

      {/* Settle Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmSettleOpen}
        onClose={() => setIsConfirmSettleOpen(false)}
        onConfirm={handleConfirmSettle}
        title="Settle P2P Record"
        description="Are you sure you want to settle this P2P record? Settle will mark it as paid, archive it into your history, and remove the outstanding balance."
        confirmLabel="Settle"
      />

    </div>
  );
};

export default NetworksView;
