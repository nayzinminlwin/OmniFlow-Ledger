import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Batch, LaptopClass } from '../types';
import { CLASSES } from '../constants';

interface UseBatchesLogicProps {
  batches: Batch[];
  t: any;
  onDeleteBatch: (batchId: string, setSelectedBatchId: (id: string) => void) => Promise<boolean>;
  setSelectedBatchId: (id: string) => void;
}

export const useBatchesLogic = ({
  batches,
  t,
  onDeleteBatch,
  setSelectedBatchId
}: UseBatchesLogicProps) => {
  const [sortField, setSortField] = useState<'batchId' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const safeFormatDate = (dateStr: string | undefined, formatStr: string) => {
    if (!dateStr) return t.na;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return t.invalidDate;
    return format(d, formatStr);
  };

  const sortedBatches = useMemo(() => {
    return [...batches].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'batchId') {
        comparison = (a.batchId || '').localeCompare(b.batchId || '');
      } else {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        comparison = (isNaN(dateA) ? 0 : dateA) - (isNaN(dateB) ? 0 : dateB);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [batches, sortField, sortOrder]);

  const getColumnTotal = (models: any[], cls: LaptopClass) => {
    return models.reduce((sum, m) => sum + (m?.counts?.[cls] || 0), 0);
  };

  const getRowTotal = (counts: Record<LaptopClass, number>) => {
    if (!counts) return 0;
    return Object.values(counts).reduce((sum, count) => sum + (count || 0), 0);
  };

  const getClassifiedRowTotal = (counts: Record<LaptopClass, number>) => {
    if (!counts) return 0;
    return CLASSES.reduce((sum, cls) => sum + (counts[cls] || 0), 0);
  };

  const getBatchTotal = (batch: Batch, cls: LaptopClass | 'UNCLASSIFIED') => {
    return batch.items?.reduce((sum, m) => sum + (m?.counts?.[cls as LaptopClass] || 0), 0) || 0;
  };

  const handleSort = (field: 'batchId' | 'createdAt') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDeleteConfirm = async () => {
    if (batchToDelete) {
      setIsDeleting(true);
      try {
        await onDeleteBatch(batchToDelete, setSelectedBatchId);
      } finally {
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        setBatchToDelete(null);
      }
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setBatchToDelete(null);
  };

  const initiateDelete = (batchId: string) => {
    setBatchToDelete(batchId);
    setIsDeleteDialogOpen(true);
  };

  return {
    sortField,
    sortOrder,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    batchToDelete,
    setBatchToDelete,
    isDeleting,
    safeFormatDate,
    sortedBatches,
    getColumnTotal,
    getRowTotal,
    getClassifiedRowTotal,
    getBatchTotal,
    handleSort,
    handleDeleteConfirm,
    handleDeleteCancel,
    initiateDelete
  };
};
