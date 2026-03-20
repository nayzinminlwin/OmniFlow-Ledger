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
import { RenameBatchModal } from './components/RenameBatchModal';
import { Toast } from './components/Toast';
import { Batch } from './types';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];

  const { user, isAuthReady, handleLogin, handleLogout, error: authError, setError: setAuthError } = useAuth(lang);
  const { stock, batches, transactions, loading, error: invError, setError: setInvError } = useInventory(user, isAuthReady, lang);
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

  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'add' | 'batches'>('dashboard');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [newBatchName, setNewBatchName] = useState('');

  const error = authError || invError || actionError;
  const setError = (err: string | null) => {
    setAuthError(err);
    setInvError(err);
    setActionError(err);
  };

  if (!isAuthReady || (user && loading)) {
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
          
          <button
            onClick={handleLogin}
            className="ios-button w-full flex items-center justify-center gap-3"
          >
            <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">G</span>
            </span>
            {t.signIn}
          </button>
          
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
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} t={t} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Dashboard 
            stock={stock} 
            transactions={transactions} 
            t={t} 
            setActiveTab={setActiveTab}
            activeTab={activeTab}
          />

          <History 
            transactions={transactions} 
            t={t} 
            activeTab={activeTab} 
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
