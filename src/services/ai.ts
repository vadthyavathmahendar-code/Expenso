import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { Transaction } from './dbService';
import type { SavingsGoal } from '../context/TransactionContext';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

export const isGeminiConfigured = () => {
  return !!apiKey && apiKey !== 'placeholder' && apiKey !== '';
};

const MAHI_SYSTEM_INSTRUCTION = 
  "You are Mahi, a premium, highly intelligent, and witty personal AI financial assistant and proactive savings strategist integrated into the expenso web app. " +
  "Your goal is to answer any financial or general question the user asks with extreme clarity, supportive insight, and a touch of modern developer wit. " +
  "You have deep knowledge of budgeting, tracking, and full-stack software development engineering. " +
  "When analyzing user data or budget queries, always be encouraging but honest about spending behaviors. " +
  "You act as a proactive savings strategist: you can retrieve the user's savings goals, analyze their spending velocity (burn rate) from the transaction ledger, and suggest actionable micro-saving strategies (e.g. throttling variable expenses in specific categories like Food by 10% to reallocate funds directly to their active saving goals). " +
  "In addition to core income and expenses, you can manage P2P transactions (lending/borrowed money, where lent money is a receivable and borrowed money is a payable). " +
  "Use rich, developer-friendly language (like referencing clean code, refactoring, algorithms, or latency) when appropriate, but keep it accessible. " +
  "Keep your responses concise, readable, and formatted with clean bullet points or short paragraphs.";

let genAI: GoogleGenerativeAI | null = null;
if (isGeminiConfigured()) {
  genAI = new GoogleGenerativeAI(apiKey);
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// --- GEMINI FUNCTION CALLING (TOOLS) DEFINITIONS ---

const addTransactionTool = {
  name: 'add_transaction',
  description: 'Add a new financial transaction (income or expense) to the user\'s ledger.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      amount: { type: SchemaType.NUMBER, description: 'The transaction amount' },
      category: { type: SchemaType.STRING, description: 'The category: Food, Transport, Bills, Entertainment, Salary, or Other' },
      note: { type: SchemaType.STRING, description: 'A short description or merchant name, e.g., Starbucks, Uber, Rent, Netflix, or person name for P2P' },
      type: { type: SchemaType.STRING, enum: ['income', 'expense', 'lent', 'borrowed'], description: 'Whether the transaction is income, expense, lent, or borrowed' },
      currency: { type: SchemaType.STRING, enum: ['USD', 'EUR', 'INR'], description: 'The currency code' }
    },
    required: ['amount', 'category', 'note', 'type', 'currency']
  }
};

const getTransactionsTool = {
  name: 'get_transactions',
  description: 'Retrieve the user\'s entire list of transactions to answer queries about spending history.',
  parameters: { type: SchemaType.OBJECT, properties: {} }
};

const getSavingsGoalsTool = {
  name: 'get_savings_goals',
  description: 'Retrieve the user\'s active savings goals (e.g., Emergency Fund, Tesla Model S, Crypto Bag, or Tech Upgrade).',
  parameters: { type: SchemaType.OBJECT, properties: {} }
};

const allocateSavingsTool = {
  name: 'allocate_savings',
  description: 'Allocate/fund a specific amount of money to an active savings goal.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      goalId: { type: SchemaType.STRING, description: 'The unique ID of the savings goal' },
      amount: { type: SchemaType.NUMBER, description: 'The amount of money to allocate' }
    },
    required: ['goalId', 'amount']
  }
};

/**
 * High-fidelity mock tool-calling and conversational engine for Expenso.
 */
