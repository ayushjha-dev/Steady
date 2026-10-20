import { registerSW } from "virtual:pwa-register";

export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        // New version available
        if (
          window.confirm("New version available! Click OK to refresh and get the latest features.")
        ) {
          updateSW(true);
        }
      },
      onOfflineReady() {
        console.log("App ready to work offline");
      },
      onRegistered(registration) {
        console.log("Service Worker registered:", registration);
      },
      onRegisterError(error) {
        console.error("Service Worker registration error:", error);
      },
    });

    return updateSW;
  }

  return () => {};
}

export function checkNetworkStatus() {
  return navigator.onLine;
}

export function onNetworkChange(callback: (online: boolean) => void) {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}
