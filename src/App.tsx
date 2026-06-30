import { useEffect, useState } from 'react';
import { TransactionProvider } from './context/TransactionContext';
import { dbAuth } from './services/dbService';
import Auth from './views/Auth';
import Dashboard from './views/Dashboard';
import MahiSidebar from './components/MahiSidebar';
import SecurityLock from './components/SecurityLock';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isMahiOpen, setIsMahiOpen] = useState(false);

  // Listen to Auth Changes
  useEffect(() => {
    const unsubscribe = dbAuth.onAuthStateChange((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#09090A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <TransactionProvider>
      <div className="relative min-h-screen bg-[#09090A] text-white selection:bg-accent/30 selection:text-white overflow-x-hidden">
        
        {/* Auth / Dashboard Router */}
        {!user ? (
          <Auth onAuthSuccess={(loggedUser) => setUser(loggedUser)} />
        ) : (
          <SecurityLock>
            <main className="relative z-10">
              <Dashboard 
                user={user}
                onLogout={() => setUser(null)} 
                onToggleMahi={() => setIsMahiOpen(!isMahiOpen)}
                isMahiOpen={isMahiOpen}
              />
            </main>
            
            {/* Sliding AI Sidebar */}
            <MahiSidebar isOpen={isMahiOpen} onClose={() => setIsMahiOpen(false)} />
          </SecurityLock>
        )}

      </div>
    </TransactionProvider>
  );
}
