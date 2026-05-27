import React, { useCallback } from 'react';

// Hooks
import { useAppLogic } from './hooks/useAppLogic';

// Components
import { Layout } from './components/Layout';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { History } from './components/History';
import { AddTransaction } from './components/AddTransaction';
import { Batches } from './components/Batches';
import { UpdateComponents } from './components/UpdateComponents';
import { ComponentInventory } from './components/ComponentInventory';
import { UserManagement } from './components/UserManagement';
import { RenameBatchModal } from './components/RenameBatchModal';
import { Toast } from './components/Toast';
import { Check } from 'lucide-react';
import { Toaster } from 'sonner';

export default function App() {
  const {
    lang,
    setLang,
    t,
    user,
    profile,
    isAuthReady,
    isLoggingIn,
    handleGoogleLogin,
    handleLogout,
    requestSent,
    setRequestSent,
    isUltimateAdmin,
    isOriginalAdmin,
    isAdmin,
    stock,
    componentStock,
    spoiledComponentStock,
    batches,
    transactions,
    componentTransactions,
    users,
    loading,
    handleAddTransaction,
    handleRenameBatch,
    handleDeleteBatch,
    handleUndoTransaction,
    isSubmitting,
    isRenaming,
    activeTab,
    setActiveTab,
    selectedBatchId,
    setSelectedBatchId,
    editingBatch,
    setEditingBatch,
    newBatchName,
    setNewBatchName,
    error,
    setError,
    success,
    setSuccess
  } = useAppLogic();

  const closeError = useCallback(() => setError(null), [setError]);
  const closeSuccess = useCallback(() => setSuccess(null), [setSuccess]);

  if (!isAuthReady || isLoggingIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center glass-panel p-8 rounded-[2rem]">
          <div className="w-12 h-12 border-4 border-[var(--color-ios-blue)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--color-ios-text)] font-medium tracking-tight">{isLoggingIn ? t.processing : t.initLedger}</p>
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
              <span className="text-white text-3xl font-semibold tracking-tight">OF</span>
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
              {t.loginWithGoogle}
            </button>
 
            <p className="text-center text-[13px] font-medium text-gray-500 leading-relaxed">
              {t.pendingApprovalNotice}
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
    <Layout
      user={user}
      t={t}
      lang={lang}
      setLang={setLang}
      handleLogout={handleLogout}
      setActiveTab={setActiveTab}
    >
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} t={t} isUltimateAdmin={isUltimateAdmin} isAdmin={isAdmin} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Dashboard 
          stock={stock} 
          componentStock={componentStock}
          batches={batches}
          transactions={transactions} 
          t={t} 
          setActiveTab={setActiveTab}
          activeTab={activeTab}
          loading={loading}
          isAdmin={isAdmin}
          onAddTransaction={handleAddTransaction}
          currentUserProfile={profile}
        />

        <History 
          transactions={transactions} 
          batches={batches}
          componentStock={componentStock}
          users={users}
          t={t} 
          activeTab={activeTab} 
          loading={loading}
          onUndo={handleUndoTransaction}
          currentUserProfile={profile}
          isAdmin={isAdmin}
        />

        <AddTransaction 
          t={t}
          activeTab={activeTab}
          onAddTransaction={handleAddTransaction}
          batches={batches}
          isSubmitting={isSubmitting}
          isAdmin={isAdmin}
        />

        <UpdateComponents
          stock={stock}
          componentStock={componentStock}
          batches={batches}
          t={t}
          lang={lang}
          activeTab={activeTab}
          isAdmin={isAdmin}
        />

        <ComponentInventory
          componentStock={componentStock}
          spoiledComponentStock={spoiledComponentStock}
          componentTransactions={componentTransactions}
          users={users}
          t={t}
          activeTab={activeTab}
        />

        <Batches 
          batches={batches}
          selectedBatchId={selectedBatchId}
          setSelectedBatchId={setSelectedBatchId}
          setEditingBatch={setEditingBatch}
          setNewBatchName={setNewBatchName}
          onDeleteBatch={handleDeleteBatch}
          t={t}
          activeTab={activeTab}
          loading={loading}
          isAdmin={isAdmin}
        />

        <UserManagement 
          t={t}
          activeTab={activeTab}
          isOriginalAdmin={isOriginalAdmin}
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
        onClose={closeError} 
        t={t}
      />
      <Toast 
        message={success} 
        type="success" 
        onClose={closeSuccess} 
        t={t}
      />
      <Toaster position="top-center" />
    </Layout>
  );
}
