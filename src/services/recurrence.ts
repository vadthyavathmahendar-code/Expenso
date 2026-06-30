import type { Transaction } from './dbService';

export interface RecurringSubscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  category: string;
  intervalDays: number;
  lastDate: string;
  nextDueDate: string;
  isUpcoming: boolean; // Due within 3 days
  daysUntilDue: number;
}

export const recurrenceService = {
  detectRecurring(transactions: Transaction[]): RecurringSubscription[] {
    const expenses = transactions.filter((t) => t.type === 'expense');
    
    const groups: Record<string, Transaction[]> = {};
    expenses.forEach((t) => {
      const name = (t.note || t.category).trim();
      const key = name.toLowerCase();
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(t);
    });

    const recurringList: RecurringSubscription[] = [];

    Object.entries(groups).forEach(([_, txs]) => {
      txs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (txs.length < 2) return;

      const intervals: number[] = [];
      for (let i = 1; i < txs.length; i++) {
        const diffTime = new Date(txs[i].date).getTime() - new Date(txs[i - 1].date).getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        intervals.push(diffDays);
      }

      const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;

      // Check for monthly recurring pattern (25 to 35 days)
      if (avgInterval >= 25 && avgInterval <= 35) {
        const lastTx = txs[txs.length - 1];
        const lastDate = new Date(lastTx.date);
        const nextDueDate = new Date(lastDate);
        nextDueDate.setDate(lastDate.getDate() + Math.round(avgInterval));

        const now = new Date();
        const diffTime = nextDueDate.getTime() - now.getTime();
        const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysUntilDue >= -2) {
          recurringList.push({
            id: lastTx.id,
            name: lastTx.note || lastTx.category,
            amount: lastTx.amount,
            currency: (lastTx as any).currency || 'USD',
            category: lastTx.category,
            intervalDays: Math.round(avgInterval),
            lastDate: lastTx.date,
            nextDueDate: nextDueDate.toISOString(),
            isUpcoming: daysUntilDue <= 3 && daysUntilDue >= 0,
            daysUntilDue,
          });
        }
      }
    });

    return recurringList.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  }
};

export default recurrenceService;
