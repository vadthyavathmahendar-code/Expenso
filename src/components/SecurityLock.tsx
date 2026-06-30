import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ShieldAlert, Asterisk } from 'lucide-react';

interface SecurityLockProps {
  children: React.ReactNode;
}

const CORRECT_PIN = '1234';
const IDLE_TIMEOUT_MS = 300000; // 5 minutes in milliseconds

export const SecurityLock: React.FC<SecurityLockProps> = ({ children }) => {
  const [isLocked, setIsLocked] = useState(() => {
    const isPinEnabled = localStorage.getItem('expenso_security_pin_enabled') !== 'false';
    if (!isPinEnabled) return false;
    const isUnlocked = sessionStorage.getItem('expenso_session_unlocked');
    return isUnlocked !== 'true';
  });
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const resetTimer = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    
    const isPinEnabled = localStorage.getItem('expenso_security_pin_enabled') !== 'false';
    if (!isPinEnabled) return;

    // Only start the timer if the screen is not already locked
    if (!isLocked) {
      const timeoutMin = parseFloat(localStorage.getItem('expenso_security_timeout') || '5');
      const timeoutMs = timeoutMin * 60 * 1000;
      
      timeoutRef.current = window.setTimeout(() => {
        setIsLocked(true);
      }, timeoutMs);
    }
  };

  useEffect(() => {
    const isPinEnabled = localStorage.getItem('expenso_security_pin_enabled') !== 'false';
    if (!isPinEnabled) {
      setIsLocked(false);
      return;
    }

    // Event listeners to detect user activity
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Start initial timer
    resetTimer();

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isLocked]);

  const handleKeyPress = (num: string) => {
    if (pin.length >= 4) return;
    setError(false);
    const newPin = pin + num;
    setPin(newPin);

    const correctPin = localStorage.getItem('expenso_security_pin') || '1234';

    if (newPin === correctPin) {
      setTimeout(() => {
        sessionStorage.setItem('expenso_session_unlocked', 'true');
        setIsLocked(false);
        setPin('');
        setError(false);
      }, 300);
    } else if (newPin.length === 4) {
      // Wrong PIN entered
      setTimeout(() => {
        setError(true);
        setPin('');
      }, 300);
    }
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  return (
    <>
      {/* Main Content */}
      <div className={isLocked ? "filter blur-md pointer-events-none select-none transition-all duration-500" : "transition-all duration-500"}>
        {children}
      </div>

      {/* Lock Screen Overlay */}
      <AnimatePresence>
        {isLocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-background/95 backdrop-blur-2xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="glass rounded-3xl p-8 max-w-sm w-full border border-white/8 shadow-2xl flex flex-col items-center"
            >
              {/* Lock Icon Header */}
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 animate-pulse">
                <Lock className="text-red-400" size={22} />
              </div>

              <h2 className="text-white text-lg font-bold">Terminal Locked</h2>
              <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest mt-1">
                Inactivity Protection Active
              </p>

              {/* Pin Display */}
              <div className="flex gap-4 my-6 justify-center">
                {[0, 1, 2, 3].map((idx) => {
                  const hasDigit = pin.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-200 ${
                        error 
                          ? 'border-red-500 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                          : hasDigit 
                            ? 'border-primary bg-primary/10 shadow-[0_0_10px_rgba(57,255,20,0.2)]' 
                            : 'border-white/8 bg-black/20'
                      }`}
                    >
                      {hasDigit && (
                        <Asterisk className={error ? "text-red-400" : "text-primary"} size={16} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Hint */}
              <p className="text-[10px] text-text-muted mb-6 flex items-center gap-1">
                <ShieldAlert size={12} className="text-secondary" />
                <span>Enter PIN to unlock</span>
              </p>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleKeyPress(num)}
                    className="h-12 rounded-xl bg-white/3 border border-white/5 hover:bg-white/8 active:scale-95 text-white font-bold text-sm transition-all duration-150 cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={handleClear}
                  className="h-12 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-xxs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer"
                >
                  Clear
                </button>
                <button
                  onClick={() => handleKeyPress('0')}
                  className="h-12 rounded-xl bg-white/3 border border-white/5 hover:bg-white/8 active:scale-95 text-white font-bold text-sm transition-all duration-150 cursor-pointer"
                >
                  0
                </button>
                <div className="h-12 flex items-center justify-center text-text-muted text-xxs opacity-40 font-bold">
                  EXP
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SecurityLock;
