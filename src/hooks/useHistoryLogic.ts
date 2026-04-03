import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Transaction, UserProfile, Batch, ComponentStock } from '../types';

interface UseHistoryLogicProps {
  transactions: Transaction[];
  t: any;
  onUndo: (transactionId: string, currentUserProfile: UserProfile | null) => Promise<boolean | undefined>;
  currentUserProfile: UserProfile | null;
}

export const useHistoryLogic = ({
  transactions,
  t,
  onUndo,
  currentUserProfile
}: UseHistoryLogicProps) => {
  const [hoveredTxId, setHoveredTxId] = useState<string | null>(null);
  const [popupConfig, setPopupConfig] = useState<{ top: number, left: number, showAbove: boolean, tx: Transaction } | null>(null);
  const [undoingTxId, setUndoingTxId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (hoveredTxId) {
        setHoveredTxId(null);
        setPopupConfig(null);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [hoveredTxId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (hoveredTxId && !target.closest('.breakdown-trigger') && !target.closest('.breakdown-popup')) {
        setHoveredTxId(null);
        setPopupConfig(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [hoveredTxId]);

  const safeFormatDate = (dateStr: string | undefined, formatStr: string) => {
    if (!dateStr) return t.na;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return t.invalidDate;
    return format(d, formatStr);
  };

  const getClassName = (cls?: string) => cls === 'Spoiled' ? t.spoiled : cls;

  const handleUndo = async (txId: string) => {
    if (txId) {
      setUndoingTxId(txId);
      await onUndo(txId, currentUserProfile);
      setUndoingTxId(null);
    }
  };

  const togglePopup = (tx: Transaction, txUniqueId: string, index: number, event: React.MouseEvent) => {
    if (hoveredTxId === txUniqueId) {
      setHoveredTxId(null);
      setPopupConfig(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      let left = rect.left + (rect.width / 2) - 128;
      
      const padding = 20;
      if (left < padding) left = padding;
      if (left + 256 > window.innerWidth - padding) left = window.innerWidth - 256 - padding;

      // Determine if there's enough space below (approx 300px for a large popup)
      const spaceBelow = window.innerHeight - rect.bottom;
      const showAbove = spaceBelow < 300 && rect.top > 300;

      setHoveredTxId(txUniqueId);
      setPopupConfig({
        top: rect.top,
        left: left,
        showAbove: showAbove,
        tx: tx
      });
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      (tx.brand || '').toLowerCase().includes(search) ||
      (tx.series || '').toLowerCase().includes(search) ||
      (tx.model || '').toLowerCase().includes(search) ||
      (tx.batchId || '').toLowerCase().includes(search) ||
      (tx.type || '').toLowerCase().includes(search) ||
      (tx.notes || '').toLowerCase().includes(search)
    );
  });

  return {
    hoveredTxId,
    popupConfig,
    undoingTxId,
    searchTerm,
    setSearchTerm,
    filteredTransactions,
    scrollContainerRef,
    safeFormatDate,
    getClassName,
    handleUndo,
    togglePopup,
    setHoveredTxId,
    setPopupConfig
  };
};
