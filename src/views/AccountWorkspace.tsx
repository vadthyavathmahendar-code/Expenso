import React, { useState } from 'react';
import { useTransactions, type SavingsGoal } from '../context/TransactionContext';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  DollarSign, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  TrendingUp, 
  Calendar,
  Save
} from 'lucide-react';
import { currencyService } from '../services/currency';

interface AccountWorkspaceProps {
  user: any;
}

export const AccountWorkspace: React.FC<AccountWorkspaceProps> = ({ user }) => {
  const { userProfile, updateUserProfile, allocateSavings, primaryCurrency } = useTransactions();

  // Personal Details states
  const [fullName, setFullName] = useState(() => {
    return localStorage.getItem('expenso_user_name') || 'Vadthya Mahi';
  });
  const [jobTitle, setJobTitle] = useState(() => {
    return localStorage.getItem('expenso_user_job') || 'Senior Software Developer';
  });
  const [phoneNumber, setPhoneNumber] = useState(() => {
    return localStorage.getItem('expenso_user_phone') || '+1 (555) 234-5678';
  });
  const [detailsSuccess, setDetailsSuccess] = useState(false);

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

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('expenso_user_name', fullName);
    localStorage.setItem('expenso_user_job', jobTitle);
    localStorage.setItem('expenso_user_phone', phoneNumber);
    setDetailsSuccess(true);
    setTimeout(() => setDetailsSuccess(false), 2500);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const incomeVal = parseFloat(monthlyIncome);
    const limitVal = parseFloat(monthlyLimit);

    if (!isNaN(incomeVal) && !isNaN(limitVal)) {
      updateUserProfile({
        monthlyIncome: incomeVal,
        monthlyLimit: limitVal,
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2500);
    }
  };

  const handleAllocate = (goalId: string) => {
    const amountStr = allocations[goalId];
    const amount = parseFloat(amountStr);
    if (!isNaN(amount) && amount > 0) {
      allocateSavings(goalId, amount);
      setAllocations(prev => ({ ...prev, [goalId]: '' }));
    }
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const targetVal = parseFloat(goalTarget);

    if (goalName.trim() && !isNaN(targetVal) && targetVal > 0 && goalDate) {
      const newGoal: SavingsGoal = {
        id: Math.random().toString(36).substring(2, 9),
        name: goalName.trim(),
        target: targetVal,
        current: 0,
        targetDate: goalDate,
        priority: goalPriority,
        color: goalColor,
      };

      updateUserProfile({
        savingsGoals: [...userProfile.savingsGoals, newGoal],
      });

      // Reset form
      setGoalName('');
      setGoalTarget('');
      setGoalDate('');
      setGoalPriority('Medium');
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    const updatedGoals = userProfile.savingsGoals.filter(g => g.id !== goalId);
    updateUserProfile({ savingsGoals: updatedGoals });
  };

  const formatCurrency = (val: number) => {
    return currencyService.format(val, primaryCurrency);
  };

  // Get Initials for Avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const colorPresets = ['#00F5FF', '#39FF14', '#BD00FF', '#FF8A00', '#FF2D55'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Column 1: User Profile Details Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 shadow-xl h-fit flex flex-col items-center"
      >
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-black text-2xl font-black shadow-lg shadow-primary/20 mb-4 select-none">
          {getInitials(fullName) || 'VM'}
        </div>

        <h3 className="text-white text-base font-black truncate max-w-full">{fullName}</h3>
        <p className="text-text-muted text-xxs uppercase font-bold tracking-widest mt-1 mb-6">
          {jobTitle}
        </p>

        <form onSubmit={handleSaveDetails} className="w-full space-y-4 border-t border-white/5 pt-5">
          <div>
            <label className="text-text-muted text-[10px] uppercase font-bold tracking-wider block mb-1.5">Full Name</label>
            <div className="relative flex items-center bg-black/20 border border-white/8 rounded-xl px-3 py-2">
              <User size={12} className="text-text-muted mr-1.5" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-transparent text-white text-xs outline-none border-none w-full"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-text-muted text-[10px] uppercase font-bold tracking-wider block mb-1.5">Email Address</label>
            <div className="relative flex items-center bg-white/3 border border-white/5 rounded-xl px-3 py-2 opacity-60">
              <Mail size={12} className="text-text-muted mr-1.5" />
              <input
                type="email"
                value={user?.email || 'mahi@expenso.dev'}
                disabled
                className="bg-transparent text-text-muted text-xs outline-none border-none w-full cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="text-text-muted text-[10px] uppercase font-bold tracking-wider block mb-1.5">Job Title</label>
            <div className="relative flex items-center bg-black/20 border border-white/8 rounded-xl px-3 py-2">
              <Briefcase size={12} className="text-text-muted mr-1.5" />
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="bg-transparent text-white text-xs outline-none border-none w-full"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-text-muted text-[10px] uppercase font-bold tracking-wider block mb-1.5">Phone Number</label>
            <div className="relative flex items-center bg-black/20 border border-white/8 rounded-xl px-3 py-2">
              <Phone size={12} className="text-text-muted mr-1.5" />
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="bg-transparent text-white text-xs outline-none border-none w-full"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/8 transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Save size={12} />
            <span>Save Details</span>
          </button>

          {detailsSuccess && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-primary text-[10px] text-center font-bold uppercase tracking-wider mt-2"
            >
              Personal details updated!
            </motion.p>
          )}
        </form>
      </motion.div>

      {/* Column 2: Profile & Budget Form */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass rounded-3xl p-6 shadow-xl h-fit"
      >
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="text-primary" size={16} />
          <h3 className="text-white text-sm font-semibold uppercase tracking-wider">Budget Configuration</h3>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="text-text-muted text-[10px] uppercase font-bold tracking-wider block mb-1.5">
              Primary Monthly Income
            </label>
            <div className="relative flex items-center bg-black/20 border border-white/8 rounded-xl px-3 py-2">
              <DollarSign size={12} className="text-text-muted mr-1" />
              <input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                className="bg-transparent text-white text-xs outline-none border-none w-full"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-text-muted text-[10px] uppercase font-bold tracking-wider block mb-1.5">
              Global Monthly Budget Cap
            </label>
            <div className="relative flex items-center bg-black/20 border border-white/8 rounded-xl px-3 py-2">
              <ShieldAlert size={12} className="text-text-muted mr-1" />
              <input
                type="number"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                className="bg-transparent text-white text-xs outline-none border-none w-full"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/8 transition-all duration-150 cursor-pointer"
          >
            Save Configuration
          </button>

          {profileSuccess && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-primary text-[10px] text-center font-bold uppercase tracking-wider mt-2"
            >
              Profile settings updated successfully!
            </motion.p>
          )}
        </form>
      </motion.div>

      {/* Column 3: Savings Goals Workspace */}
      <div className="space-y-6">
        
        {/* Active Goals Ledger */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-3xl p-6 shadow-xl"
        >
          <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Active Saving Enclaves</h3>

          {userProfile.savingsGoals.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-text-muted text-xs">No active savings goals found. Create one below!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userProfile.savingsGoals.map((goal) => {
                const percent = Math.round((goal.current / goal.target) * 100);
                return (
                  <div 
                    key={goal.id}
                    className="p-3 bg-white/2 border border-white/5 rounded-2xl flex flex-col gap-3 hover:bg-white/4 transition-colors duration-150"
                  >
                    {/* Goal Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: goal.color }} />
                        <h4 className="text-white text-xs font-bold truncate flex-1">{goal.name}</h4>
                        <span className={`text-[7px] px-1 py-0.2 rounded font-black uppercase ${
                          goal.priority === 'High' 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                            : goal.priority === 'Medium'
                              ? 'bg-secondary/10 text-secondary border border-secondary/20'
                              : 'bg-white/5 text-text-muted border border-white/10'
                        }`}>
                          {goal.priority}
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-1 mt-1.5">
                        <span className="text-text-muted text-[8px] font-semibold flex items-center gap-1">
                          <TrendingUp size={8} />
                          {formatCurrency(goal.current)} / {formatCurrency(goal.target)} ({percent}%)
                        </span>
                        <span className="text-text-muted text-[8px] font-semibold flex items-center gap-1">
                          <Calendar size={8} />
                          {goal.targetDate}
                        </span>
                      </div>
                    </div>

                    {/* Funding and Delete actions */}
                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                      <div className="flex bg-black/20 border border-white/8 rounded-xl p-0.5 items-center flex-1">
                        <input
                          type="number"
                          placeholder="Amount"
                          value={allocations[goal.id] || ''}
                          onChange={(e) => setAllocations(prev => ({ ...prev, [goal.id]: e.target.value }))}
                          className="bg-transparent text-white text-xxs outline-none border-none px-2 w-full"
                        />
                        <button
                          onClick={() => handleAllocate(goal.id)}
                          className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xxs font-bold cursor-pointer transition-colors duration-150"
                        >
                          Fund
                        </button>
                      </div>

                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
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
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider">Initialize Savings</h3>
          </div>

          <form onSubmit={handleAddGoal} className="space-y-4">
            <div>
              <label className="text-text-muted text-[10px] uppercase font-bold tracking-wider block mb-1.5">Goal Title</label>
              <input
                type="text"
                placeholder="e.g. Tech Upgrade, Emergency"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                className="w-full bg-black/20 border border-white/8 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/15 transition-all duration-150"
                required
              />
            </div>

            <div>
              <label className="text-text-muted text-[10px] uppercase font-bold tracking-wider block mb-1.5">Target Amount</label>
              <input
                type="number"
                placeholder="e.g. 5000"
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                className="w-full bg-black/20 border border-white/8 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/15 transition-all duration-150"
                required
              />
            </div>

            <div>
              <label className="text-text-muted text-[10px] uppercase font-bold tracking-wider block mb-1.5">Target Date</label>
              <input
                type="date"
                value={goalDate}
                onChange={(e) => setGoalDate(e.target.value)}
                className="w-full bg-black/20 border border-white/8 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/15 transition-all duration-150"
                required
              />
            </div>

            <div>
              <label className="text-text-muted text-[10px] uppercase font-bold tracking-wider block mb-1.5">Priority Horizon</label>
              <select
                value={goalPriority}
                onChange={(e) => setGoalPriority(e.target.value as any)}
                className="w-full bg-black/20 border border-white/8 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/15 transition-all duration-150"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Color Tag:</span>
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

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-gradient-to-tr from-primary to-secondary text-black font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all duration-150 cursor-pointer"
              >
                Initialize Enclave
              </button>
            </div>

          </form>
        </motion.div>

      </div>

    </div>
  );
};

export default AccountWorkspace;
