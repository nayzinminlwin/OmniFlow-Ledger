import React, { useState, useEffect } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { translations, Language } from "./translations";

// Hooks
import { useAuth } from "./hooks/useAuth";
import { useInventory } from "./hooks/useInventory";
import { useTransactionActions } from "./hooks/useTransactionActions";

// Components
import { Layout } from "./components/Layout";
import { Navigation } from "./components/Navigation";
import { Dashboard } from "./components/Dashboard";
import { History } from "./components/History";
import { AddTransaction } from "./components/AddTransaction";
import { Batches } from "./components/Batches";
import { UpdateComponents } from "./components/UpdateComponents";
import { ComponentInventory } from "./components/ComponentInventory";
import { UserManagement } from "./components/UserManagement";
import { RenameBatchModal } from "./components/RenameBatchModal";
import { Batch } from "./types";
import { Check } from "lucide-react";
import { Toaster, toast } from "sonner";

export default function App() {
  const [lang, setLang] = useState<Language>("en");
  const t = translations[lang];

  const {
    user,
    profile,
    isAuthReady,
    isLoggingIn,
    handleGoogleLogin,
    handleLogout,
    error: authError,
    setError: setAuthError,
    success: authSuccess,
    setSuccess: setAuthSuccess,
    requestSent,
    setRequestSent,
    isUltimateAdmin,
    isOriginalAdmin,
  } = useAuth(lang);

  const isApproved = profile?.status === "approved" || isUltimateAdmin;

  const {
    stock,
    componentStock,
    spoiledComponentStock,
    batches,
    transactions,
    componentTransactions,
    users,
    loading,
    error: invError,
    setError: setInvError,
  } = useInventory(user, isAuthReady, lang, isApproved);
  const {
    handleAddTransaction,
    handleRenameBatch,
    handleDeleteBatch,
    handleUndoTransaction,
    isSubmitting,
    isRenaming,
  } = useTransactionActions(user, lang);

  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "history"
    | "add"
    | "components"
    | "componentInventory"
    | "batches"
    | "users"
  >("dashboard");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [newBatchName, setNewBatchName] = useState("");

  useEffect(() => {
    if (!selectedBatchId && batches.length > 0) {
      setSelectedBatchId(batches[0].batchId);
    }
  }, [batches, selectedBatchId]);

  const error = authError || invError;
  const setError = (err: string | null) => {
    setAuthError(err);
    setInvError(err);
  };

  const success = authSuccess;
  const setSuccess = (msg: string | null) => {
    setAuthSuccess(msg);
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      toast.success(success);
      setSuccess(null);
    }
  }, [success]);

  if (!isAuthReady || isLoggingIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center glass-panel p-8 rounded-[2rem]">
          <div className="w-12 h-12 border-4 border-[var(--color-ios-blue)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--color-ios-text)] font-medium tracking-tight">
            {isLoggingIn ? t.processing : t.initLedger}
          </p>
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
            <h1 className="text-3xl font-semibold text-[var(--color-ios-text)] mb-4 tracking-tight">
              {t.requestSentTitle}
            </h1>
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
              <span className="text-white text-3xl font-semibold tracking-tight">
                OF
              </span>
            </div>
            <h1 className="text-3xl font-semibold text-[var(--color-ios-text)] mb-3 tracking-tight">
              {t.brand}
            </h1>
            <p className="text-[var(--color-ios-text-secondary)] font-medium leading-relaxed px-4">
              {t.subtitle}
            </p>
          </div>

          <div className="space-y-6">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white border border-gray-200 rounded-2xl text-[16px] font-bold text-gray-700 hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                className="w-6 h-6"
                alt="Google"
              />
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
    <ErrorBoundary>
      <Layout
        user={user}
        t={t}
        lang={lang}
        setLang={setLang}
        handleLogout={handleLogout}
        setActiveTab={setActiveTab}
      >
        <Navigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          t={t}
          isUltimateAdmin={isUltimateAdmin}
        />

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
            users={users}
            t={t}
            activeTab={activeTab}
            loading={loading}
            onUndo={handleUndoTransaction}
            currentUserProfile={profile}
          />

          <AddTransaction
            t={t}
            activeTab={activeTab}
            onAddTransaction={handleAddTransaction}
            batches={batches}
            isSubmitting={isSubmitting}
          />

          <UpdateComponents
            stock={stock}
            componentStock={componentStock}
            batches={batches}
            t={t}
            lang={lang}
            activeTab={activeTab}
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
            handleRenameBatch={() =>
              handleRenameBatch(
                editingBatch,
                newBatchName,
                selectedBatchId,
                setSelectedBatchId,
              )
            }
            isRenaming={isRenaming}
            t={t}
          />
        )}

        <Toaster 
          position="bottom-center" 
          toastOptions={{
            classNames: {
              toast: "glass-panel !rounded-[2rem] !px-6 !py-5 !shadow-2xl !text-gray-900 !font-medium !text-[16px] !bg-white/60 !border-white/60",
              icon: "!w-6 !h-6",
              success: "!text-emerald-600",
              error: "!text-red-600",
              actionButton: "!bg-gray-900 hover:!bg-gray-800 !text-white !border-0 transition-colors !rounded-xl !px-4 !py-2 !font-semibold",
              cancelButton: "!bg-black/5 hover:!bg-black/10 !text-gray-900 !border-0 transition-colors !rounded-xl !px-4 !py-2 !font-semibold",
            }
          }} 
        />
      </Layout>
    </ErrorBoundary>
  );
}
