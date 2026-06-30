import React, { useMemo } from 'react';
import type { Transaction } from '../services/dbService';
import { currencyService, type CurrencyCode } from '../services/currency';
import { recurrenceService } from '../services/recurrence';
import { Calendar, AlertTriangle } from 'lucide-react';

interface RecurrenceShelfProps {
  transactions: Transaction[];
  primaryCurrency: CurrencyCode;
}

export const RecurrenceShelf: React.FC<RecurrenceShelfProps> = ({ transactions, primaryCurrency }) => {
  const recurringCommitments = useMemo(() => {
    return recurrenceService.detectRecurring(transactions).map(sub => ({
      ...sub,
      amount: currencyService.convert(sub.amount, sub.currency as CurrencyCode, primaryCurrency)
    }));
  }, [transactions, primaryCurrency]);

  if (recurringCommitments.length === 0) {
    return null; // Return nothing if no subscriptions detected yet
  }

  return (
    <div className="mb-6">
      <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-3">Recurring Commitments</h3>
      
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
        {recurringCommitments.map((item) => (
          <div
            key={item.id}
            className="glass rounded-2xl p-4 min-w-[210px] max-w-[210px] relative overflow-hidden flex flex-col justify-between"
          >
            {/* Background Glow inside Card */}
            <div 
              className={`absolute top-0 right-0 w-16 h-16 rounded-full opacity-5 pointer-events-none blur-xl`}
              style={{ backgroundColor: item.isUpcoming ? '#FF2D55' : '#39FF14' }}
            />

            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0 mr-2">
                <h4 className="text-white text-sm font-bold truncate">{item.name}</h4>
                <span className="text-text-muted text-[9px] uppercase tracking-wider block mt-0.5">{item.category}</span>
              </div>
              
              {item.isUpcoming ? (
                <div className="bg-red-500/15 border border-red-500/30 rounded-full px-2 py-0.5 flex items-center gap-1">
                  <AlertTriangle className="text-red-400" size={10} />
                  <span className="text-red-400 text-[8px] font-extrabold uppercase">Due</span>
                </div>
              ) : (
                <div className="bg-white/5 rounded-full p-1 border border-white/5">
                  <Calendar className="text-text-muted" size={12} />
                </div>
              )}
            </div>

            <div className="mt-2">
              <span className="text-white text-lg font-black">
                {currencyService.format(item.amount, primaryCurrency)}
              </span>
            </div>

            <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-white/5">
              <span className="text-text-muted text-[9px] uppercase tracking-wider">Forecast</span>
              <span 
                className={`text-xxs font-bold ${
                  item.isUpcoming ? 'text-red-400' : 'text-primary'
                }`}
              >
                {item.daysUntilDue === 0 
                  ? 'Today' 
                  : item.daysUntilDue === 1 
                    ? 'Tomorrow' 
                    : `In ${item.daysUntilDue} days`}
              </span>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default RecurrenceShelf;
