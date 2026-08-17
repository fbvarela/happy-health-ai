"use client";

import { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";

const AppContext = createContext();

/**
 * Global app state (non-auth): toasts, nav drawer, active patient.
 */
export function AppProvider({ children }) {
  const router = useRouter();
  const [toasts, setToasts] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activePatientId, setActivePatientId] = useState(null);
  const [patientDataVersion, setPatientDataVersion] = useState(0);

  const pushToast = (message, type = "info") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const refreshPatientData = () => {
    setPatientDataVersion((version) => version + 1);
    router.refresh();
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
        patientDataVersion,
        refreshPatientData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