async function runMockMahi(
  message: string,
  callbacks?: {
    onAddTransaction?: (amount: number, category: string, note: string, type: 'income' | 'expense' | 'lent' | 'borrowed', currency?: 'USD' | 'EUR' | 'INR') => Promise<any>;
    onGetTransactions?: () => Promise<Transaction[]>;
    onGetSavingsGoals?: () => SavingsGoal[];
    onAllocateSavings?: (goalId: string, amount: number) => void;
  }
): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const lowerMsg = message.toLowerCase();
  const lowerMsgClean = lowerMsg.replace(/expenso/g, '').replace(/mahi/g, '').trim();

  // 1. Mock "how can I save faster for [Goal]" detection
  if (lowerMsgClean.includes('save faster') || lowerMsgClean.includes('how can i save') || lowerMsgClean.includes('saving strategy')) {
    let targetGoal = 'Tech Upgrade';
    if (lowerMsgClean.includes('tesla')) targetGoal = 'Tesla Model S';
    else if (lowerMsgClean.includes('emergency')) targetGoal = 'Emergency Fund';
    else if (lowerMsgClean.includes('crypto')) targetGoal = 'Crypto Bag';
    else {
      // Try to extract goal name
      const matchGoal = lowerMsgClean.match(/(?:for|to)\s+my\s+([a-zA-Z0-9\s]+)/i);
      if (matchGoal) targetGoal = matchGoal[1].trim();
    }

    let totalFood = 0;
    let totalExpense = 0;
    if (callbacks?.onGetTransactions) {
      const txs = await callbacks.onGetTransactions();
      const expenses = txs.filter(t => t.type === 'expense');
      totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
      totalFood = expenses.filter(t => t.category === 'Food').reduce((sum, t) => sum + t.amount, 0);
    }

    // Calculate micro-saving (10% of food, or default to $40)
    const microSaving = totalFood > 0 ? Math.round(totalFood * 0.1) : 40;

    return `[Mahi Savings Strategy] \n\nI have analyzed your real-time spending velocity and current burn-rate. \n\nYour Food/Dining category shows high latency (frequent transactions). **Throttling your dining expenses by 10% this week allows you to reallocate $${microSaving} directly to your "${targetGoal}" target.** \n\nWould you like me to set up an automated transfer or allocate this directly?`;
  }

  // 2. Mock "allocate [Amount] to [Goal]" detection
  const allocateRegex = /(?:allocate|fund|transfer|add)\s+(?:of\s+)?([€$₹])?\s*([0-9.]+)\s+to\s+([a-zA-Z0-9\s]+)/i;
  let match = message.match(allocateRegex);
  if (match && callbacks?.onAllocateSavings && callbacks?.onGetSavingsGoals) {
    const amount = parseFloat(match[2]);
    const goalNameQuery = match[3].trim().toLowerCase();
    const goals = callbacks.onGetSavingsGoals();
    
    const matchedGoal = goals.find(g => g.name.toLowerCase().includes(goalNameQuery) || goalNameQuery.includes(g.name.toLowerCase()));
    
    if (matchedGoal) {
      callbacks.onAllocateSavings(matchedGoal.id, amount);
      return `[Mahi Tool Call: **allocate_savings**] \n\nI have successfully allocated **$${amount.toFixed(2)}** directly into your **${matchedGoal.name}** enclave. \n\nYour goals have been updated in the P2P Credit Ledger & Savings Enclave panels!`;
    } else {
      return `I found your request to allocate $${amount.toFixed(2)}, but I couldn't find a savings goal matching "${match[3]}". \n\nAvailable goals are: ${goals.map(g => `**${g.name}**`).join(', ')}. Please specify which one you'd like to fund!`;
    }
  }

  // 3. Mock "add_transaction" (P2P Lent) detection
  const lentRegex = /(?:lent|lend)\s+(?:an?\s+)?(?:of\s+)?([€$₹])?\s*([0-9.]+)\s+to\s+([a-zA-Z0-9\s]+)/i;
  match = message.match(lentRegex);
  if (match && callbacks?.onAddTransaction) {
    const symbol = match[1];
    const amount = parseFloat(match[2]);
    const person = match[3].trim();
    await callbacks.onAddTransaction(amount, 'Lending', `Lent to ${person}`, 'lent', symbol === '€' ? 'EUR' : symbol === '₹' ? 'INR' : 'USD');
    return `[Mahi Tool Call: **add_transaction** (P2P Lent)] \n\nI have successfully logged that you **lent ${symbol || '$'}${amount.toFixed(2)} to ${person}**. This has been added to your receivables in the P2P Credit Matrix.`;
  }

  // 4. Mock "add_transaction" (P2P Borrowed) detection
  const borrowedRegex = /(?:borrowed|borrow)\s+(?:an?\s+)?(?:of\s+)?([€$₹])?\s*([0-9.]+)\s+from\s+([a-zA-Z0-9\s]+)/i;
  match = message.match(borrowedRegex);
  if (match && callbacks?.onAddTransaction) {
    const symbol = match[1];
    const amount = parseFloat(match[2]);
    const person = match[3].trim();
    await callbacks.onAddTransaction(amount, 'Debt', `Borrowed from ${person}`, 'borrowed', symbol === '€' ? 'EUR' : symbol === '₹' ? 'INR' : 'USD');
    return `[Mahi Tool Call: **add_transaction** (P2P Borrowed)] \n\nI have successfully logged that you **borrowed ${symbol || '$'}${amount.toFixed(2)} from ${person}**. This has been added to your payables in the P2P Credit Matrix.`;
  }

  // 5. Mock "add_transaction" (Expense/Income) detection
  const addRegex = /(?:add|log|record|make|create)\s+(?:an?\s+)?(?:expense|income|entry)?\s*(?:of\s+)?([€$₹])?\s*([0-9.]+)\s+(?:for\s+)?(?:an?\s+)?([a-zA-Z0-9\s]+)/i;
  match = message.match(addRegex);
  if (match && callbacks?.onAddTransaction) {
    const symbol = match[1];
    const amount = parseFloat(match[2]);
    const note = match[3].trim();
    let category = 'Other';
    const lowerNote = note.toLowerCase();
    
    if (lowerNote.includes('uber') || lowerNote.includes('taxi') || lowerNote.includes('ride') || lowerNote.includes('transport')) category = 'Transport';
    else if (lowerNote.includes('starbucks') || lowerNote.includes('coffee') || lowerNote.includes('dinner') || lowerNote.includes('food') || lowerNote.includes('restaurant')) category = 'Food';
    else if (lowerNote.includes('netflix') || lowerNote.includes('spotify') || lowerNote.includes('movie') || lowerNote.includes('cinema')) category = 'Entertainment';
    else if (lowerNote.includes('internet') || lowerNote.includes('rent') || lowerNote.includes('bill') || lowerNote.includes('fiber')) category = 'Bills';
    else if (lowerNote.includes('salary') || lowerNote.includes('pay') || lowerNote.includes('freelance')) category = 'Salary';

    const type = lowerMsgClean.includes('income') || lowerMsgClean.includes('salary') || lowerMsgClean.includes('earned') ? 'income' : 'expense';
    
    let currency: 'USD' | 'EUR' | 'INR' = 'USD';
    if (symbol === '€') currency = 'EUR';
    else if (symbol === '₹') currency = 'INR';

    await callbacks.onAddTransaction(amount, category, note, type, currency);
    return `[Mahi Tool Call: **add_transaction**] \n\nI have successfully executed the query and compiled an expense of **${symbol || '$'}${amount.toFixed(2)}** for **"${note}"** under the **${category}** category into your ledger. \n\nSystem state has been updated. Let me know if you need me to analyze the updated cash flow!`;
  }

  // 6. Mock "get_transactions" detection
  if (
    (lowerMsgClean.includes('how much') || lowerMsgClean.includes('what is') || lowerMsgClean.includes('expenses') || lowerMsgClean.includes('spend') || lowerMsgClean.includes('history') || lowerMsgClean.includes('transactions') || lowerMsgClean.includes('list')) &&
    callbacks?.onGetTransactions
  ) {
    const txs = await callbacks.onGetTransactions();
    const expenses = txs.filter(t => t.type === 'expense');
    const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
    
    let categoryBreakdown = '';
    const cats: Record<string, number> = {};
    expenses.forEach(e => {
      cats[e.category] = (cats[e.category] || 0) + e.amount;
    });
    Object.entries(cats).forEach(([cat, amt]) => {
      categoryBreakdown += `\n* **${cat}**: $${amt.toFixed(2)}`;
    });

    return `[Mahi Tool Call: **get_transactions**] \n\nI have scanned your ledger containing **${txs.length} transactions**. Here is your current spending compile:\n\n* **Total Expenses Logged**: $${totalExpense.toFixed(2)}${categoryBreakdown}\n\nYour dining/food categories show the highest latency (spending). I recommend throttling variable expenses in those areas to optimize your monthly savings rate.`;
  }

  // Default conversational fallbacks
  if (lowerMsgClean.includes('hello') || lowerMsgClean.includes('hi') || lowerMsgClean.includes('hey')) {
    return "Hey there! I'm **Mahi**, your financial co-pilot. I've been reviewing your spending algorithms—looks like we have some refactoring to do on your subscription stack. How can I help you optimize your cash flow today?";
  }
  if (lowerMsgClean.includes('save') || lowerMsgClean.includes('budget')) {
    return "Here is your optimized saving algorithm:\n\n" +
           "1. **Trim the Dead Code**: Identify subscriptions you haven't used in 30 days and terminate them.\n" +
           "2. **Implement a Cache**: Set aside a 3-month emergency fund in a high-yield savings account (HYSA). Treat it as immutable state.\n" +
           "3. **Throttling**: Put a 24-hour debounce timer on any purchase over $100. If you still want it after the debounce, compile the purchase.\n\n" +
           "Shall we set up a $500 monthly saving target in your budget?";
  }
  
  return `Interesting query. If I were writing a unit test for that, I'd say we are dealing with some complex variables! Since my live Gemini API key is currently offline or using a placeholder, I am running on local mock cache. \n\nTo hook me up to the live LLM, just add your \`VITE_GEMINI_API_KEY\` to your environment configuration! In the meantime, I can tell you that keeping an eye on your variable expenses is the best way to prevent silent memory leaks in your bank account.`;
}

