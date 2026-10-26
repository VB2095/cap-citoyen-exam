import type { ExamResult, ExamSession, ProgressState } from "../types";

export const STORAGE_KEY = "cap-citoyen-progress-v1";
export const EXAM_KEY = "cap-citoyen-active-exam-v1";
export const RESULT_KEY = "cap-citoyen-last-result";
export const THEME_KEY = "cap-citoyen-theme";
export const VERSION_KEY = "cap-citoyen-app-version";

export function initialProgress(): ProgressState {
  return {
    known: [],
    review: [],
    seen: [],
    schedule: {},
    practice: { answered: 0, correct: 0 },
    exams: [],
  };
}

export function loadProgress(): ProgressState {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<ProgressState> & { lastVisit?: unknown };
    delete saved.lastVisit;
    return { ...initialProgress(), ...saved, schedule: saved.schedule ?? {} };
  } catch {
    return initialProgress();
  }
}

export function saveProgress(progress: ProgressState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function loadExam(): ExamSession | null {
  try {
    return JSON.parse(localStorage.getItem(EXAM_KEY) ?? "null") as ExamSession | null;
  } catch {
    return null;
  }
}

export function saveExam(exam: ExamSession): void {
  localStorage.setItem(EXAM_KEY, JSON.stringify(exam));
}

export function loadResult(): ExamResult | null {
  try {
    return JSON.parse(sessionStorage.getItem(RESULT_KEY) ?? "null") as ExamResult | null;
  } catch {
    return null;
  }
}

export function clearLocalData(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(EXAM_KEY);
  localStorage.removeItem(THEME_KEY);
  localStorage.removeItem(VERSION_KEY);
  sessionStorage.removeItem(RESULT_KEY);
}
