import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ProgressBar, QuestionTags, SpeechButton } from "../components/QuestionContent";
import { engine, getQuestion, qcmQuestions } from "../data";
import { useApp } from "../context/AppContext";
import { EXAM_KEY, loadExam, RESULT_KEY, saveExam } from "../lib/storage";
import { percent, sample, scrollToElement, shuffle, unique } from "../lib/utils";
import type { ExamMode, ExamResult, ExamSession, PracticeQuestion } from "../types";

const letters = ["A", "B", "C", "D"];

function createExam(mode: ExamMode): ExamSession {
  const pool = (theme: string, type: string) => qcmQuestions.filter((question) => question.theme === theme && question.type === type);
  const picked = mode === "official"
    ? [...sample(pool("t1", "knowledge"), 11), ...sample(pool("t2", "knowledge"), 6), ...sample(pool("t3", "knowledge"), 11), ...sample(pool("t4", "knowledge"), 8), ...sample(pool("t5", "knowledge"), 4)]
    : [...sample(pool("t1", "knowledge"), 5), ...sample(pool("t1", "situation"), 6), ...sample(pool("t2", "knowledge"), 6), ...sample(pool("t3", "knowledge"), 5), ...sample(pool("t3", "situation"), 6), ...sample(pool("t4", "knowledge"), 8), ...sample(pool("t5", "knowledge"), 4)];
  const ids = shuffle(picked).map((question) => question.id);
  const wordings = Object.fromEntries(ids.map((id) => {
    const question = getQuestion(id);
    const alternate = engine.alternateWording(question.q);
    return [id, mode === "mixed" && alternate !== question.q && Math.random() < 0.35 ? alternate : question.q];
  }));
  return { mode, ids, wordings, answers: {}, flagged: [], index: 0, startedAt: Date.now(), duration: 45 * 60 * 1000 };
}

function ModeNote({ mode }: { mode: ExamMode }) {
  return mode === "official" ? <><strong>Connaissances officielles uniquement</strong>Ce tirage exclut les situations d’entraînement. Les notions viennent de la liste publique du ministère ; leur présentation et les choix de réponses sont adaptés au format QCM, car le questionnaire complet de l’examen n’est pas publié.</>
    : <><strong>Simulation pédagogique mixte</strong>Le tirage associe des questions de connaissance issues de la liste publique et des mises en situation originales, signalées comme telles.</>;
}

