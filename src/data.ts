import "../official-bank.js";
import "../questions.js";
import * as knowledgeEngine from "./knowledge-engine.js";

import type { CardQuestion, CivicEngine, PracticeQuestion } from "./types";

export const themes = window.CIVIC_DATA.themes;
export const sources = window.CIVIC_DATA.sources;
export const qcmQuestions = window.CIVIC_DATA.questions;
export const officialQuestions = window.OFFICIAL_CIVIC_BANK.questions;
export const situationQuestions = qcmQuestions.filter((question) => question.type === "situation");
export const cardQuestions: CardQuestion[] = [...officialQuestions, ...situationQuestions];
export const reviewableQuestions: CardQuestion[] = [
  ...cardQuestions,
  ...qcmQuestions.filter((question) => !cardQuestions.some((card) => card.id === question.id)),
];
export const engine = knowledgeEngine as unknown as CivicEngine;

export function getQuestion(id: string): CardQuestion | PracticeQuestion {
  const question = cardQuestions.find((item) => item.id === id)
    ?? qcmQuestions.find((item) => item.id === id);
  if (!question) throw new Error(`Unknown question: ${id}`);
  return question;
}
