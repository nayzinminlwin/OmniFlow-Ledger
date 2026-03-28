import React, { useState } from 'react';
import { Batch } from '../types';
import { isValidBatchDate, formatBatchId, padBatchId } from '../lib/dateUtils';

interface UseRenameBatchModalLogicProps {
  t: any;
  editingBatch: Batch | null;
  newBatchName: string;
  setNewBatchName: (name: string) => void;
  handleRenameBatch: () => Promise<void>;
}

export const useRenameBatchModalLogic = ({
  t,
  editingBatch,
  newBatchName,
  setNewBatchName,
  handleRenameBatch,
}: UseRenameBatchModalLogicProps) => {
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewBatchName(formatBatchId(e.target.value, newBatchName));
  };

  const handleInputBlur = () => {
    setNewBatchName(padBatchId(newBatchName));
  };

  const onConfirmRename = () => {
    const finalName = padBatchId(newBatchName);
    if (!isValidBatchDate(finalName)) {
      setError(t.invalidBatchDate);
      return;
    }
    handleRenameBatch();
  };

  return {
    error,
    setError,
    handleInputChange,
    handleInputBlur,
    onConfirmRename
  };
};