export function ExamPage() {
  const navigate = useNavigate();
  const { setProgress } = useApp();
  const [activeExam, setActiveExam] = useState<ExamSession | null>(loadExam);
  const [exam, setExamState] = useState<ExamSession | null>(null);
  const [mode, setMode] = useState<ExamMode>(() => activeExam?.mode ?? "mixed");
  const [remaining, setRemaining] = useState(() => exam ? Math.max(0, exam.duration - (Date.now() - exam.startedAt)) : 45 * 60 * 1000);
  const mapRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  const persist = useCallback((next: ExamSession) => {
    saveExam(next);
    setActiveExam(next);
    setExamState(next);
  }, []);

  const finish = useCallback((timeUp: boolean) => {
    if (!exam) return;
    const score = exam.ids.reduce((sum, id) => sum + (exam.answers[id] === (getQuestion(id) as PracticeQuestion).answer ? 1 : 0), 0);
    const result: ExamResult = { date: new Date().toISOString(), score, ids: exam.ids, answers: exam.answers, timeUp, mode: exam.mode };
    setProgress((current) => ({
      ...current,
      exams: [...current.exams, { date: result.date, score, mode: result.mode }].slice(-20),
      seen: unique([...current.seen, ...exam.ids]),
      review: unique([...current.review, ...exam.ids.filter((id) => exam.answers[id] !== (getQuestion(id) as PracticeQuestion).answer)]),
    }));
    localStorage.removeItem(EXAM_KEY);
    sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
    setActiveExam(null);
    setExamState(null);
    navigate("/resultats");
  }, [exam, navigate, setProgress]);

  useEffect(() => {
    if (!exam) return;
    const update = () => {
      const left = Math.max(0, exam.duration - (Date.now() - exam.startedAt));
      setRemaining(left);
      if (!left) finish(true);
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [exam?.startedAt, exam?.duration, finish]);

  useEffect(() => {
    const current = mapRef.current?.querySelector<HTMLElement>('[aria-current="step"]');
    const map = mapRef.current;
    if (!map || !current || map.scrollWidth <= map.clientWidth) return;
    map.scrollTo({ left: Math.max(0, current.offsetLeft - (map.clientWidth - current.offsetWidth) / 2), behavior: "auto" });
  }, [exam?.index]);

  const question = exam ? getQuestion(exam.ids[exam.index]) as PracticeQuestion : null;
  const displayedQuestion = question && exam ? exam.wordings[question.id] || question.q : "";
  const reworded = Boolean(question && displayedQuestion !== question.q);

  const goTo = (index: number) => {
    if (!exam) return;
    persist({ ...exam, index });
    window.requestAnimationFrame(() => scrollToElement(shellRef.current, false));
  };

  if (!exam) {
    return <div className="page page-narrow">
      <p className="eyebrow">Conditions réelles</p><h1>Examen blanc</h1><p className="lead">Un tirage de 40 questions, 45 minutes et une seule bonne réponse par question.</p>
      {activeExam && <div className="notice"><strong>Une session est en cours</strong>Vous pouvez reprendre exactement là où vous vous êtes arrêté.</div>}
      <div className="grid"><div className="card"><span className="card-icon">40</span><h2 className="card-title">40 questions</h2><p>Selon la répartition officielle entre les cinq thèmes.</p></div><div className="card"><span className="card-icon">45</span><h2 className="card-title">45 minutes</h2><p>Le chronomètre continue si vous rechargez la page.</p></div><div className="card"><span className="card-icon">80</span><h2 className="card-title">80 % requis</h2><p>Il faut obtenir au moins 32 réponses correctes.</p></div></div>
      <div className="toolbar"><div className="field field-grow"><label htmlFor="exam-mode">Contenu de l’examen</label><select id="exam-mode" value={mode} onChange={(event) => setMode(event.target.value as ExamMode)}><option value="mixed">Mixte : connaissances + situations</option><option value="official">Connaissances officielles uniquement</option></select></div></div>
      <div className="notice notice-warning" aria-live="polite"><ModeNote mode={mode} /></div>
      <div className="actions">
        {activeExam && <button className="button" type="button" onClick={() => setExamState(activeExam)}>Reprendre l’examen</button>}
        <button className={activeExam ? "button button-secondary" : "button"} type="button" onClick={() => { if (!activeExam || window.confirm("Recommencer supprimera la session actuelle. Continuer ?")) persist(createExam(mode)); }}>{activeExam ? "Recommencer" : "Démarrer l’examen"}</button>
      </div>
    </div>;
  }

  if (!question) return null;
  const selected = exam.answers[question.id];
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const unanswered = 40 - Object.keys(exam.answers).length;

  return <div className="page page-narrow exam-page"><div className="question-shell exam-question-shell" ref={shellRef}>
    <div className="question-topbar"><div><strong>Examen blanc</strong><br /><span>Question {exam.index + 1} sur 40</span></div><span className={`timer${remaining < 5 * 60 * 1000 ? " warning" : ""}`} role="timer">{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</span></div>
    <ProgressBar value={percent(Object.keys(exam.answers).length, 40) / 100} />
    <div className="exam-map" ref={mapRef} aria-label="Navigation entre les questions">{exam.ids.map((id, index) => <button type="button" key={`${id}-${index}`} className={`${index === exam.index ? "current" : ""} ${exam.answers[id] !== undefined ? "answered" : ""} ${exam.flagged.includes(id) ? "flagged" : ""}`} aria-label={`Question ${index + 1}${exam.answers[id] !== undefined ? ", répondue" : ""}`} aria-current={index === exam.index ? "step" : undefined} onClick={() => goTo(index)}>{index + 1}</button>)}</div>
    <article className="question-card">
      <div><QuestionTags question={question} reworded={reworded} adapted={exam.mode === "official"} /></div><SpeechButton text={displayedQuestion} /><h2 tabIndex={-1}>{displayedQuestion}</h2>
      <div className="choices">{question.choices.map((choice, index) => <button className={`choice${selected === index ? " selected" : ""}`} type="button" aria-pressed={selected === index} key={choice} onClick={() => persist({ ...exam, answers: { ...exam.answers, [question.id]: index } })}><span className="choice-letter">{letters[index]}</span><span>{choice}</span></button>)}</div>
      <button className="flag-button" type="button" onClick={() => persist({ ...exam, flagged: exam.flagged.includes(question.id) ? exam.flagged.filter((id) => id !== question.id) : [...exam.flagged, question.id] })}>{exam.flagged.includes(question.id) ? "Retirer le repère" : "Marquer pour y revenir"}</button>
      <div className="question-nav"><button className="button button-ghost" type="button" disabled={exam.index === 0} onClick={() => goTo(exam.index - 1)}>← Précédente</button>{exam.index === 39 ? <button className="button" type="button" onClick={() => { if (!unanswered || window.confirm(`Il reste ${unanswered} question${unanswered > 1 ? "s" : ""} sans réponse. Terminer quand même ?`)) finish(false); }}>Terminer l’examen</button> : <button className="button" type="button" onClick={() => goTo(exam.index + 1)}>Suivante →</button>}</div>
    </article>
  </div></div>;
}
