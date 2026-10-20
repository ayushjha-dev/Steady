import { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { onNetworkChange } from "@/lib/pwa";
import { syncOfflineData, getUnsyncedCount } from "@/lib/offline";

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Initial check
    setIsOnline(navigator.onLine);
    updateUnsyncedCount();

    // Listen for network changes
    const cleanup = onNetworkChange((online) => {
      setIsOnline(online);
      setShowBanner(!online);

      if (online) {
        // Auto-sync when coming online
        handleSync();
      }
    });

    return cleanup;
  }, []);

  const updateUnsyncedCount = async () => {
    const count = await getUnsyncedCount();
    setUnsyncedCount(count);
  };

  const handleSync = async () => {
    if (isSyncing || !isOnline) return;

    setIsSyncing(true);
    try {
      const result = await syncOfflineData();
      console.log("Sync result:", result);
      await updateUnsyncedCount();

      if (result.success > 0) {
        // Success feedback
        setTimeout(() => setShowBanner(false), 2000);
      }
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Don't show banner if online and no unsynced items
  if (isOnline && unsyncedCount === 0 && !showBanner) return null;

  return (
    <div
      className={cn(
        "fixed bottom-20 left-4 right-4 z-50 rounded-xl border-2 p-4 shadow-lg transition-all lg:bottom-4",
        isOnline ? "border-primary/40 bg-primary-tint" : "border-clay/40 bg-clay-tint",
      )}
    >
      <div className="flex items-center gap-3">
        {isOnline ? (
          <Wifi className="size-5 shrink-0 text-primary" />
        ) : (
          <WifiOff className="size-5 shrink-0 text-clay" />
        )}

        <div className="flex-1">
          {isOnline ? (
            <>
              {unsyncedCount > 0 ? (
                <p className="text-sm font-medium text-foreground">
                  {isSyncing ? "Syncing data..." : `${unsyncedCount} items pending sync`}
                </p>
              ) : (
                <p className="text-sm font-medium text-foreground">Back online</p>
              )}
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground">You're offline</p>
              <p className="text-xs text-muted-foreground">
                Changes will sync when you're back online
              </p>
            </>
          )}
        </div>

        {isOnline && unsyncedCount > 0 && !isSyncing && (
          <button
            onClick={handleSync}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <RefreshCw className="size-3" />
            Sync now
          </button>
        )}

        <button
          onClick={() => setShowBanner(false)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <WifiOff className="size-4" />
        </button>
      </div>
    </div>
  );
}
