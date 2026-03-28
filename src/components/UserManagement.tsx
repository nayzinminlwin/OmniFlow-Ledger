import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { Check, X, User as UserIcon, Clock, Shield, ShieldOff, UserMinus, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { cn, withTimeout } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../services/firestore';
import { auth } from '../firebase';
import { toast } from 'sonner';

interface UserManagementProps {
  t: any;
  activeTab: string;
  isOriginalAdmin: boolean;
}

export const UserManagement: React.FC<UserManagementProps> = ({ t, activeTab, isOriginalAdmin }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

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
    const attempt = async () => {
      try {
        const updateData: any = { status };
        if (status === 'approved') {
          updateData.notifiedApproved = false;
        }
        await withTimeout(updateDoc(doc(db, 'users', uid), updateData), 10000, t.transactionTimeout || 'Request timed out');
        toast.success(status === 'approved' ? 'User approved' : 'User rejected');
      } catch (error: any) {
        console.error('Update status failed:', error);
        toast.error(error.message || 'Failed to update user status', {
          action: {
            label: t.retry || 'Retry',
            onClick: () => attempt()
          }
        });
      }
    };
    attempt();
  };

  const handleToggleUltimateAdmin = async (uid: string, currentStatus: boolean) => {
    const attempt = async () => {
      try {
        await withTimeout(updateDoc(doc(db, 'users', uid), { isUltimateAdmin: !currentStatus }), 10000, t.transactionTimeout || 'Request timed out');
        toast.success(currentStatus ? 'Admin privileges removed' : 'Admin privileges granted');
      } catch (error: any) {
        console.error('Toggle admin failed:', error);
        toast.error(error.message || 'Failed to toggle admin privileges', {
          action: {
            label: t.retry || 'Retry',
            onClick: () => attempt()
          }
        });
      }
    };
    attempt();
  };

  if (activeTab !== 'users') return null;

  return (
    <div className="lg:col-span-12 space-y-8 animate-in fade-in duration-500">
      <section>
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-[28px] font-bold text-black tracking-tight leading-none">{t.userManagement}</h2>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <div className="glass-panel p-8 text-center text-gray-500">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              {t.processing}
            </div>
          ) : users.length === 0 ? (
            <div className="glass-panel p-12 text-center text-gray-400">
              <UserIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-[15px] font-medium">{t.noTransactions}</p>
            </div>
          ) : (
            users.map((user, index) => (
              <div key={user.uid || index} className="glass-panel p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                    user.status === 'approved' ? "bg-green-100 text-green-600" : 
                    user.status === 'rejected' ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                  )}>
                    <UserIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold text-black leading-tight">{user.username}</h3>
                    <p className="text-[13px] font-medium text-gray-500">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        {user.createdAt ? (
                          (() => {
                            const d = new Date(user.createdAt);
                            return isNaN(d.getTime()) ? t.invalidDate : format(d, 'MMM dd, yyyy HH:mm');
                          })()
                        ) : t.na}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5",
                    user.status === 'approved' ? "bg-green-100 text-green-700" : 
                    user.status === 'rejected' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                  )}>
                    {user.status === 'approved' ? t.statusApproved : 
                     user.status === 'rejected' ? t.statusRejected : t.statusPending}
                    {(user.isUltimateAdmin || user.isOriginalAdmin || user.email === 'nayzinminlwin22@gmail.com') && <Shield className="w-3 h-3" />}
                  </div>

                  {(user.isOriginalAdmin || user.email === 'nayzinminlwin22@gmail.com') && (
                    <div className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 flex items-center gap-1.5">
                      {t.originalAdmin}
                      <Shield className="w-3 h-3" />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    {user.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(user.uid, 'approved')}
                          className="p-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all active:scale-95 shadow-sm disabled:opacity-50"
                          title={t.approve}
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(user.uid, 'rejected')}
                          className="p-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all active:scale-95 shadow-sm disabled:opacity-50"
                          title={t.reject}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    )}

                    {user.status === 'approved' && user.uid !== auth.currentUser?.uid && !user.isOriginalAdmin && user.email !== 'nayzinminlwin22@gmail.com' && (
                      <>
                        {isOriginalAdmin && (
                          <button
                            onClick={() => handleToggleUltimateAdmin(user.uid, !!user.isUltimateAdmin)}
                            className={cn(
                              "p-2 rounded-xl transition-all active:scale-95 shadow-sm disabled:opacity-50",
                              user.isUltimateAdmin ? "bg-orange-100 text-orange-600 hover:bg-orange-200" : "bg-purple-600 text-white hover:bg-purple-700"
                            )}
                            title={user.isUltimateAdmin ? t.removeUltimate : t.makeUltimate}
                          >
                            {user.isUltimateAdmin ? <ShieldOff className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                          </button>
                        )}
                        <button
                          onClick={() => handleUpdateStatus(user.uid, 'rejected')}
                          className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all active:scale-95 shadow-sm disabled:opacity-50"
                          title={t.revoke}
                        >
                          <UserMinus className="w-5 h-5" />
                        </button>
                      </>
                    )}

                    {user.status === 'rejected' && !user.isOriginalAdmin && user.email !== 'nayzinminlwin22@gmail.com' && (
                      <button
                        onClick={() => handleUpdateStatus(user.uid, 'approved')}
                        className="p-2 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition-all active:scale-95 shadow-sm disabled:opacity-50"
                        title={t.regrant}
                      >
                        <UserPlus className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