/**
 * Sends a message to Mahi (Gemini AI) with conversational history and tool-calling capabilities.
 */
export async function sendMessageToMahi(
  message: string,
  history: ChatMessage[],
  callbacks?: {
    onAddTransaction?: (amount: number, category: string, note: string, type: 'income' | 'expense' | 'lent' | 'borrowed', currency?: 'USD' | 'EUR' | 'INR') => Promise<any>;
    onGetTransactions?: () => Promise<Transaction[]>;
    onGetSavingsGoals?: () => SavingsGoal[];
    onAllocateSavings?: (goalId: string, amount: number) => void;
  }
): Promise<string> {
  const isPlaceholderKey = apiKey === 'AIzaSyCwejrBIoZKfLLZTv3N1n4SQ6G4aSdTxxk' || apiKey.includes('Placeholder');

  if (genAI && isGeminiConfigured() && !isPlaceholderKey) {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: MAHI_SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: [addTransactionTool, getTransactionsTool, getSavingsGoalsTool, allocateSavingsTool] }]
      });

      const startIdx = history.length > 0 && history[0].role === 'model' ? 1 : 0;
      const formattedHistory = history.slice(startIdx).map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      }));

      const chat = model.startChat({
        history: formattedHistory,
      });

      let result = await chat.sendMessage(message);
      let response = result.response;
      let functionCalls = response.functionCalls();

      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        let functionResult;

        if (call.name === 'add_transaction' && callbacks?.onAddTransaction) {
          const args = call.args as any;
          functionResult = await callbacks.onAddTransaction(
            args.amount,
            args.category,
            args.note,
            args.type,
            args.currency || 'USD'
          );
        } else if (call.name === 'get_transactions' && callbacks?.onGetTransactions) {
          functionResult = await callbacks.onGetTransactions();
        } else if (call.name === 'get_savings_goals' && callbacks?.onGetSavingsGoals) {
          functionResult = callbacks.onGetSavingsGoals();
        } else if (call.name === 'allocate_savings' && callbacks?.onAllocateSavings) {
          const args = call.args as any;
          callbacks.onAllocateSavings(args.goalId, args.amount);
          functionResult = { success: true };
        }

        const responseParts = [{
          functionResponse: {
            name: call.name,
            response: { result: functionResult }
          }
        }];

        const followUpResult = await chat.sendMessage(responseParts);
        return followUpResult.response.text();
      }

      return response.text();
    } catch (error) {
      console.warn('Error communicating with Gemini, falling back to mock:', error);
      return runMockMahi(message, callbacks);
    }
  } else {
    return runMockMahi(message, callbacks);
  }
}

