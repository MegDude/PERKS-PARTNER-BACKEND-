import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  clearSupabaseSession,
  getStoredSupabaseSession,
  hydrateSupabaseSessionFromUrl,
  resetSupabasePassword,
  signInWithSupabase,
  signOutOfSupabase,
  signUpWithSupabase,
  startSupabaseGoogleSignIn,
  supabaseConfigured,
  type SupabaseUser,
} from "@/lib/supabaseClient";

type AuthContextValue = {
  user: SupabaseUser | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<SupabaseUser>;
  signInWithGoogle: () => Promise<SupabaseUser>;
  signUp: (email: string, password: string, displayName?: string) => Promise<SupabaseUser>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function friendlyAuthError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code) : "";
  const message = error instanceof Error ? error.message : "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
    return "That email and password did not match an account.";
  }
  if (code.includes("too-many-requests")) return "Too many attempts. Please wait a moment and try again.";
  if (code.includes("email-already-in-use")) return "That email already has an account.";
  if (code.includes("weak-password")) return "Please use a stronger password.";
  if (code.includes("network-request-failed")) return "Network connection failed. Please try again.";
  if (message.toLowerCase().includes("invalid login")) return "That email and password did not match an account.";
  return message || "Authentication failed. Please try again.";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(supabaseConfigured);

  useEffect(() => {
    setConfigured(supabaseConfigured);
    if (!supabaseConfigured) {
      setUser(null);
      setLoading(false);
      setInitialized(true);
      return;
    }

    hydrateSupabaseSessionFromUrl()
      .then((session) => {
        setUser(session?.user || getStoredSupabaseSession()?.user || null);
        setError(null);
        setLoading(false);
        setInitialized(true);
      })
      .catch((authError) => {
        setError(friendlyAuthError(authError));
        setUser(null);
        clearSupabaseSession();
        setLoading(false);
        setInitialized(true);
      });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const nextUser = await signInWithSupabase(email.trim(), password);
      setUser(nextUser);
      return nextUser;
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
      const nextUser = await signUpWithSupabase(email.trim(), password, displayName);
      setUser(nextUser);
      return nextUser;
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
      startSupabaseGoogleSignIn();
      return await new Promise<SupabaseUser>(() => undefined);
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
      await resetSupabasePassword(email.trim());
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
      await signOutOfSupabase();
      setUser(null);
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
