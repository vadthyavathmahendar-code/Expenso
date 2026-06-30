import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { dbAuth } from '../services/dbService';
import { Sparkles, Mail, Lock, ArrowRight } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: (user: any) => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);

    try {
      let user;
      if (isLogin) {
        user = await dbAuth.signIn(email, password);
      } else {
        user = await dbAuth.signUp(email, password);
      }
      onAuthSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-background">
      
      {/* Background ambient radial glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full opacity-10 bg-accent blur-[120px] animate-glow-breathing" style={{ animationDelay: '0ms' }} />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full opacity-10 bg-secondary blur-[120px] animate-glow-breathing" style={{ animationDelay: '3s' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-[420px]"
      >
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 mb-4">
            <Sparkles className="text-black" size={26} strokeWidth={2.5} />
          </div>
          <h1 className="text-white text-2xl font-black tracking-tight">Expenso</h1>
          <p className="text-text-muted text-xs mt-1 font-semibold uppercase tracking-wider">AI Wealth Terminal</p>
        </div>

        {/* Auth Form Card */}
        <div className="glass rounded-3xl p-8 shadow-2xl relative">
          <h2 className="text-white text-lg font-bold mb-6">
            {isLogin ? 'Access Terminal' : 'Initialize Account'}
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
              <p className="text-red-400 text-[11px] text-center font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-text-muted text-[10px] font-bold uppercase tracking-wider block mb-1.5">
                Email Address
              </label>
              <div 
                className="flex items-center bg-black/20 border rounded-xl px-4 py-3"
                style={{ 
                  borderColor: emailFocused ? '#39FF14' : 'rgba(255,255,255,0.08)',
                  boxShadow: emailFocused ? '0 0 15px rgba(57, 255, 20, 0.05)' : 'none'
                }}
              >
                <Mail className={`mr-3 ${emailFocused ? 'text-primary' : 'text-text-muted'}`} size={16} />
                <input
                  type="email"
                  placeholder="developer@secretpay.ai"
                  className="flex-1 bg-transparent text-white text-sm outline-none border-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-text-muted text-[10px] font-bold uppercase tracking-wider block mb-1.5">
                Password
              </label>
              <div 
                className="flex items-center bg-black/20 border rounded-xl px-4 py-3"
                style={{ 
                  borderColor: passwordFocused ? '#39FF14' : 'rgba(255,255,255,0.08)',
                  boxShadow: passwordFocused ? '0 0 15px rgba(57, 255, 20, 0.05)' : 'none'
                }}
              >
                <Lock className={`mr-3 ${passwordFocused ? 'text-primary' : 'text-text-muted'}`} size={16} />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="flex-1 bg-transparent text-white text-sm outline-none border-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3.5 rounded-xl bg-gradient-to-tr from-primary to-secondary text-black font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/10 hover:brightness-110 active:scale-[0.99] transition-all duration-150"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'Access System' : 'Compile Account'}</span>
                  <ArrowRight size={16} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Toggle Login / Signup */}
        <div className="text-center mt-6">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-text-muted hover:text-white text-xs transition-colors duration-150 cursor-pointer"
          >
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span className="text-primary font-semibold">{isLogin ? 'Sign Up' : 'Log In'}</span>
          </button>
        </div>

      </motion.div>
    </div>
  );
};

export default Auth;
