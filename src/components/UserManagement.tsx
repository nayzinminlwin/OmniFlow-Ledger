import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../hooks/useAuth';
import { Check, X, User as UserIcon, Clock, Shield, ShieldOff, UserMinus, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../services/firestore';
import { auth } from '../firebase';

interface UserManagementProps {
  t: any;
  activeTab: string;
}

export const UserManagement: React.FC<UserManagementProps> = ({ t, activeTab }) => {
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
    try {
      await updateDoc(doc(db, 'users', uid), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleToggleUltimateAdmin = async (uid: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', uid), { isUltimateAdmin: !currentStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
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
            users.map((user) => (
              <div key={user.uid} className="glass-panel p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                            return isNaN(d.getTime()) ? 'Invalid Date' : format(d, 'MMM dd, yyyy HH:mm');
                          })()
                        ) : 'N/A'}
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
                    {user.status}
                    {user.isUltimateAdmin && <Shield className="w-3 h-3" />}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {user.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(user.uid, 'approved')}
                          className="p-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all active:scale-95 shadow-sm"
                          title={t.approve}
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(user.uid, 'rejected')}
                          className="p-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all active:scale-95 shadow-sm"
                          title={t.reject}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    )}

                    {user.status === 'approved' && user.uid !== auth.currentUser?.uid && (
                      <>
                        <button
                          onClick={() => handleToggleUltimateAdmin(user.uid, !!user.isUltimateAdmin)}
                          className={cn(
                            "p-2 rounded-xl transition-all active:scale-95 shadow-sm",
                            user.isUltimateAdmin ? "bg-orange-100 text-orange-600 hover:bg-orange-200" : "bg-purple-600 text-white hover:bg-purple-700"
                          )}
                          title={user.isUltimateAdmin ? t.removeUltimate : t.makeUltimate}
                        >
                          {user.isUltimateAdmin ? <ShieldOff className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(user.uid, 'rejected')}
                          className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all active:scale-95 shadow-sm"
                          title={t.revoke}
                        >
                          <UserMinus className="w-5 h-5" />
                        </button>
                      </>
                    )}

                    {user.status === 'rejected' && (
                      <button
                        onClick={() => handleUpdateStatus(user.uid, 'approved')}
                        className="p-2 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition-all active:scale-95 shadow-sm"
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
