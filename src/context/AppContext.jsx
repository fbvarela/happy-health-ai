"use client";

import { createContext, useContext, useState } from "react";

const AppContext = createContext();

/**
 * Global app state (non-auth): toasts, nav drawer, active patient.
 */
export function AppProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activePatientId, setActivePatientId] = useState(null);

  const pushToast = (message, type = "info") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  return (
    <AppContext.Provider
      value={{
        toasts,
        pushToast,
        drawerOpen,
        setDrawerOpen,
        activePatientId,
        setActivePatientId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
