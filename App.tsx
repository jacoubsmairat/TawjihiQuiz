
import React, { useState, useEffect } from 'react';
import { DatabaseProvider } from './store/DatabaseContext';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import ExamRunner from './components/ExamRunner';
import { User, AuthState } from './types';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'landing' | 'auth' | 'dashboard' | 'exam'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false
  });
  
  // For exam state
  const [examConfig, setExamConfig] = useState<any>(null);

  useEffect(() => {
    const savedAuth = sessionStorage.getItem('tq_auth');
    if (savedAuth) {
      setAuthState(JSON.parse(savedAuth));
      setCurrentPage('dashboard');
    }
  }, []);

  const handleLogin = (user: User) => {
    const state = { user, isAuthenticated: true };
    setAuthState(state);
    sessionStorage.setItem('tq_auth', JSON.stringify(state));
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setAuthState({ user: null, isAuthenticated: false });
    sessionStorage.removeItem('tq_auth');
    setCurrentPage('landing');
  };

  const startExam = (config: any) => {
    setExamConfig(config);
    setCurrentPage('exam');
  };

  return (
    <DatabaseProvider>
      <div className="min-h-screen bg-background font-sans">
        {currentPage === 'landing' && (
          <LandingPage 
            onLogin={() => { setAuthMode('login'); setCurrentPage('auth'); }}
            onRegister={() => { setAuthMode('register'); setCurrentPage('auth'); }}
          />
        )}
        
        {currentPage === 'auth' && (
          <Auth 
            mode={authMode} 
            onToggleMode={() => setAuthMode(m => m === 'login' ? 'register' : 'login')}
            onSuccess={handleLogin}
            onBack={() => setCurrentPage('landing')}
          />
        )}
        
        {currentPage === 'dashboard' && authState.user && (
          <Dashboard 
            user={authState.user} 
            onLogout={handleLogout} 
            onStartExam={startExam}
          />
        )}

        {currentPage === 'exam' && authState.user && examConfig && (
          <ExamRunner 
            user={authState.user}
            config={examConfig}
            onFinish={() => setCurrentPage('dashboard')}
          />
        )}
      </div>
    </DatabaseProvider>
  );
};

export default App;
