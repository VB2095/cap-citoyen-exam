import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { clearLocalData, initialProgress, loadProgress, saveProgress, THEME_KEY } from "../lib/storage";
import type { ProgressState } from "../types";

type ColorTheme = "light" | "dark";

interface AppContextValue {
  progress: ProgressState;
  setProgress: React.Dispatch<React.SetStateAction<ProgressState>>;
  colorTheme: ColorTheme;
  toggleTheme: () => void;
  resetData: () => void;
  showToast: (message: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function preferredTheme(): ColorTheme {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function AppProvider({ children }: PropsWithChildren) {
  const [progress, setProgress] = useState(loadProgress);
  const [colorTheme, setColorTheme] = useState<ColorTheme>(preferredTheme);
  const toastRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => saveProgress(progress), [progress]);

  useEffect(() => {
    document.documentElement.dataset.theme = colorTheme;
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute(
      "content",
      colorTheme === "dark" ? "#1e1e1e" : "#000091",
    );
  }, [colorTheme]);

  const showToast = useCallback((message: string) => {
    const toast = toastRef.current;
    if (!toast) return;
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toast.textContent = message;
    toast.hidden = false;
    toast.classList.add("show");
    toastTimer.current = window.setTimeout(() => {
      toast.classList.remove("show");
      window.setTimeout(() => {
        if (!toast.classList.contains("show")) toast.hidden = true;
      }, 250);
    }, 2300);
  }, []);

  const toggleTheme = useCallback(() => {
    setColorTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      return next;
    });
  }, []);

  const resetData = useCallback(() => {
    clearLocalData();
    const next = initialProgress();
    setProgress(next);
    setColorTheme(preferredTheme());
    showToast("Données locales réinitialisées");
  }, [showToast]);

  const value = useMemo(
    () => ({ progress, setProgress, colorTheme, toggleTheme, resetData, showToast }),
    [progress, colorTheme, toggleTheme, resetData, showToast],
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      <div ref={toastRef} id="toast" className="toast" role="status" aria-live="polite" hidden />
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
