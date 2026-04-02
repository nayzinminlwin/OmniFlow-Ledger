import { useState, useEffect, useCallback } from 'react';
import { Language, translations } from '../translations';
import { useAuth } from './useAuth';
import { useInventory } from './useInventory';
import { useTransactionActions } from './useTransactionActions';
import { Batch } from '../types';

export const useAppLogic = () => {
  const [lang, setLang] = useState<Language>('en');
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
    isOriginalAdmin
  } = useAuth(lang);
  
  const isApproved = profile?.status === 'approved' || isUltimateAdmin;

  const { stock, componentStock, spoiledComponentStock, batches, transactions, componentTransactions, users, loading, error: invError, setError: setInvError } = useInventory(user, isAuthReady, lang, isApproved);
  const { 
    handleAddTransaction, 
    handleRenameBatch, 
    handleDeleteBatch,
    handleUndoTransaction,
    isSubmitting, 
    isRenaming, 
    error: actionError, 
    setError: setActionError,
    success: actionSuccess,
    setSuccess: setActionSuccess
  } = useTransactionActions(user, lang);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'add' | 'components' | 'componentInventory' | 'batches' | 'users'>('dashboard');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [newBatchName, setNewBatchName] = useState('');

  // Clear errors and successes when switching tabs or language
  useEffect(() => {
    setAuthError(null);
    setInvError(null);
    setActionError(null);
    setAuthSuccess(null);
    setActionSuccess(null);
  }, [activeTab, lang, setAuthError, setInvError, setActionError, setAuthSuccess, setActionSuccess]);

  useEffect(() => {
    if (!selectedBatchId && batches.length > 0) {
      setSelectedBatchId(batches[0].batchId);
    }
  }, [batches, selectedBatchId]);

  const error = authError || invError || actionError;
  const setError = useCallback((err: string | null) => {
    setAuthError(err);
    setInvError(err);
    setActionError(err);
  }, [setAuthError, setInvError, setActionError]);

  const success = authSuccess || actionSuccess;
  const setSuccess = useCallback((msg: string | null) => {
    setAuthSuccess(msg);
    setActionSuccess(msg);
  }, [setAuthSuccess, setActionSuccess]);

  return {
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
    isAdmin: isUltimateAdmin || isOriginalAdmin,
    isApproved,
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
  };
};
