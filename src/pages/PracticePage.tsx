import { useEffect, useMemo, useRef, useState } from "react";

import { PracticeFeedback, ProgressBar, QuestionTags, SpeechButton } from "../components/QuestionContent";
import { engine, getQuestion, qcmQuestions, themes } from "../data";
import { useApp } from "../context/AppContext";
import { useGlossary } from "../hooks/useGlossary";
import { percent, sample, unique } from "../lib/utils";
import type { PracticeQuestion } from "../types";

const letters = ["A", "B", "C", "D"];

interface PracticeSession {
  ids: string[];
  wordings: Record<string, string>;
  index: number;
  answers: number[];
  score: number;
  revealed: boolean;
}

export function PracticePage() {
  const { setProgress } = useApp();
  const { data: glossaryData } = useGlossary();
  const feedbackRef = useRef<HTMLElement>(null);
  const [theme, setTheme] = useState("all");
  const [count, setCount] = useState(10);
  const [session, setSession] = useState<PracticeSession | null>(null);

  const start = () => {
    const pool = qcmQuestions.filter((question) => theme === "all" || question.theme === theme);
    const ids = sample(pool, Math.min(count, pool.length)).map((question) => question.id);
    const wordings = Object.fromEntries(ids.map((id) => {
      const question = getQuestion(id);
      const alternate = engine.alternateWording(question.q);
      return [id, alternate !== question.q && Math.random() < 0.5 ? alternate : question.q];
    }));
    setSession({ ids, wordings, index: 0, answers: [], score: 0, revealed: false });
  };

  const question = session && session.index < session.ids.length
    ? getQuestion(session.ids[session.index]) as PracticeQuestion
    : null;
  const displayedQuestion = question && session ? session.wordings[question.id] || question.q : "";
  const reworded = Boolean(question && displayedQuestion !== question.q);
  const selected = session?.answers[session.index];
  const glossary = useMemo(() => question ? engine.glossaryEntriesForQuestion(question) : [], [question, glossaryData]);

  useEffect(() => {
    if (session?.revealed) feedbackRef.current?.focus({ preventScroll: true });
  }, [session?.revealed]);

  const answer = (choice: number) => {
    if (!session || !question || session.revealed) return;
    const correct = choice === question.answer;
    setSession({
      ...session,
      answers: Object.assign([...session.answers], { [session.index]: choice }),
      score: session.score + (correct ? 1 : 0),
      revealed: true,
    });
    setProgress((current) => ({
      ...current,
      seen: unique([...current.seen, question.id]),
      review: correct ? current.review : unique([...current.review, question.id]),
      practice: {
        answered: current.practice.answered + 1,
        correct: current.practice.correct + (correct ? 1 : 0),
      },
    }));
  };

  const next = () => {
    if (!session) return;
    setSession({ ...session, index: session.index + 1, revealed: false });
    window.requestAnimationFrame(() => document.querySelector<HTMLElement>(".question-card h2")?.focus({ preventScroll: true }));
  };

  const finished = Boolean(session && session.index >= session.ids.length);

  return (
    <div className="page">
      <p className="eyebrow">S’entraîner</p><h1>Entraînement QCM</h1>
      <p className="lead">Choisissez une série courte. La correction et l’explication apparaissent après chaque réponse.</p>
      <div className="toolbar">
        <div className="field"><label htmlFor="practice-theme">Thème</label><select id="practice-theme" value={theme} onChange={(event) => setTheme(event.target.value)}><option value="all">Tous les thèmes</option>{Object.entries(themes).map(([id, item]) => <option value={id} key={id}>{item.name}</option>)}</select></div>
        <div className="field"><label htmlFor="practice-count">Nombre de questions</label><select id="practice-count" value={count} onChange={(event) => setCount(Number(event.target.value))}><option>5</option><option>10</option><option>20</option></select></div>
        <button className="button" type="button" onClick={start}>Commencer</button>
      </div>
      <div>
        {finished && session ? <div className="result-hero" style={{ "--result-color": session.score >= session.ids.length * 0.8 ? "var(--green)" : "var(--orange)" } as React.CSSProperties}>
          <p className="eyebrow">Série terminée</p><h2>{session.score}/{session.ids.length} bonnes réponses</h2>
          <p>{session.score >= session.ids.length * 0.8 ? "Très bon résultat. Continuez à consolider vos acquis." : "Repérez les notions à revoir, puis tentez une nouvelle série."}</p>
          <button className="button" type="button" onClick={start}>Nouvelle série</button>
        </div> : question && session ? <div className="question-shell">
          <div className="question-topbar"><span>Question {session.index + 1}/{session.ids.length}</span><strong>{session.score} bonne{session.score > 1 ? "s" : ""} réponse{session.score > 1 ? "s" : ""}</strong></div>
          <ProgressBar value={percent(session.index, session.ids.length) / 100} />
          <article className="question-card">
            <div><QuestionTags question={question} reworded={reworded} /></div><SpeechButton text={displayedQuestion} />
            <h2 tabIndex={-1}>{displayedQuestion}</h2>
            <div className="choices">{question.choices.map((choice, index) => <button className={`choice${session.revealed ? index === question.answer ? " correct" : index === selected ? " incorrect" : "" : ""}`} type="button" disabled={session.revealed} onClick={() => answer(index)} key={choice}><span className="choice-letter">{letters[index]}</span><span>{choice}</span></button>)}</div>
            {session.revealed && selected !== undefined && <div ref={(node) => { feedbackRef.current = node?.querySelector(".feedback") ?? null; }}><PracticeFeedback question={question} selected={selected} reworded={reworded} glossary={glossary} /></div>}
            <div className="question-nav"><span />{session.revealed && <button className="button" type="button" onClick={next}>Question suivante →</button>}</div>
          </article>
        </div> : null}
      </div>
    </div>
  );
}
