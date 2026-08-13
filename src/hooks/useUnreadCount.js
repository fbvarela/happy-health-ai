"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/utils/api";

/**
 * useUnreadCount — polls the unread-notification count. Exposes { count, refresh }.
 */
export function useUnreadCount() {
  const [count, setCount] = useState(0);
  const timer = useRef(null);

  const refresh = useCallback(() => {
    api
      .getUnreadCount()
      .then((r) => setCount(r?.count ?? 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    timer.current = setInterval(refresh, 30000);
    return () => clearInterval(timer.current);
  }, [refresh]);

  return { count, refresh };
}
