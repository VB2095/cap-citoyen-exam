import { useEffect, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

import { VERSION_KEY } from "../lib/storage";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePwa() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [iosDialogOpen, setIosDialogOpen] = useState(false);
  const [onlineMessage, setOnlineMessage] = useState("");
  const [updated, setUpdated] = useState(false);
  const onlineTimer = useRef<number | null>(null);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;

  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    immediate: true,
  });

  useEffect(() => {
    document.documentElement.classList.toggle("is-standalone", isStandalone);
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const installed = () => setInstallPrompt(null);
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", installed);
    };
  }, [isStandalone]);

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

  const canInstall = !isStandalone && (Boolean(installPrompt) || isIOS);

  const install = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      return;
    }
    if (isIOS) setIosDialogOpen(true);
  };

  return {
    canInstall,
    install,
    iosDialogOpen,
    setIosDialogOpen,
    onlineMessage,
    needRefresh,
    updated,
    dismissUpdate: () => setNeedRefresh(false),
    applyUpdate: () => updateServiceWorker(true),
  };
}
