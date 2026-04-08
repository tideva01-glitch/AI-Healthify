import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { canUseDashboard, getCurrentSession, loadCurrentUser, saveProfile as persistProfile, signInWithGoogle, signOut, subscribeToAuthChanges } from "../lib/supabaseData.js";
import { hasSupabaseEnv } from "../lib/supabase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(hasSupabaseEnv);

  useEffect(() => {
    let ignore = false;

    if (!hasSupabaseEnv) {
      setReady(false);
      setLoading(false);
      return;
    }

    async function syncUser() {
      setLoading(true);
      try {
        const session = await getCurrentSession();
        const nextUser = session ? await loadCurrentUser() : null;
        if (!ignore) {
          setUser(nextUser);
          setReady(true);
        }
      } catch {
        if (!ignore) {
          setUser(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    syncUser();
    const { data: subscription } = subscribeToAuthChanges(async (session) => {
      if (!session) {
        if (!ignore) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      const nextUser = await loadCurrentUser();
      if (!ignore) {
        setUser(nextUser);
        setLoading(false);
      }
    });

    return () => {
      ignore = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      ready,
      async loginWithGoogle() {
        await signInWithGoogle();
      },
      async saveProfile(profile) {
        const nextUser = await persistProfile(profile);
        setUser(nextUser);
        return nextUser;
      },
      async refreshUser() {
        const nextUser = await loadCurrentUser();
        setUser(nextUser);
        return nextUser;
      },
      async logout() {
        await signOut();
        setUser(null);
      },
      canUseDashboard,
    }),
    [loading, ready, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return value;
}
