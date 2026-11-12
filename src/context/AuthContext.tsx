import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { User as DbUser } from '../types/index.ts';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  dbUser: DbUser | null;
  token: string | null;
  loading: boolean;
  isSigningIn: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<boolean>;
  signOutUser: () => Promise<void>;
  refreshDbUser: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  dbUser: null,
  token: null,
  loading: true,
  isSigningIn: false,
  authError: null,
  clearAuthError: () => {},
  signInWithGoogle: async () => false,
  signOutUser: async () => {},
  refreshDbUser: async () => {},
  isAdmin: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchDbUser = async (idToken: string) => {
    try {
      const res = await fetch('/api/user/profile', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setDbUser(data.user);
      }
    } catch (err) {
      console.warn('Failed to fetch synchronized database user:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const idToken = await user.getIdToken();
          setToken(idToken);
          await fetchDbUser(idToken);
        } catch (e) {
          console.warn('Error fetching auth token on state change:', e);
        }
      } else {
        setToken(null);
        setDbUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearAuthError = () => {
    setAuthError(null);
  };

  const signInWithGoogle = async (): Promise<boolean> => {
    // Prevent duplicate simultaneous popup requests
    if (isSigningIn) {
      return false;
    }

    setIsSigningIn(true);
    setAuthError(null);

    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await result.user.getIdToken();
      setToken(idToken);
      await fetchDbUser(idToken);
      return true;
    } catch (err: any) {
      const code = err?.code || '';
      // Normal user dismissal or duplicate cancellation should be ignored gracefully
      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request'
      ) {
        console.info('Google sign-in popup dismissed or superseded.');
        return false;
      }

      if (code === 'auth/popup-blocked') {
        const msg = 'Sign-in popup was blocked by your browser. Please allow popups for this site and try again.';
        setAuthError(msg);
        return false;
      }

      console.warn('Google Sign-In notification:', err?.message || err);
      setAuthError(err?.message || 'Authentication could not be completed.');
      return false;
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setFirebaseUser(null);
      setDbUser(null);
      setToken(null);
    } catch (err) {
      console.warn('Sign out notice:', err);
    }
  };

  const refreshDbUser = async () => {
    if (token) {
      await fetchDbUser(token);
    }
  };

  const isAdmin = dbUser?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        dbUser,
        token,
        loading,
        isSigningIn,
        authError,
        clearAuthError,
        signInWithGoogle,
        signOutUser,
        refreshDbUser,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
