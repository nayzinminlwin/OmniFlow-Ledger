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
import { Check } from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];

  const { 
    user, 
    profile,
    isAuthReady, 
    handleGoogleLogin,
    handleLogout, 
    error: authError, 
    setError: setAuthError,
    success: authSuccess,
    setSuccess: setAuthSuccess,
    requestSent,
    setRequestSent,
    isUltimateAdmin
  } = useAuth(lang);
  
  const isApproved = profile?.status === 'approved' || isUltimateAdmin;

  const { stock, batches, transactions, loading, error: invError, setError: setInvError } = useInventory(user, isAuthReady, lang, isApproved);
  const { 
    handleAddTransaction, 
    handleRenameBatch, 
    isSubmitting, 
    isRenaming, 
    error: actionError, 
    setError: setActionError,
    success: actionSuccess,
    setSuccess: setActionSuccess
  } = useTransactionActions(user, stock, lang);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'add' | 'batches' | 'users'>('dashboard');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [newBatchName, setNewBatchName] = useState('');

  const error = authError || invError || actionError;
  const setError = (err: string | null) => {
    setAuthError(err);
    setInvError(err);
    setActionError(err);
  };

  const success = authSuccess || actionSuccess;
  const setSuccess = (msg: string | null) => {
    setAuthSuccess(msg);
    setActionSuccess(msg);
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
    if (requestSent) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel p-10 rounded-[2.5rem] text-center">
            <div className="w-20 h-20 bg-green-500 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
              <Check className="text-white w-10 h-10" />
            </div>
            <h1 className="text-3xl font-semibold text-[var(--color-ios-text)] mb-4 tracking-tight">{t.requestSentTitle}</h1>
            <p className="text-[var(--color-ios-text-secondary)] font-medium leading-relaxed mb-8">
              {t.requestSentMessage}
            </p>
            <button
              onClick={() => setRequestSent(false)}
              className="w-full py-4 px-6 bg-[var(--color-ios-blue)] text-white rounded-2xl text-[16px] font-bold hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
            >
              {t.backToLogin}
            </button>
          </div>
        </div>
      );
    }

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
          
          <div className="space-y-6">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white border border-gray-200 rounded-2xl text-[16px] font-bold text-gray-700 hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
              {t.loginWithGoogle || 'Sign in with Google'}
            </button>

            <p className="text-center text-[13px] font-medium text-gray-500 leading-relaxed">
              {t.pendingApprovalNotice || 'New accounts require approval from the Ultimate Admin before access is granted.'}
            </p>
          </div>
          
          <p className="mt-12 text-center text-xs font-medium text-[var(--color-ios-text-secondary)] uppercase tracking-widest">
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
      >
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} t={t} isUltimateAdmin={isUltimateAdmin} />

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
