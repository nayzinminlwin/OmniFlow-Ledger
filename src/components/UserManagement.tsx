import React from 'react';
import { UserProfile } from '../types';
import { Check, X, User as UserIcon, Clock, Shield, ShieldOff, UserMinus, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { useUserManagementLogic } from '../hooks/useUserManagementLogic';

interface UserManagementProps {
  t: any;
  activeTab: string;
  isOriginalAdmin: boolean;
}

export const UserManagement: React.FC<UserManagementProps> = ({ t, activeTab, isOriginalAdmin }) => {
  const {
    users,
    loading,
    actionLoading,
    handleUpdateStatus,
    handleToggleUltimateAdmin,
    currentUserUid
  } = useUserManagementLogic({ t, activeTab });

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
                          disabled={actionLoading === user.uid}
                          className="p-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all active:scale-95 shadow-sm disabled:opacity-50"
                          title={t.approve}
                        >
                          {actionLoading === user.uid ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(user.uid, 'rejected')}
                          disabled={actionLoading === user.uid}
                          className="p-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all active:scale-95 shadow-sm disabled:opacity-50"
                          title={t.reject}
                        >
                          {actionLoading === user.uid ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <X className="w-5 h-5" />}
                        </button>
                      </>
                    )}

                    {user.status === 'approved' && user.uid !== currentUserUid && !user.isOriginalAdmin && user.email !== 'nayzinminlwin22@gmail.com' && (
                      <>
                        {isOriginalAdmin && (
                          <button
                            onClick={() => handleToggleUltimateAdmin(user.uid, !!user.isUltimateAdmin)}
                            disabled={actionLoading === user.uid}
                            className={cn(
                              "p-2 rounded-xl transition-all active:scale-95 shadow-sm disabled:opacity-50",
                              user.isUltimateAdmin ? "bg-orange-100 text-orange-600 hover:bg-orange-200" : "bg-purple-600 text-white hover:bg-purple-700"
                            )}
                            title={user.isUltimateAdmin ? t.removeUltimate : t.makeUltimate}
                          >
                            {actionLoading === user.uid ? <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" /> : (user.isUltimateAdmin ? <ShieldOff className="w-5 h-5" /> : <Shield className="w-5 h-5" />)}
                          </button>
                        )}
                        <button
                          onClick={() => handleUpdateStatus(user.uid, 'rejected')}
                          disabled={actionLoading === user.uid}
                          className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all active:scale-95 shadow-sm disabled:opacity-50"
                          title={t.revoke}
                        >
                          {actionLoading === user.uid ? <div className="w-5 h-5 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" /> : <UserMinus className="w-5 h-5" />}
                        </button>
                      </>
                    )}

                    {user.status === 'rejected' && !user.isOriginalAdmin && user.email !== 'nayzinminlwin22@gmail.com' && (
                      <button
                        onClick={() => handleUpdateStatus(user.uid, 'approved')}
                        disabled={actionLoading === user.uid}
                        className="p-2 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition-all active:scale-95 shadow-sm disabled:opacity-50"
                        title={t.regrant}
                      >
                        {actionLoading === user.uid ? <div className="w-5 h-5 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin" /> : <UserPlus className="w-5 h-5" />}
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
