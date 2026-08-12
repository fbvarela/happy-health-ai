"use client";

import { createContext, useContext, useState, useEffect } from "react";
import api from "@/utils/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await api.getMe();
        setCurrentUser(user);
      } catch {
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const googleSignIn = () => {
    // Full-page navigation: the API route performs the server-side OAuth 307
    // redirect to Google — client-side routing cannot follow that flow.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/api/auth/google");
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore logout errors
    }
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, googleSignIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