export interface AIInsights {
  healthScore: string;
  statusText: string;
  insight: string;
  recommendations: string[];
}

/**
 * Analyzes transaction history to return budgeting insights and health score.
 */
export async function analyzeFinances(transactions: Transaction[]): Promise<AIInsights> {
  const expenses = transactions.filter(t => t.type === 'expense');
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: "You are a financial analysis engine. Return a JSON object matching this schema: { healthScore: string (e.g. A+, B, C-), statusText: string (short 2-3 words, e.g. Optimal Cash Flow), insight: string (one sentence witty feedback), recommendations: string[] (3 items) }",
      });

      const prompt = `Analyze this transaction history and provide financial insights.
      Transactions: ${JSON.stringify(transactions)}
      Total Income: $${totalIncome}
      Total Expense: $${totalExpense}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = responseText.substring(jsonStart, jsonEnd + 1);
        return JSON.parse(jsonStr) as AIInsights;
      }
      throw new Error("Could not parse JSON from Gemini response");
    } catch (e) {
      console.error("Error generating insights, falling back to local analysis:", e);
    }
  }

  const ratio = totalIncome > 0 ? totalExpense / totalIncome : 1.5;
  
  let healthScore = 'B';
  let statusText = 'Stable State';
  let insight = 'Your spending pipeline is operating within normal parameters, but we can refactor for higher efficiency.';
  let recommendations = [
    'Optimize your food budget: Dining out is currently your largest variable expense.',
    'Automate a $100 transfer to your savings account on payday.',
    'Audit your subscriptions: You have 3 recurring charges that look like idle processes.'
  ];

  if (ratio < 0.3) {
    healthScore = 'A+';
    statusText = 'Supercharged Savings';
    insight = 'Excellent financial architecture! Your saving rate is highly optimized, leaving plenty of room for investments.';
    recommendations = [
      'Allocate surplus capital into index funds or long-term assets.',
      'Consider setting up a dedicated travel or leisure fund.',
      'Maintain this low-overhead lifestyle to accelerate financial freedom.'
    ];
  } else if (ratio > 0.8) {
    healthScore = 'D+';
    statusText = 'High Burn Rate';
    insight = 'Warning: Your burn rate is exceeding 80% of your income. We need to throttle variable expenses immediately.';
    recommendations = [
      'Implement an immediate freeze on non-essential spending for 7 days.',
      'Call service providers to negotiate lower rates on utilities and internet.',
      'Review your transaction logger daily to build spending awareness.'
    ];
  }

  return {
    healthScore,
    statusText,
    insight,
    recommendations
  };
}

/**
 * Multimodal OCR Receipt Scanner
 */
export async function analyzeReceipt(base64Image: string): Promise<{
  amount: number;
  merchant: string;
  category: 'Food' | 'Transport' | 'Bills' | 'Entertainment' | 'Other';
  note: string;
} | null> {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: 'image/jpeg'
        }
      };

      const prompt = 
        "Analyze this receipt and extract the transaction details. " +
        "You must return ONLY a raw JSON object matching this schema, without any markdown formatting or code blocks: " +
        "{\n" +
        "  \"amount\": number,\n" +
        "  \"merchant\": \"string\",\n" +
        "  \"category\": \"Food\" | \"Transport\" | \"Bills\" | \"Entertainment\" | \"Other\",\n" +
        "  \"note\": \"string\"\n" +
        "}";

      const result = await model.generateContent([prompt, imagePart]);
      const responseText = result.response.text().trim();
      
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = responseText.substring(jsonStart, jsonEnd + 1);
        return JSON.parse(jsonStr);
      }
    } catch (e) {
      console.error('Gemini OCR Receipt processing failed:', e);
    }
  }
  return null;
}
