import React, { useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { translations, Language } from './translations';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useInventory } from './hooks/useInventory';
import { useTransactionActions } from './hooks/useTransactionActions';

// Components
import { Layout } from './components/Layout';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { History } from './components/History';
import { AddTransaction } from './components/AddTransaction';
import { Batches } from './components/Batches';
import { UserManagement } from './components/UserManagement';
import { RenameBatchModal } from './components/RenameBatchModal';
import { Toast } from './components/Toast';
import { Batch } from './types';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];

  const { 
    user, 
    profile,
    isAuthReady, 
    handleLogin, 
    handleSignUp,
    handleGoogleLogin,
    handleLogout, 
    error: authError, 
    setError: setAuthError,
    isMotherAdmin
  } = useAuth(lang);
  
  const isApproved = profile?.status === 'approved' || isMotherAdmin;

  const { stock, batches, transactions, loading, error: invError, setError: setInvError } = useInventory(user, isAuthReady, lang, isApproved);
  const { 
    handleAddTransaction, 
    handleRenameBatch, 
    isSubmitting, 
    isRenaming, 
    error: actionError, 
    setError: setActionError,
    success,
    setSuccess
  } = useTransactionActions(user, stock, lang);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'add' | 'batches' | 'users'>('dashboard');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [newBatchName, setNewBatchName] = useState('');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const error = authError || invError || actionError;
  const setError = (err: string | null) => {
    setAuthError(err);
    setInvError(err);
    setActionError(err);
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center glass-panel p-8 rounded-[2rem]">
          <div className="w-12 h-12 border-4 border-[var(--color-ios-blue)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--color-ios-text)] font-medium tracking-tight">{t.initLedger}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel p-10 rounded-[2.5rem]">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-[var(--color-ios-blue)] rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
              <span className="text-white text-3xl font-semibold tracking-tight">RL</span>
            </div>
            <h1 className="text-3xl font-semibold text-[var(--color-ios-text)] mb-3 tracking-tight">{t.brand}</h1>
            <p className="text-[var(--color-ios-text-secondary)] font-medium leading-relaxed px-4">{t.subtitle}</p>
          </div>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (isSignUp) {
                handleSignUp(username, password);
              } else {
                handleLogin(username, password);
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-[13px] font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">
                {t.username}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="ios-input w-full"
                placeholder="e.g. admin"
                required
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">
                {t.password}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="ios-input w-full"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className="ios-button w-full mt-6"
            >
              {isSignUp ? t.signUp : t.login}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[13px] font-bold text-[var(--color-ios-blue)] hover:underline"
            >
              {isSignUp ? t.hasAccount : t.noAccount}
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-black/5">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-gray-200 rounded-2xl text-[14px] font-bold text-gray-700 hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              Sign in with Google
            </button>
          </div>
          
          <p className="mt-8 text-center text-xs font-medium text-[var(--color-ios-text-secondary)] uppercase tracking-widest">
            {t.authOnly}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Layout
        user={user}
        t={t}
        lang={lang}
        setLang={setLang}
        handleLogout={handleLogout}
        handleLogin={handleLogin}
      >
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} t={t} isMotherAdmin={isMotherAdmin} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Dashboard 
            stock={stock} 
            batches={batches}
            transactions={transactions} 
            t={t} 
            setActiveTab={setActiveTab}
            activeTab={activeTab}
            loading={loading}
          />

          <History 
            transactions={transactions} 
            t={t} 
            activeTab={activeTab} 
            loading={loading}
          />

          <AddTransaction 
            t={t}
            activeTab={activeTab}
            onAddTransaction={handleAddTransaction}
            batches={batches}
            isSubmitting={isSubmitting}
          />

          <Batches 
            batches={batches}
            selectedBatchId={selectedBatchId}
            setSelectedBatchId={setSelectedBatchId}
            setEditingBatch={setEditingBatch}
            setNewBatchName={setNewBatchName}
            t={t}
            activeTab={activeTab}
            loading={loading}
          />

          <UserManagement 
            t={t}
            activeTab={activeTab}
          />
        </div>

        {editingBatch && (
          <RenameBatchModal 
            editingBatch={editingBatch}
            setEditingBatch={setEditingBatch}
            newBatchName={newBatchName}
            setNewBatchName={setNewBatchName}
            handleRenameBatch={() => handleRenameBatch(editingBatch, newBatchName, selectedBatchId, setSelectedBatchId)}
            isRenaming={isRenaming}
            t={t}
          />
        )}

        <Toast 
          message={error} 
          type="error" 
          onClose={() => setError(null)} 
        />
        <Toast 
          message={success} 
          type="success" 
          onClose={() => setSuccess(null)} 
        />
      </Layout>
    </ErrorBoundary>
  );
}
