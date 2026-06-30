import React, { useState } from 'react';
import { useTransactions } from '../context/TransactionContext';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  TrendingUp, 
  Save,
  Coins,
  Lock,
  Bell,
  Edit2
} from 'lucide-react';
import { currencyService } from '../services/currency';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface VaultViewProps {
  user: any;
}

export const VaultView: React.FC<VaultViewProps> = ({ user: _user }) => {
  const { 
    userProfile, 
    updateUserProfile, 
    allocateSavings, 
    primaryCurrency,
    accounts,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    triggerMonthlyRollover,
    showToast
  } = useTransactions();

  // Personal Details states
  const [fullName, setFullName] = useState(userProfile.fullName || 'Vadthya Mahi');
  const [jobTitle, setJobTitle] = useState(userProfile.jobTitle || 'Senior Software Developer');
  const [phoneNumber, setPhoneNumber] = useState(userProfile.phoneNumber || '+1 (555) 234-5678');
  const [email, setEmail] = useState(userProfile.email || 'mahi@expenso.dev');
  const [avatar, setAvatar] = useState(userProfile.avatar || '💻');

  // Form states for budget
  const [monthlyIncome, setMonthlyIncome] = useState(userProfile.monthlyIncome.toString());
  const [monthlyLimit, setMonthlyLimit] = useState(userProfile.monthlyLimit.toString());
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Allocation states
  const [allocations, setAllocations] = useState<Record<string, string>>({});

  // New Goal Form states
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [goalPriority, setGoalPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [goalColor, setGoalColor] = useState('#00F5FF');

  // Editing state for Savings Goals
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  // New Bank Account states
  const [newAccName, setNewAccName] = useState('');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [newAccType, setNewAccType] = useState<'Savings' | 'Current' | 'Wallet'>('Savings');
  const [newAccAlertLimit, setNewAccAlertLimit] = useState('');

  // Editing state for Bank Accounts
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  // Inline Validation Error states
  const [accNameError, setAccNameError] = useState('');
  const [goalDateError, setGoalDateError] = useState('');
  const [incomeError, setIncomeError] = useState('');
  const [limitError, setLimitError] = useState('');
  const [emailError, setEmailError] = useState('');
  
  // Confirmation Modal states
  const [isConfirmDeleteGoalOpen, setIsConfirmDeleteGoalOpen] = useState(false);
  const [goalToDeleteId, setGoalToDeleteId] = useState<string | null>(null);

  const [isConfirmDeleteAccOpen, setIsConfirmDeleteAccOpen] = useState(false);
  const [accToDeleteId, setAccToDeleteId] = useState<string | null>(null);

  const [isConfirmRolloverOpen, setIsConfirmRolloverOpen] = useState(false);

  // Security Toggles
  const [pinLockEnabled, setPinLockEnabled] = useState(() => {
    return localStorage.getItem('expenso_security_pin_enabled') !== 'false';
  });
  const [sessionTimeout, setSessionTimeout] = useState(() => {
    return localStorage.getItem('expenso_security_timeout') || '5';
  });
  const [biometricEnabled, setBiometricEnabled] = useState(() => {
    return localStorage.getItem('expenso_security_biometric_enabled') === 'true';
  });

  // Notification Toggles
  const [budgetAlerts, setBudgetAlerts] = useState(() => {
    return localStorage.getItem('expenso_notif_budget_alerts') !== 'false';
  });
  const [goalAlerts, setGoalAlerts] = useState(() => {
    return localStorage.getItem('expenso_notif_goal_alerts') !== 'false';
  });
  const [monthlyReports, setMonthlyReports] = useState(() => {
    return localStorage.getItem('expenso_notif_monthly_reports') !== 'false';
  });
  const [emailNotifications, setEmailNotifications] = useState(() => {
    return localStorage.getItem('expenso_notif_email_notifications') === 'true';
  });

  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('expenso_theme') || 'Dark Mode';
  });
  const [selectedLang, setSelectedLang] = useState(() => {
    return localStorage.getItem('expenso_language') || 'English';
  });

  // Persist security settings
  React.useEffect(() => {
    localStorage.setItem('expenso_security_pin_enabled', pinLockEnabled.toString());
  }, [pinLockEnabled]);

  React.useEffect(() => {
    localStorage.setItem('expenso_security_timeout', sessionTimeout);
  }, [sessionTimeout]);

  React.useEffect(() => {
    localStorage.setItem('expenso_security_biometric_enabled', biometricEnabled.toString());
  }, [biometricEnabled]);

  // Persist notification settings
  React.useEffect(() => {
    localStorage.setItem('expenso_notif_budget_alerts', budgetAlerts.toString());
  }, [budgetAlerts]);

  React.useEffect(() => {
    localStorage.setItem('expenso_notif_goal_alerts', goalAlerts.toString());
  }, [goalAlerts]);

  React.useEffect(() => {
    localStorage.setItem('expenso_notif_monthly_reports', monthlyReports.toString());
  }, [monthlyReports]);

  React.useEffect(() => {
    localStorage.setItem('expenso_notif_email_notifications', emailNotifications.toString());
  }, [emailNotifications]);

  React.useEffect(() => {
    localStorage.setItem('expenso_theme', themeMode);
  }, [themeMode]);

  React.useEffect(() => {
    localStorage.setItem('expenso_language', selectedLang);
  }, [selectedLang]);

  const handleChangePin = () => {
    const newPin = prompt("Enter new 4-digit security PIN:");
    if (newPin === null) return;
    if (/^\d{4}$/.test(newPin)) {
      localStorage.setItem('expenso_security_pin', newPin);
      showToast("Security PIN updated successfully!", "success");
    } else {
      showToast("Invalid PIN! Must be exactly 4 digits.", "error");
    }
  };

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    updateUserProfile({
      fullName,
      jobTitle,
      phoneNumber,
      email,
      avatar
    });
    showToast("Profile details updated successfully!", "success");
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIncomeError('');
    setLimitError('');

    const incomeVal = parseFloat(monthlyIncome);
    const limitVal = parseFloat(monthlyLimit);

    if (isNaN(incomeVal) || incomeVal <= 0) {
      setIncomeError("Please enter a valid monthly income greater than 0.");
      return;
    }

    if (isNaN(limitVal) || limitVal < 0) {
      setLimitError("Budget limit cannot be negative.");
      return;
    }

    updateUserProfile({
      monthlyIncome: incomeVal,
      monthlyLimit: limitVal,
    });
    setProfileSuccess(true);
    showToast("Budget limits updated successfully!", "success");
    setTimeout(() => setProfileSuccess(false), 2500);
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setAccNameError('');

    const balanceVal = parseFloat(newAccBalance);
    const alertLimitVal = parseFloat(newAccAlertLimit);

    // Duplicate check
    const nameExists = accounts.some(
      a => a.id !== editingAccountId && a.accountName.toLowerCase() === newAccName.trim().toLowerCase()
    );
    if (nameExists) {
      setAccNameError("An account with this name already exists.");
      return;
    }

    if (balanceVal < 0 || alertLimitVal < 0) {
      setAccNameError("Balance and Alert Limit cannot be negative.");
      return;
    }

    if (editingAccountId) {
      // Edit account
      updateBankAccount(editingAccountId, {
        accountName: newAccName.trim(),
        balance: balanceVal,
        accountType: newAccType,
        lowBalanceAlertLimit: alertLimitVal
      });
      setEditingAccountId(null);
    } else {
      // Create new
      addBankAccount({
        accountName: newAccName.trim(),
        balance: balanceVal,
        accountType: newAccType,
        lowBalanceAlertLimit: alertLimitVal
      });
    }

    // Reset Form
    setNewAccName('');
    setNewAccBalance('');
    setNewAccType('Savings');
    setNewAccAlertLimit('');
  };

  const handleAllocate = (goalId: string) => {
    const amountStr = allocations[goalId];
    const amount = parseFloat(amountStr);
    if (!isNaN(amount) && amount > 0) {
      allocateSavings(goalId, amount);
      setAllocations(prev => ({ ...prev, [goalId]: '' }));
    }
  };

  const handleEditGoalClick = (goal: any) => {
    setEditingGoalId(goal.id);
    setGoalName(goal.name);
    setGoalTarget(goal.target.toString());
    setGoalDate(goal.targetDate);
    setGoalPriority(goal.priority);
    setGoalColor(goal.color);
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    setGoalDateError('');
    const targetVal = parseFloat(goalTarget);

    if (targetVal <= 0) {
      showToast("Target amount must be greater than 0.", "error");
      return;
    }

    // Date must be in the future
    if (new Date(goalDate) <= new Date()) {
      setGoalDateError("Target date must be a future date.");
      return;
    }

    if (editingGoalId) {
      updateSavingsGoal(editingGoalId, {
        name: goalName.trim(),
        target: targetVal,
        targetDate: goalDate,
        priority: goalPriority,
        color: goalColor,
      });
      setEditingGoalId(null);
    } else {
      addSavingsGoal({
        name: goalName.trim(),
        target: targetVal,
        current: 0,
        targetDate: goalDate,
        priority: goalPriority,
        color: goalColor,
      });
    }

    // Reset Form
    setGoalName('');
    setGoalTarget('');
    setGoalDate('');
    setGoalPriority('Medium');
  };

  const handleDeleteGoalClick = (goalId: string) => {
    setGoalToDeleteId(goalId);
    setIsConfirmDeleteGoalOpen(true);
  };

  const handleConfirmDeleteGoal = () => {
    if (goalToDeleteId) {
      deleteSavingsGoal(goalToDeleteId);
      setGoalToDeleteId(null);
    }
  };

  const handleBankAccountDeleteClick = (id: string) => {
    setAccToDeleteId(id);
    setIsConfirmDeleteAccOpen(true);
  };

  const handleConfirmDeleteAcc = () => {
    if (accToDeleteId) {
      deleteBankAccount(accToDeleteId);
      setAccToDeleteId(null);
    }
  };

  const handleConfirmRollover = () => {
    triggerMonthlyRollover();
  };

  const formatCurrency = (val: number) => {
    return currencyService.format(val, primaryCurrency);
  };

  const calculateDaysRemaining = (dateStr: string) => {
    const target = new Date(dateStr);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} Days` : 'Overdue';
  };

  const colorPresets = ['#00F5FF', '#39FF14', '#BD00FF', '#FF8A00', '#FF2D55'];

  // Check if budget limit exceeds monthly income
  const isBudgetWarning = parseFloat(monthlyLimit) > parseFloat(monthlyIncome);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Column 1: Compact Profile & Settings Cards */}
      <div className="space-y-6">
        
        {/* Compact User Profile */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-5 shadow-xl flex flex-col gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-xl shadow-lg shadow-primary/15 select-none shrink-0 font-sans">
              {avatar}
            </div>
            <div className="min-w-0">
              <h3 className="text-white text-sm font-black truncate font-sans">{fullName}</h3>
              <p className="text-text-muted text-[9px] uppercase font-bold tracking-wider font-sans">
                {jobTitle}
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveDetails} className="space-y-3 pt-3 border-t border-white/5">
            {emailError && (
              <span className="text-red-500 text-[9px] font-semibold block font-sans">{emailError}</span>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-text-muted text-[8px] uppercase font-bold tracking-wider block mb-1 font-sans">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-black/20 border border-white/8 rounded-xl px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-white/15 transition-all font-sans"
                  required
                />
              </div>
              <div>
                <label className="text-text-muted text-[8px] uppercase font-bold tracking-wider block mb-1 font-sans">Job Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-black/20 border border-white/8 rounded-xl px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-white/15 transition-all font-sans"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-text-muted text-[8px] uppercase font-bold tracking-wider block mb-1 font-sans">Phone Number</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-black/20 border border-white/8 rounded-xl px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-white/15 transition-all font-sans"
                  required
                />
              </div>
              <div>
                <label className="text-text-muted text-[8px] uppercase font-bold tracking-wider block mb-1 font-sans">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/20 border border-white/8 rounded-xl px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-white/15 transition-all font-sans"
                  required
                />
              </div>
            </div>

            {/* Avatar Emoji Selector */}
            <div>
              <label className="text-text-muted text-[8px] uppercase font-bold tracking-wider block mb-1.5 font-sans">Choose Avatar</label>
              <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
                {['💻', '🚀', '🦊', '👾', '🦄', '⚡', '🤖', '💰', '🎯', '🧠'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatar(emoji)}
                    className={`text-sm p-1 rounded-lg border transition-all cursor-pointer ${
                      avatar === emoji ? 'border-primary bg-primary/10' : 'border-white/5 bg-black/20 hover:bg-white/5'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-[10px] border border-white/8 transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 font-sans"
            >
              <Save size={12} />
              <span>Save Details</span>
            </button>
          </form>
        </motion.div>

        {/* Security Settings Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass rounded-3xl p-5 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <Lock className="text-secondary" size={14} />
            <h4 className="text-white text-xs font-bold uppercase tracking-wider font-sans">Security Settings</h4>
          </div>

          <div className="space-y-3 text-xs font-sans">
            <div className="flex items-center justify-between">
              <span className="text-text-muted font-medium">PIN Lock (Session-based)</span>
              <button
                type="button"
                onClick={() => setPinLockEnabled(!pinLockEnabled)}
                className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                  pinLockEnabled ? 'bg-primary' : 'bg-white/10'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-[#09090A] absolute top-0.5 transition-all ${
                  pinLockEnabled ? 'right-0.5' : 'left-0.5'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-text-muted font-medium">Biometric Lock</span>
              {typeof window !== 'undefined' && (window as any).PublicKeyCredential ? (
                <button
                  type="button"
                  onClick={() => setBiometricEnabled(!biometricEnabled)}
                  className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                    biometricEnabled ? 'bg-primary' : 'bg-white/10'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-[#09090A] absolute top-0.5 transition-all ${
                    biometricEnabled ? 'right-0.5' : 'left-0.5'
                  }`} />
                </button>
              ) : (
                <span className="text-secondary text-[9px] font-bold uppercase tracking-wider">Coming Soon</span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-text-muted font-medium">Session Timeout</span>
              <select
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="bg-black/20 border border-white/8 rounded-lg px-2 py-0.5 text-xxs text-white outline-none"
              >
                <option value="1">1 min</option>
                <option value="5">5 min</option>
                <option value="15">15 min</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleChangePin}
              className="w-full py-1.5 rounded-lg bg-white/3 hover:bg-white/8 border border-white/5 text-white font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer font-sans text-center mt-1"
            >
              Change Security PIN
            </button>
          </div>
        </motion.div>

        {/* Notifications & Personalization Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="glass rounded-3xl p-5 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <Bell className="text-primary" size={14} />
            <h4 className="text-white text-xs font-bold uppercase tracking-wider font-sans">Notifications & Preferences</h4>
          </div>

          <div className="space-y-3.5 text-xs font-sans">
            <div className="flex items-center justify-between">
              <span className="text-text-muted font-medium">Budget Warnings (&gt;85%)</span>
              <button
                onClick={() => setBudgetAlerts(!budgetAlerts)}
                className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                  budgetAlerts ? 'bg-primary' : 'bg-white/10'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-[#09090A] absolute top-0.5 transition-all ${
                  budgetAlerts ? 'right-0.5' : 'left-0.5'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-text-muted font-medium">Goal Completion Alerts</span>
              <button
                onClick={() => setGoalAlerts(!goalAlerts)}
                className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                  goalAlerts ? 'bg-primary' : 'bg-white/10'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-[#09090A] absolute top-0.5 transition-all ${
                  goalAlerts ? 'right-0.5' : 'left-0.5'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-text-muted font-medium">Email Analytics Reports</span>
              <button
                type="button"
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                  emailNotifications ? 'bg-primary' : 'bg-white/10'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-[#09090A] absolute top-0.5 transition-all ${
                  emailNotifications ? 'right-0.5' : 'left-0.5'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-text-muted font-medium">Monthly Digest Reports</span>
              <button
                type="button"
                onClick={() => setMonthlyReports(!monthlyReports)}
                className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                  monthlyReports ? 'bg-primary' : 'bg-white/10'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-[#09090A] absolute top-0.5 transition-all ${
                  monthlyReports ? 'right-0.5' : 'left-0.5'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-text-muted font-medium">Visual Theme</span>
              <select
                value={themeMode}
                onChange={(e) => setThemeMode(e.target.value)}
                className="bg-black/20 border border-white/8 rounded-lg px-2 py-0.5 text-xxs text-white outline-none"
              >
                <option value="Dark Mode">Cyber Dark</option>
                <option value="Light Mode">Vapor Light</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-text-muted font-medium">System Language</span>
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="bg-black/20 border border-white/8 rounded-lg px-2 py-0.5 text-xxs text-white outline-none"
              >
                <option value="English">English</option>
                <option value="Spanish">Español</option>
                <option value="Hindi">हिन्दी</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Rollover History Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-3xl p-5 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-primary" size={14} />
            <h4 className="text-white text-xs font-bold uppercase tracking-wider font-sans">Rollover History</h4>
          </div>

          <div className="space-y-2.5 max-h-[150px] overflow-y-auto pr-1">
            {(() => {
              const history = JSON.parse(localStorage.getItem('expenso_rollover_history') || '[]');
              if (history.length === 0) {
                return (
                  <p className="text-text-muted text-[10px] italic font-sans text-center py-4">
                    No rollover events recorded yet.
                  </p>
                );
              }
              return history.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center text-[11px] font-sans p-2 bg-white/2 rounded-xl border border-white/5">
                  <div>
                    <span className="text-white font-bold block">{item.month}</span>
                    <span className="text-text-muted text-[9px]">To: {item.targetGoal}</span>
                  </div>
                  <span className="text-primary font-extrabold">{formatCurrency(item.amount)}</span>
                </div>
              ));
            })()}
          </div>
        </motion.div>

      </div>

      {/* Column 2: Profile & Budget Form + Bank Accounts Cards */}
      <div className="space-y-6">
        
        {/* Budget Config Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass rounded-3xl p-6 shadow-xl h-fit"
        >
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="text-primary" size={16} />
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider font-sans">Budget Configuration</h3>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {/* Warning Banner */}
            {isBudgetWarning && (
              <div className="bg-red-500/10 border border-red-500/25 p-3 rounded-2xl flex items-start gap-2 text-red-400 text-[10px] leading-relaxed font-sans font-semibold animate-pulse">
                <span>⚠️ Warning: Budget cap exceeds monthly income. Optimize savings to avoid liquidity drain.</span>
              </div>
            )}

            <div>
              <label className="text-text-muted text-[10px] uppercase font-bold tracking-wider block mb-1.5 font-sans">
                Primary Monthly Income
              </label>
              <div className="relative flex items-center bg-black/20 border border-white/8 rounded-xl px-3 py-2">
                <DollarSign size={12} className="text-text-muted mr-1" />
                <input
                  type="number"
                  min="0"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  className="bg-transparent text-white text-xs outline-none border-none w-full font-sans"
                  required
                />
              </div>
              {incomeError && (
                <span className="text-red-500 text-[9px] font-semibold mt-1 block font-sans">{incomeError}</span>
              )}
            </div>

            <div>
              <label className="text-text-muted text-[10px] uppercase font-bold tracking-wider block mb-1.5 font-sans">
                Global Monthly Budget Cap
              </label>
              <div className="relative flex items-center bg-black/20 border border-white/8 rounded-xl px-3 py-2">
                <ShieldAlert size={12} className="text-text-muted mr-1" />
                <input
                  type="number"
                  min="0"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  className="bg-transparent text-white text-xs outline-none border-none w-full font-sans"
                  required
                />
              </div>
              {limitError && (
                <span className="text-red-500 text-[9px] font-semibold mt-1 block font-sans">{limitError}</span>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/8 transition-all duration-150 cursor-pointer font-sans"
            >
              Save Configuration
            </button>

            <button
              type="button"
              onClick={() => setIsConfirmRolloverOpen(true)}
              className="w-full mt-2 py-2.5 rounded-xl bg-accent/15 hover:bg-accent/25 text-accent font-bold text-xs border border-accent/20 transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 font-sans"
            >
              <TrendingUp size={12} />
              <span>Trigger Month Rollover</span>
            </button>

            {profileSuccess && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-primary text-[10px] text-center font-bold uppercase tracking-wider mt-2 font-sans"
              >
                Profile settings updated successfully!
              </motion.p>
            )}
          </form>
        </motion.div>

        {/* Bank Accounts & Wallets Management Panel */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="glass rounded-3xl p-6 shadow-xl h-fit"
        >
          <div className="flex items-center gap-2 mb-4">
            <Coins className="text-secondary" size={16} />
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider font-sans">Liquidity Nodes Manager</h3>
          </div>

          {/* Connected accounts rendered as premium cards */}
          {accounts.length === 0 ? (
            <div className="py-6 flex flex-col items-center justify-center text-center">
              <div className="text-2xl mb-1.5 animate-pulse">🏦</div>
              <p className="text-text-muted text-[10px] font-semibold font-sans">No bank nodes connected.</p>
              <p className="text-text-muted text-[8px] mt-0.5 font-sans">Connect your first bank account to manage liquidity.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 mb-5">
              {accounts.map(acc => {
                const isLow = acc.balance < acc.lowBalanceAlertLimit;
                return (
                  <div 
                    key={acc.id} 
                    className={`p-4 rounded-2xl bg-gradient-to-br from-white/3 to-white/6 border transition-all duration-300 relative overflow-hidden ${
                      isLow ? 'border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.05)]' : 'border-white/5'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[7.5px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-text-muted font-bold uppercase tracking-wider font-sans">
                          {acc.accountType}
                        </span>
                        <h4 className="text-white text-sm font-black mt-1.5 font-sans">{acc.accountName}</h4>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAccountId(acc.id);
                            setNewAccName(acc.accountName);
                            setNewAccBalance(acc.balance.toString());
                            setNewAccType(acc.accountType);
                            setNewAccAlertLimit(acc.lowBalanceAlertLimit.toString());
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/8 text-text-muted hover:text-white transition-all cursor-pointer"
                          title="Edit Account"
                        >
                          <Edit2 size={10} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBankAccountDeleteClick(acc.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                          title="Remove Node"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-end mt-4">
                      <div>
                        <span className="text-[7.5px] text-text-muted font-bold uppercase tracking-wider block font-sans">Available Balance</span>
                        <span className={`text-base font-black font-sans ${isLow ? 'text-orange-400' : 'text-white'}`}>
                          {formatCurrency(acc.balance)}
                        </span>
                      </div>
                      <div className="text-right text-[8px] text-text-muted font-sans">
                        Alert Limit: <span className="text-white font-bold">{formatCurrency(acc.lowBalanceAlertLimit)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Form to add/edit account */}
          <form onSubmit={handleCreateAccount} className="space-y-3.5 border-t border-white/5 pt-4">
            <span className="text-text-muted text-[8px] font-bold uppercase tracking-wider block font-sans">
              {editingAccountId ? 'Edit Bank Node' : 'Add Bank Node'}
            </span>
            
            {accNameError && (
              <span className="text-red-500 text-[9px] font-semibold block font-sans">{accNameError}</span>
            )}

            <div>
              <label className="text-text-muted text-[9px] uppercase font-bold tracking-wider block mb-1 font-sans">Account Name</label>
              <input
                type="text"
                placeholder="e.g. SBI Bank, HDFC, Cash"
                value={newAccName}
                onChange={(e) => setNewAccName(e.target.value)}
                className="w-full bg-black/20 border border-white/8 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/15 transition-all duration-150 font-sans"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-text-muted text-[9px] uppercase font-bold tracking-wider block mb-1 font-sans">Opening Balance</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={newAccBalance}
                  onChange={(e) => setNewAccBalance(e.target.value)}
                  className="w-full bg-black/20 border border-white/8 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/15 transition-all duration-150 font-sans"
                  required
                />
              </div>
              <div>
                <label className="text-text-muted text-[9px] uppercase font-bold tracking-wider block mb-1 font-sans">Account Type</label>
                <select
                  value={newAccType}
                  onChange={(e) => setNewAccType(e.target.value as any)}
                  className="w-full bg-black/20 border border-white/8 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/15 transition-all duration-150 font-sans"
                >
                  <option value="Savings">Savings</option>
                  <option value="Current">Current</option>
                  <option value="Wallet">Wallet</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-text-muted text-[9px] uppercase font-bold tracking-wider block mb-1 font-sans">Low Balance Threshold</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 1000"
                value={newAccAlertLimit}
                onChange={(e) => setNewAccAlertLimit(e.target.value)}
                className="w-full bg-black/20 border border-white/8 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/15 transition-all duration-150 font-sans"
                required
              />
            </div>

            <div className="flex gap-2">
              {editingAccountId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingAccountId(null);
                    setNewAccName('');
                    setNewAccBalance('');
                    setNewAccType('Savings');
                    setNewAccAlertLimit('');
                  }}
                  className="w-1/3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/8 cursor-pointer font-sans"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-gradient-to-tr from-primary to-secondary text-black font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all duration-150 cursor-pointer font-sans"
              >
                {editingAccountId ? 'Save Changes' : 'Add Bank Node'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Column 3: Savings Goals Workspace */}
      <div className="space-y-6">
        
        {/* Active Goals Ledger */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-3xl p-6 shadow-xl"
        >
          <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4 font-sans">Active Saving Enclaves</h3>

          {userProfile.savingsGoals.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-text-muted text-xs font-semibold font-sans">No savings goals.</p>
              <p className="text-text-muted text-[8px] mt-0.5 font-sans">Start saving today by creating your first goal.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userProfile.savingsGoals.map((goal) => {
                const percent = Math.round((goal.current / goal.target) * 100);
                const daysLeft = calculateDaysRemaining(goal.targetDate);
                
                return (
                  <div 
                    key={goal.id}
                    className="p-3 bg-white/2 border border-white/5 rounded-2xl flex flex-col gap-3 hover:bg-white/4 transition-colors duration-150"
                  >
                    {/* Goal Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: goal.color }} />
                        <h4 className="text-white text-xs font-bold truncate flex-1 font-sans">{goal.name}</h4>
                        {goal.current >= goal.target ? (
                          <span className="text-[7px] px-1.5 py-0.2 rounded font-black uppercase font-sans bg-primary/10 text-primary border border-primary/20 shadow-[0_0_6px_#00F5FF30]">
                            Completed
                          </span>
                        ) : (
                          <span className={`text-[7px] px-1.5 py-0.2 rounded font-black uppercase font-sans ${
                            goal.priority === 'High' 
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                              : goal.priority === 'Medium'
                                ? 'bg-secondary/10 text-secondary border border-secondary/20'
                                : 'bg-white/5 text-text-muted border border-white/10'
                          }`}>
                            {goal.priority}
                          </span>
                        )}
                      </div>
                      
                      {/* Detailed Progress Grid */}
                      <div className="grid grid-cols-2 gap-2 mt-2.5 text-[8.5px] text-text-muted font-bold font-sans">
                        <div>
                          <span>Saved:</span>
                          <span className="text-white block mt-0.5">{formatCurrency(goal.current)} / {formatCurrency(goal.target)}</span>
                        </div>
                        <div>
                          <span>Days Remaining:</span>
                          <span className="text-white block mt-0.5">{daysLeft}</span>
                        </div>
                        <div>
                          <span>Progress:</span>
                          <span className="text-primary block mt-0.5">{percent}%</span>
                        </div>
                        <div>
                          <span>Target Date:</span>
                          <span className="text-white block mt-0.5">{new Date(goal.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>

                      {/* Goal Progress Bar */}
                      <div className="w-full h-1.5 bg-white/5 rounded-full mt-2.5 overflow-hidden">
                        <div 
                          className="h-full rounded-full" 
                          style={{ 
                            width: `${Math.min(100, percent)}%`, 
                            backgroundColor: goal.color,
                            boxShadow: `0 0 6px ${goal.color}80`
                          }} 
                        />
                      </div>
                    </div>

                    {/* Funding and Delete actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      <div className="flex bg-black/20 border border-white/8 rounded-xl p-0.5 items-center flex-1">
                        <input
                          type="number"
                          min="0"
                          placeholder="Fund Amount"
                          value={allocations[goal.id] || ''}
                          onChange={(e) => setAllocations(prev => ({ ...prev, [goal.id]: e.target.value }))}
                          className="bg-transparent text-white text-[10px] outline-none border-none px-2 w-full font-sans"
                        />
                        <button
                          onClick={() => handleAllocate(goal.id)}
                          className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-[9px] font-bold cursor-pointer transition-colors duration-150 font-sans"
                        >
                          Fund
                        </button>
                      </div>

                      <button
                        onClick={() => handleEditGoalClick(goal)}
                        className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/8 transition-all duration-150 cursor-pointer"
                        title="Edit Goal"
                      >
                        <Edit2 size={10} />
                      </button>

                      <button
                        onClick={() => handleDeleteGoalClick(goal.id)}
                        className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all duration-150 cursor-pointer"
                        title="Delete Goal"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Goal Creator */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-3xl p-6 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <Plus className="text-secondary" size={16} />
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider font-sans">
              {editingGoalId ? 'Modify Enclave' : 'Initialize Savings'}
            </h3>
          </div>

          <form onSubmit={handleAddGoal} className="space-y-4">
            {goalDateError && (
              <span className="text-red-500 text-[9px] font-semibold block font-sans">{goalDateError}</span>
            )}

            <div>
              <label className="text-text-muted text-[10px] uppercase font-bold tracking-wider block mb-1.5 font-sans">Goal Title</label>
              <input
                type="text"
                placeholder="e.g. Tech Upgrade, Emergency"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                className="w-full bg-black/20 border border-white/8 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/15 transition-all duration-150 font-sans"
                required
              />
            </div>

            <div>
              <label className="text-text-muted text-[10px] uppercase font-bold tracking-wider block mb-1.5 font-sans">Target Amount</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 5000"
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                className="w-full bg-black/20 border border-white/8 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/15 transition-all duration-150 font-sans"
                required
              />
            </div>

            <div>
              <label className="text-text-muted text-[10px] uppercase font-bold tracking-wider block mb-1.5 font-sans">Target Date</label>
              <input
                type="date"
                value={goalDate}
                onChange={(e) => setGoalDate(e.target.value)}
                className="w-full bg-black/20 border border-white/8 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/15 transition-all duration-150 font-sans"
                required
              />
            </div>

            <div>
              <label className="text-text-muted text-[10px] uppercase font-bold tracking-wider block mb-1.5 font-sans">Priority Horizon</label>
              <select
                value={goalPriority}
                onChange={(e) => setGoalPriority(e.target.value as any)}
                className="w-full bg-black/20 border border-white/8 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/15 transition-all duration-150 font-sans"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-[10px] uppercase font-bold tracking-wider font-sans">Color Tag:</span>
                <div className="flex gap-1.5">
                  {colorPresets.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setGoalColor(preset)}
                      className={`w-4 h-4 rounded-full border transition-all duration-150 cursor-pointer ${
                        goalColor === preset ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: preset }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                {editingGoalId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingGoalId(null);
                      setGoalName('');
                      setGoalTarget('');
                      setGoalDate('');
                      setGoalPriority('Medium');
                    }}
                    className="w-1/3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/8 cursor-pointer font-sans"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-gradient-to-tr from-primary to-secondary text-black font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all duration-150 cursor-pointer font-sans"
                >
                  {editingGoalId ? 'Save Changes' : 'Initialize Enclave'}
                </button>
              </div>
            </div>

          </form>
        </motion.div>

      </div>

      {/* Goal Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmDeleteGoalOpen}
        onClose={() => setIsConfirmDeleteGoalOpen(false)}
        onConfirm={handleConfirmDeleteGoal}
        title="Delete Savings Goal"
        description="Are you sure you want to delete this savings goal? Outstanding savings allocations will be returned."
        confirmLabel="Delete"
      />

      {/* Bank Account Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmDeleteAccOpen}
        onClose={() => setIsConfirmDeleteAccOpen(false)}
        onConfirm={handleConfirmDeleteAcc}
        title="Remove Bank Node"
        description="Are you sure you want to remove this bank account? All associated transaction links will lose their node connection."
        confirmLabel="Remove"
      />

      {/* Rollover Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmRolloverOpen}
        onClose={() => setIsConfirmRolloverOpen(false)}
        onConfirm={handleConfirmRollover}
        title="Trigger Month Rollover"
        description="Are you sure you want to trigger month rollover? This will sweep the unspent budget surplus of all categories directly into your primary savings enclave."
        confirmLabel="Rollover"
      />

    </div>
  );
};

export default VaultView;
