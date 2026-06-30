import React, { useState } from 'react';
import { useTransactions } from '../context/TransactionContext';
import SvgDonutChart from '../components/SvgDonutChart';
import TransactionLedger from '../components/TransactionLedger';
import { Download } from 'lucide-react';

interface LedgerViewProps {
  onOpenAddTransaction?: () => void;
}

export const LedgerView: React.FC<LedgerViewProps> = ({ onOpenAddTransaction }) => {
  const { 
    transactions,
    convertedTransactions, 
    primaryCurrency,
    addTransaction,
    deleteTransaction
  } = useTransactions();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [lastExportTime, setLastExportTime] = useState<string | null>(() => {
    return localStorage.getItem('expenso_last_export_time');
  });

  const handleSplitTransaction = async (id: string) => {
    const target = transactions.find((t) => t.id === id);
    if (!target) return;

    try {
      await deleteTransaction(id);

      const splitAmount = target.amount / 2;
      await addTransaction(
        splitAmount,
        target.category,
        `Split: ${target.note}`,
        target.type,
        target.currency,
        target.paymentMethod,
        target.bankAccountId
      );
    } catch (e) {
      console.error('Failed to split transaction:', e);
    }
  };

  const handleExportCSV = () => {
    if (convertedTransactions.length === 0) {
      alert('No transactions to export.');
      return;
    }

    const headers = ['Date', 'Type', 'Category', 'Note', 'Amount', 'Currency', 'Payment Method'];
    const rows = convertedTransactions.map(t => [
      t.date,
      t.type,
      t.category,
      t.note,
      t.amount,
      t.currency,
      t.paymentMethod || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `expenso_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Save timestamp
    const timestampStr = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastExportTime(timestampStr);
    localStorage.setItem('expenso_last_export_time', timestampStr);
  };

  // Estimate CSV file size (~125 bytes per row)
  const estimatedSizeKb = ((convertedTransactions.length * 125) / 1024).toFixed(1);

  return (
    <div className="space-y-6">
      
      {/* Upper Section: Category Breakdown & Export Control */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Donut Chart (Spans 2 Columns) */}
        <div className="lg:col-span-2">
          <SvgDonutChart 
            transactions={convertedTransactions} 
            primaryCurrency={primaryCurrency} 
            onSelectCategory={setSelectedCategory}
          />
        </div>

        {/* CSV Export Widget (Spans 1 Column) */}
        <div className="glass rounded-3xl p-6 shadow-xl flex flex-col justify-between min-h-[220px]">
          <div>
            <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider block mb-1 font-sans">Data Portability</span>
            <h3 className="text-white text-base font-black font-sans">Export Ledger</h3>
            <p className="text-text-muted text-xs mt-2 leading-relaxed font-sans">
              Compile your entire transactional record including categories, notes, payment channels, and timestamps into a standardized CSV file.
            </p>

            {/* CSV Telemetry Info */}
            <div className="mt-4 space-y-1 text-[10px] text-text-muted font-bold font-sans">
              <div className="flex justify-between">
                <span>Record Count:</span>
                <span className="text-white">{convertedTransactions.length} rows</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Size:</span>
                <span className="text-white">~{estimatedSizeKb} KB</span>
              </div>
              <div className="flex justify-between">
                <span>Last Exported:</span>
                <span className="text-white">{lastExportTime || 'Never'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            className="w-full py-3 mt-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 hover:bg-primary/5 text-white hover:text-primary font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer font-sans"
          >
            <Download size={14} />
            <span>Download CSV Ledger</span>
          </button>
        </div>

      </div>

      {/* Transaction Ledger Table & Filters */}
      <TransactionLedger 
        transactions={convertedTransactions} 
        primaryCurrency={primaryCurrency} 
        onDeleteTransaction={deleteTransaction}
        onSplitTransaction={handleSplitTransaction}
        initialCategoryFilter={selectedCategory}
        onCategoryFilterChange={setSelectedCategory}
        onOpenAddTransaction={onOpenAddTransaction}
      />

    </div>
  );
};

export default LedgerView;
