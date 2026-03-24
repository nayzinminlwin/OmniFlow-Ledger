import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signOut, 
  User,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Language } from '../translations';
import { translations } from '../translations';
import { handleFirestoreError, OperationType } from '../services/firestore';

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  role: 'admin' | 'user';
  createdAt: string;
}

export function useAuth(lang: Language) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = translations[lang];

  const ultimateAdminEmails = ["nayzinminlwin22@gmail.com", "tpl.pauline.pts2026@gmail.com"];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.email, 'Verified:', user?.emailVerified);
      if (user) {
        const isUltimateAdmin = ultimateAdminEmails.includes(user.email || "") && user.emailVerified;
        try {
          console.log("Fetching profile for UID:", user.uid);
          const profileDoc = await getDoc(doc(db, 'users', user.uid));
          if (profileDoc.exists()) {
            const profileData = profileDoc.data() as UserProfile;
            console.log("Profile found:", profileData.status);
            setProfile(profileData);
            
            // If not approved and not ultimate admin, sign out
            if (profileData.status !== 'approved' && !isUltimateAdmin) {
              console.log("User not approved, signing out...");
              setUser(null);
              setProfile(null);
              setError(profileData.status === 'pending' ? t.pendingApproval : t.rejectedApproval);
              await signOut(auth);
            } else {
              console.log("User approved or Ultimate Admin, setting user state");
              setUser(user);
            }
          } else if (isUltimateAdmin) {
            console.log("Ultimate Admin profile missing, creating...");
            // Auto-create profile for ultimate admin if it doesn't exist
            const newProfile: UserProfile = {
              uid: user.uid,
              username: 'Ultimate Admin',
              email: user.email!,
              status: 'approved',
              role: 'admin',
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
            // Auto-create pending profile for new Google login users
            const newProfile: UserProfile = {
              uid: user.uid,
              username: user.displayName || user.email?.split('@')[0] || 'User',
              email: user.email || '',
              status: 'pending',
              role: 'user',
              createdAt: new Date().toISOString()
            };
            try {
              await setDoc(doc(db, 'users', user.uid), newProfile);
              console.log("Pending profile created successfully");
              setUser(null);
              setProfile(null);
              setError(t.pendingApproval);
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
    });
    return () => unsubscribe();
  }, [t.pendingApproval, t.rejectedApproval]);

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('Google login failed:', err);
      setError(t.loginFailed);
    }
  };

  const handleLogout = () => signOut(auth);

  return { 
    user, 
    profile, 
    isAuthReady, 
    handleGoogleLogin,
    handleLogout, 
    error, 
    setError,
    isUltimateAdmin: ultimateAdminEmails.includes(user?.email || "") && user?.emailVerified
  };
}
