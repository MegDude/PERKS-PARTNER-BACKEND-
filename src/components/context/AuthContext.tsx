import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { initializeFirebaseServices, requireFirebaseAuth } from "@/lib/firebase";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  signUp: (email: string, password: string, displayName?: string) => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function friendlyAuthError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code) : "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
    return "That email and password did not match an account.";
  }
  if (code.includes("too-many-requests")) return "Too many attempts. Please wait a moment and try again.";
  if (code.includes("email-already-in-use")) return "That email already has an account.";
  if (code.includes("weak-password")) return "Please use a stronger password.";
  if (code.includes("network-request-failed")) return "Network connection failed. Please try again.";
  return error instanceof Error ? error.message : "Authentication failed. Please try again.";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    let unsubscribe: undefined | (() => void);
    initializeFirebaseServices().then((services) => {
      setConfigured(services.configured);
      if (!services.configured || !services.auth) {
      setUser(null);
      setLoading(false);
      setInitialized(true);
      return;
    }

      unsubscribe = onAuthStateChanged(
      services.auth,
      (nextUser) => {
        setUser(nextUser);
        if (nextUser) {
          localStorage.setItem("dp_auth_user", JSON.stringify({ uid: nextUser.uid, email: nextUser.email, displayName: nextUser.displayName }));
        } else {
          localStorage.removeItem("dp_auth_user");
        }
        setError(null);
        setLoading(false);
        setInitialized(true);
      },
      (authError) => {
        setError(friendlyAuthError(authError));
        setUser(null);
        setLoading(false);
        setInitialized(true);
      }
    );
    }).catch((authError) => {
      setConfigured(false);
      setError(friendlyAuthError(authError));
      setUser(null);
      setLoading(false);
      setInitialized(true);
    });

    return () => unsubscribe?.();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const credential = await signInWithEmailAndPassword(requireFirebaseAuth(), email.trim(), password);
      return credential.user;
    } catch (authError) {
      const message = friendlyAuthError(authError);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    setLoading(true);
    setError(null);
    try {
      const credential = await createUserWithEmailAndPassword(requireFirebaseAuth(), email.trim(), password);
      if (displayName) await updateProfile(credential.user, { displayName });
      return credential.user;
    } catch (authError) {
      const message = friendlyAuthError(authError);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const credential = await signInWithPopup(requireFirebaseAuth(), provider);
      return credential.user;
    } catch (authError) {
      const message = friendlyAuthError(authError);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(requireFirebaseAuth(), email.trim());
    } catch (authError) {
      const message = friendlyAuthError(authError);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await signOut(requireFirebaseAuth());
    } catch (authError) {
      const message = friendlyAuthError(authError);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      initialized,
      error,
      configured,
      signIn,
      signInWithGoogle,
      signUp,
      resetPassword,
      logout,
      clearError: () => setError(null),
    }),
    [configured, error, initialized, loading, logout, resetPassword, signIn, signInWithGoogle, signUp, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
