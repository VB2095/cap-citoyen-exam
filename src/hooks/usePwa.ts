import { useEffect, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

import { VERSION_KEY } from "../lib/storage";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallPromptListener = (prompt: InstallPromptEvent | null) => void;

let capturedInstallPrompt: InstallPromptEvent | null = null;
const installPromptListeners = new Set<InstallPromptListener>();

const notifyInstallPromptListeners = () => {
  installPromptListeners.forEach((listener) => listener(capturedInstallPrompt));
};

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  capturedInstallPrompt = event as InstallPromptEvent;
  notifyInstallPromptListeners();
});

window.addEventListener("appinstalled", () => {
  capturedInstallPrompt = null;
  notifyInstallPromptListeners();
});

const subscribeToInstallPrompt = (listener: InstallPromptListener) => {
  installPromptListeners.add(listener);
  listener(capturedInstallPrompt);
  return () => {
    installPromptListeners.delete(listener);
  };
};

export function usePwa() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(capturedInstallPrompt);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [onlineMessage, setOnlineMessage] = useState("");
  const [updated, setUpdated] = useState(false);
  const onlineTimer = useRef<number | null>(null);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isMobileInstall = isIOS || /Android/i.test(navigator.userAgent) || window.matchMedia("(max-width: 800px)").matches;
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;

  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    immediate: true,
  });

  useEffect(() => {
    document.documentElement.classList.toggle("is-standalone", isStandalone);
    return subscribeToInstallPrompt(setInstallPrompt);
  }, [isStandalone]);

  useEffect(() => {
    const handleInstalled = () => setInstalled(true);
    window.addEventListener("appinstalled", handleInstalled);
    return () => window.removeEventListener("appinstalled", handleInstalled);
  }, []);

  useEffect(() => {
    const previousVersion = localStorage.getItem(VERSION_KEY);
    localStorage.setItem(VERSION_KEY, __BUILD_VERSION__);
    if (!previousVersion || previousVersion === __BUILD_VERSION__) return;
    setUpdated(true);
    const timer = window.setTimeout(() => setUpdated(false), 4500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const update = (restored = false) => {
      if (onlineTimer.current) window.clearTimeout(onlineTimer.current);
      if (!navigator.onLine) {
        setOnlineMessage("Mode hors connexion — vos révisions restent disponibles.");
      } else if (restored) {
        setOnlineMessage("Connexion rétablie.");
        onlineTimer.current = window.setTimeout(() => setOnlineMessage(""), 2500);
      } else {
        setOnlineMessage("");
      }
    };
    const offline = () => update();
    const online = () => update(true);
    window.addEventListener("offline", offline);
    window.addEventListener("online", online);
    update();
    return () => {
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", online);
      if (onlineTimer.current) window.clearTimeout(onlineTimer.current);
    };
  }, []);

  const canInstall = !isStandalone && !installed;

  const install = async () => {
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        if (choice.outcome === "accepted") setInstalled(true);
      } catch {
        setInstallDialogOpen(true);
      } finally {
        capturedInstallPrompt = null;
        notifyInstallPromptListeners();
      }
      return;
    }
    setInstallDialogOpen(true);
  };

  return {
    canInstall,
    install,
    installDialogOpen,
    setInstallDialogOpen,
    installPlatform: isIOS ? "ios" : isMobileInstall ? "mobile" : "desktop",
    onlineMessage,
    needRefresh,
    updated,
    dismissUpdate: () => setNeedRefresh(false),
    applyUpdate: () => updateServiceWorker(true),
  };
}
