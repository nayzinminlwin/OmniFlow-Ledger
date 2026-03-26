import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signOut, 
  User,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Language } from '../translations';
import { translations } from '../translations';
import { handleFirestoreError, OperationType } from '../services/firestore';
import { UserProfile } from '../types';

export function useAuth(lang: Language) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const t = translations[lang];

  const bootstrapAdminEmails = ["tpl.pauline.pts2026@gmail.com", "nayzinminlwin22@gmail.com"];
  const originalAdminEmail = "nayzinminlwin22@gmail.com";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.email, 'Verified:', user?.emailVerified);
      if (user) {
        const isBootstrapAdmin = bootstrapAdminEmails.includes(user.email || "") && user.emailVerified;
        const isOriginalByEmail = user.email === originalAdminEmail && user.emailVerified;
        try {
          console.log("Fetching profile for UID:", user.uid);
          const profileDoc = await getDoc(doc(db, 'users', user.uid));
          if (profileDoc.exists()) {
            const profileData = profileDoc.data() as UserProfile;
            console.log("Profile found:", profileData.status);
            setProfile(profileData);
            
            const isUltimateAdmin = isBootstrapAdmin || profileData.isUltimateAdmin === true || profileData.isOriginalAdmin === true;
            
            if (isBootstrapAdmin && (profileData.status !== 'approved' || profileData.role !== 'admin' || !profileData.isUltimateAdmin || (isOriginalByEmail && !profileData.isOriginalAdmin))) {
              console.log("Upgrading bootstrap admin profile...");
              const updates: Partial<UserProfile> = {
                status: 'approved',
                role: 'admin',
                isUltimateAdmin: true,
                notifiedApproved: true
              };
              if (isOriginalByEmail) {
                updates.isOriginalAdmin = true;
                updates.username = t.originalAdmin;
              }
              try {
                await updateDoc(doc(db, 'users', user.uid), updates);
                setProfile({ ...profileData, ...updates });
              } catch (err) {
                console.error("Error upgrading bootstrap admin:", err);
              }
            } else if (profileData.status === 'approved' && profileData.notifiedApproved === false) {
              setSuccess(t.accountApprovedToast);
              try {
                await updateDoc(doc(db, 'users', user.uid), { notifiedApproved: true });
              } catch (err) {
                console.error("Error updating notifiedApproved:", err);
              }
            }

            if (profileData.status !== 'approved' && !isUltimateAdmin) {
              console.log("User not approved, signing out...");
              setUser(null);
              setProfile(null);
              setError(profileData.status === 'pending' ? t.pendingApproval : t.rejectedApproval);
              if (profileData.status === 'pending') {
                setRequestSent(true);
              }
              await signOut(auth);
            } else {
              console.log("User approved or Ultimate Admin, setting user state");
              setUser(user);
            }
          } else if (isBootstrapAdmin) {
            console.log("Ultimate Admin profile missing, creating...");
            const newProfile: UserProfile = {
              uid: user.uid,
              username: isOriginalByEmail ? t.originalAdmin : t.ultimateAdmin,
              email: user.email!,
              status: 'approved',
              role: 'admin',
              isUltimateAdmin: true,
              isOriginalAdmin: isOriginalByEmail,
              notifiedApproved: true,
              createdAt: new Date().toISOString()
            };
            try {
              await setDoc(doc(db, 'users', user.uid), newProfile);
              console.log("Ultimate Admin profile created successfully");
              setProfile(newProfile);
              setUser(user);
            } catch (err) {
              console.error("Error creating Ultimate Admin profile:", err);
              handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
            }
          } else {
            console.log("No profile found for non-ultimate admin, creating pending profile...");
            const newProfile: UserProfile = {
              uid: user.uid,
              username: user.displayName || user.email?.split('@')[0] || t.defaultUser,
              email: user.email || '',
              status: 'pending',
              role: 'user',
              notifiedApproved: false,
              createdAt: new Date().toISOString()
            };
            try {
              await setDoc(doc(db, 'users', user.uid), newProfile);
              console.log("Pending profile created successfully");
              setRequestSent(true);
              setUser(null);
              setProfile(null);
              await signOut(auth);
            } catch (err) {
              console.error("Error creating pending profile:", err);
              handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
            }
          }
        } catch (err) {
          console.error("Error in profile fetch/create:", err);
          handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setIsAuthReady(true);
      setIsLoggingIn(false);
    });
    return () => unsubscribe();
  }, [t.pendingApproval, t.rejectedApproval, t.accountApprovedToast, t.originalAdmin, t.ultimateAdmin, t.defaultUser]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('Google login failed:', err);
      setError(t.loginFailed);
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsAuthReady(false);
    signOut(auth);
  };

  return { 
    user, 
    profile, 
    isAuthReady, 
    isLoggingIn,
    handleGoogleLogin,
    handleLogout, 
    error, 
    setError,
    success,
    setSuccess,
    requestSent,
    setRequestSent,
    isUltimateAdmin: bootstrapAdminEmails.includes(user?.email || "") || profile?.isUltimateAdmin === true || profile?.isOriginalAdmin === true,
    isOriginalAdmin: user?.email === originalAdminEmail || profile?.isOriginalAdmin === true
  };
}
