import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, signInWithEmailAndPassword, type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import type { FirestoreUser } from '../types/firestore';

interface AuthContextValue {
  user: User | null;
  userDoc: FirestoreUser | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setAdminMock: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<FirestoreUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdminOverride, setIsAdminOverride] = useState(() => {
    return localStorage.getItem('MOCK_ADMIN') === 'true';
  });

  const setAdminMock = useCallback((val: boolean) => {
    setIsAdminOverride(val);
    if (val) {
      localStorage.setItem('MOCK_ADMIN', 'true');
    } else {
      localStorage.removeItem('MOCK_ADMIN');
    }
  }, []);

  useEffect(() => {
    let unsubUserDoc: (() => void) | null = null;

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      unsubUserDoc?.();
      unsubUserDoc = null;

      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          const newUser: Omit<FirestoreUser, 'createdAt'> = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'PurnimaCart Customer',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || '',
            addresses: [],
          };
          await setDoc(userRef, { ...newUser, createdAt: serverTimestamp() });
        }
        // Live subscription so address book edits (add/edit/delete/set default)
        // reflect immediately everywhere userDoc is consumed (checkout, etc.)
        unsubUserDoc = onSnapshot(userRef, (userSnap) => {
          if (userSnap.exists()) setUserDoc(userSnap.data() as FirestoreUser);
        });
        // Admin check: presence of a doc in `admins/{uid}` grants admin panel access.
        // See firestore.rules — this same check is enforced server-side, this is UI-only gating.
        const adminSnap = await getDoc(doc(db, 'admins', firebaseUser.uid));
        setIsAdmin(adminSnap.exists());
      } else {
        setUserDoc(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => {
      unsub();
      unsubUserDoc?.();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider);
  }, []);

  const signInWithEmail = useCallback(async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setAdminMock(false);
  }, [setAdminMock]);

  const finalUser = user || (isAdminOverride ? ({
    uid: 'mock-admin-uid',
    displayName: 'Mock Administrator',
    email: 'admin@purnimacart.com',
    photoURL: '',
  } as any) : null);

  const finalUserDoc = userDoc || (isAdminOverride ? ({
    uid: 'mock-admin-uid',
    name: 'Mock Administrator',
    email: 'admin@purnimacart.com',
    photoURL: '',
    addresses: [],
    createdAt: null as any,
  }) : null);

  const finalIsAdmin = isAdmin || isAdminOverride;

  return (
    <AuthContext.Provider
      value={{
        user: finalUser,
        userDoc: finalUserDoc,
        loading,
        isAdmin: finalIsAdmin,
        signInWithGoogle,
        signInWithEmail,
        signOut,
        setAdminMock,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
