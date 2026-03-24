import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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

  const motherAdminEmail = "nayzinminlwin22@gmail.com";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.email, 'Verified:', user?.emailVerified);
      if (user) {
        const isMotherAdmin = user.email === motherAdminEmail && user.emailVerified;
        try {
          console.log("Fetching profile for UID:", user.uid);
          const profileDoc = await getDoc(doc(db, 'users', user.uid));
          if (profileDoc.exists()) {
            const profileData = profileDoc.data() as UserProfile;
            console.log("Profile found:", profileData.status);
            setProfile(profileData);
            
            // If not approved and not mother admin, sign out
            if (profileData.status !== 'approved' && !isMotherAdmin) {
              console.log("User not approved, signing out...");
              setUser(null);
              setProfile(null);
              setError(profileData.status === 'pending' ? t.pendingApproval : t.rejectedApproval);
              await signOut(auth);
            } else {
              console.log("User approved or Mother Admin, setting user state");
              setUser(user);
            }
          } else if (isMotherAdmin) {
            console.log("Mother Admin profile missing, creating...");
            // Auto-create profile for mother admin if it doesn't exist
            const newProfile: UserProfile = {
              uid: user.uid,
              username: 'Mother Admin',
              email: user.email!,
              status: 'approved',
              role: 'admin',
              createdAt: new Date().toISOString()
            };
            try {
              await setDoc(doc(db, 'users', user.uid), newProfile);
              console.log("Mother Admin profile created successfully");
              setProfile(newProfile);
              setUser(user);
            } catch (err) {
              console.error("Error creating Mother Admin profile:", err);
              handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
            }
          } else {
            console.log("No profile found for non-mother admin, creating pending profile...");
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

  const handleLogin = async (username: string, password: string) => {
    try {
      setError(null);
      const email = `${username.toLowerCase().trim()}@repair.ledger`;
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(t.loginFailed);
    }
  };

  const handleSignUp = async (username: string, password: string) => {
    try {
      setError(null);
      const email = `${username.toLowerCase().trim()}@repair.ledger`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      const newProfile: UserProfile = {
        uid: userCredential.user.uid,
        username: username.trim(),
        email: email,
        status: 'pending',
        role: 'user',
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', userCredential.user.uid), newProfile);
      
      // Sign out immediately after sign up to wait for approval
      await signOut(auth);
      setError(t.pendingApproval);
    } catch (err: any) {
      console.error('Sign up failed:', err);
      setError(t.loginFailed);
    }
  };

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
    handleLogin, 
    handleSignUp, 
    handleGoogleLogin,
    handleLogout, 
    error, 
    setError,
    isMotherAdmin: user?.email === motherAdminEmail && user?.emailVerified
  };
}
