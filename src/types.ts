export type ThemeId = "t1" | "t2" | "t3" | "t4" | "t5";
export type Rating = "again" | "hard" | "good" | "easy";
export type ExamMode = "mixed" | "official";

export interface Theme {
  name: string;
  short: string;
  color: string;
}

export interface PracticeQuestion {
  id: string;
  theme: ThemeId;
  type: "knowledge" | "situation";
  q: string;
  choices: string[];
  answer: number;
  explanation: string;
  source: string;
  official?: false;
}

export interface OfficialQuestion {
  id: string;
  officialId: number;
  theme: ThemeId;
  type: "knowledge";
  official: true;
  q: string;
  answers: string[];
  source: "officialData";
}

export type CardQuestion = PracticeQuestion | OfficialQuestion;

export interface ScheduleItem {
  repetitions: number;
  intervalDays: number;
  lapses: number;
  lastRating: Rating;
  lastReviewedAt: string;
  dueAt: string;
}

export interface ProgressState {
  known: string[];
  review: string[];
  seen: string[];
  schedule: Record<string, ScheduleItem>;
  practice: { answered: number; correct: number };
  exams: Array<{ date: string; score: number; mode?: ExamMode }>;
}

export interface ExamSession {
  mode: ExamMode;
  ids: string[];
  wordings: Record<string, string>;
  answers: Record<string, number>;
  flagged: string[];
  index: number;
  startedAt: number;
  duration: number;
}

export interface ExamResult {
  date: string;
  score: number;
  ids: string[];
  answers: Record<string, number>;
  timeUp: boolean;
  mode: ExamMode;
}

export interface GlossaryEntry {
  terme: string;
  slug: string;
  definition: string;
  reference?: string;
  thematique: string;
  termes_lies: string[];
}

export interface GlossaryData {
  metadata: {
    version: string;
    date_mise_a_jour: string;
    url_producteur: string;
    thematiques: Array<{ id: string; libelle: string }>;
  };
  entrees: GlossaryEntry[];
}

export interface CivicEngine {
  sourceUrls: Record<string, string>;
  pedagogicalNote: (question: CardQuestion) => { fr: string; en: string } | null;
  whyExplanation: (question: CardQuestion) => { fr: string; en: string };
  commonTrap: (question: CardQuestion) => { fr: string; en: string };
  externalSource: (question: CardQuestion) => { url: string; label: string } | null;
  alternateWording: (question: string) => string;
  loadGlossaryData: () => Promise<GlossaryData>;
  glossaryEntriesForQuestion: (question: CardQuestion, limit?: number) => GlossaryEntry[];
}

declare global {
  interface Window {
    CIVIC_DATA: {
      themes: Record<ThemeId, Theme>;
      sources: Record<string, string>;
      questions: PracticeQuestion[];
    };
    OFFICIAL_CIVIC_BANK: {
      metadata: Record<string, string>;
      questions: OfficialQuestion[];
    };
  }
}
