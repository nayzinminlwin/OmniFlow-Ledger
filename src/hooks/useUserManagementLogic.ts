import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile } from '../types';
import { withTimeout } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../services/firestore';

interface UseUserManagementLogicProps {
  t: any;
  activeTab: string;
}

export const useUserManagementLogic = ({ t, activeTab }: UseUserManagementLogicProps) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== 'users') return;

    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersList = snapshot.docs.map(doc => doc.data() as UserProfile);
      setUsers(usersList.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }));
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'users');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [activeTab]);

  const handleUpdateStatus = async (uid: string, status: 'approved' | 'rejected') => {
    try {
      setActionLoading(uid);
      const updateData: any = { status };
      if (status === 'approved') {
        updateData.notifiedApproved = false;
      }
      await withTimeout(updateDoc(doc(db, 'users', uid), updateData), 10000, t.transactionTimeout || 'Request timed out');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleUltimateAdmin = async (uid: string, currentStatus: boolean) => {
    try {
      setActionLoading(uid);
      await withTimeout(updateDoc(doc(db, 'users', uid), { isUltimateAdmin: !currentStatus }), 10000, t.transactionTimeout || 'Request timed out');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    } finally {
      setActionLoading(null);
    }
  };

  return {
    users,
    loading,
    actionLoading,
    handleUpdateStatus,
    handleToggleUltimateAdmin,
    currentUserUid: auth.currentUser?.uid
  };
};
