import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    // Check if prompt was previously dismissed
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    const dismissedDate = dismissed ? new Date(dismissed) : null;
    const daysSinceDismiss = dismissedDate
      ? Math.floor((Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Show again after 7 days
    if (daysSinceDismiss !== null && daysSinceDismiss < 7) {
      return;
    }

    // Listen for beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Show prompt after 30 seconds (user has had time to explore)
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Listen for app installed event
    const installedHandler = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem("pwa-install-dismissed");
    };

    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
      setShowPrompt(false);
    } else {
      console.log("User dismissed the install prompt");
      handleDismiss();
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", new Date().toISOString());
  };

  // Don't show if already installed or no prompt available
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 top-4 z-50 animate-in slide-in-from-top-4 lg:left-auto lg:right-4 lg:w-96">
      <div className="card-paper relative overflow-hidden p-5">
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-start gap-4 pr-6">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-tint">
            <Download className="size-6 text-primary" />
          </div>

          <div className="flex-1">
            <h3 className="mb-1 font-medium text-foreground">Install Steady</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Add Steady to your home screen for quick access and offline support
            </p>

            <div className="flex gap-2">
              <Button onClick={handleInstall} className="rounded-xl" size="sm">
                <Download className="mr-2 size-4" />
                Install
              </Button>
              <Button onClick={handleDismiss} variant="outline" className="rounded-xl" size="sm">
                Not now
              </Button>
            </div>
          </div>
        </div>

        {/* Benefits list */}
        <ul className="mt-4 space-y-1.5 border-t pt-4 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <div className="size-1 rounded-full bg-primary" />
            <span>Works offline after initial load</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="size-1 rounded-full bg-primary" />
            <span>Faster load times with caching</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="size-1 rounded-full bg-primary" />
            <span>Native app-like experience</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

// iOS-specific install instructions component
export function IOSInstallPrompt() {
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    // Check if iOS and not in standalone mode
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isInStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    // Check if dismissed
    const dismissed = localStorage.getItem("ios-install-dismissed");
    const dismissedDate = dismissed ? new Date(dismissed) : null;
    const daysSinceDismiss = dismissedDate
      ? Math.floor((Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    if (isIOS && !isInStandaloneMode && (daysSinceDismiss === null || daysSinceDismiss >= 7)) {
      // Show after 45 seconds on iOS
      setTimeout(() => {
        setShowIOSPrompt(true);
      }, 45000);
    }
  }, []);

  const handleDismiss = () => {
    setShowIOSPrompt(false);
    localStorage.setItem("ios-install-dismissed", new Date().toISOString());
  };

  if (!showIOSPrompt) return null;

  return (
    <div className="fixed inset-x-4 bottom-24 z-50 animate-in slide-in-from-bottom-4 lg:bottom-4 lg:left-auto lg:right-4 lg:w-96">
      <div className="card-paper relative overflow-hidden p-5">
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>

        <div className="pr-6">
          <h3 className="mb-2 font-medium text-foreground">Install Steady on iOS</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Add Steady to your home screen for the best experience:
          </p>

          <ol className="space-y-2 text-sm text-foreground">
            <li className="flex gap-2">
              <span className="font-medium">1.</span>
              <span>
                Tap the <span className="font-medium">Share</span> button in Safari
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium">2.</span>
              <span>
                Scroll and tap <span className="font-medium">Add to Home Screen</span>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium">3.</span>
              <span>
                Tap <span className="font-medium">Add</span> to confirm
              </span>
            </li>
          </ol>

          <Button onClick={handleDismiss} variant="outline" className="mt-4 w-full rounded-xl">
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}
