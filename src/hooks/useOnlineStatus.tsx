import { useEffect, useState } from "react";

// Tracks the browser's online/offline state. Used to surface a small banner
// when the rep is in a dead-zone so they know mutations may not sync.
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return online;
}

// Fires `refetch` when the tab regains focus or the network comes back online.
// Useful for data that loads once on mount but goes stale while Emma is
// driving between visits. Skips the initial mount — `refetch` should already
// be called by the consumer's first useEffect.
export function useRefetchOnFocus(refetch: () => void, intervalMs = 60_000) {
  useEffect(() => {
    let lastRun = Date.now();
    const maybeRefetch = () => {
      const now = Date.now();
      if (now - lastRun >= intervalMs) {
        lastRun = now;
        refetch();
      }
    };

    const onFocus = () => maybeRefetch();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") maybeRefetch();
    };
    const onOnline = () => {
      lastRun = Date.now();
      refetch();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", onOnline);
    };
  }, [refetch, intervalMs]);
}
