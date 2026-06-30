export type CurrencyCode = 'USD' | 'EUR' | 'INR';

const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  USD: 1.0,
  EUR: 0.92, // 1 USD = 0.92 EUR
  INR: 83.50, // 1 USD = 83.50 INR
};

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  INR: '₹',
};

export const currencyService = {
  convert(amount: number, from: CurrencyCode, to: CurrencyCode): number {
    if (from === to) return amount;
    const amountInUSD = amount / EXCHANGE_RATES[from];
    const convertedAmount = amountInUSD * EXCHANGE_RATES[to];
    return Math.round(convertedAmount * 100) / 100;
  },

  getSymbol(currency: CurrencyCode): string {
    return CURRENCY_SYMBOLS[currency] || '$';
  },

  format(amount: number, currency: CurrencyCode): string {
    const symbol = this.getSymbol(currency);
    const formattedVal = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${symbol}${formattedVal}`;
  },

  getSupportedCurrencies(): CurrencyCode[] {
    return ['USD', 'EUR', 'INR'];
  }
};

export default currencyService;
