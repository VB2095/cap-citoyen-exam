import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

import { GlossaryKnowledge, ProgressBar, QuestionTags } from "../components/QuestionContent";
import { engine, getQuestion, themes } from "../data";
import { useGlossary } from "../hooks/useGlossary";
import { loadResult } from "../lib/storage";
import { percent } from "../lib/utils";
import type { PracticeQuestion } from "../types";

export function ResultsPage() {
  const navigate = useNavigate();
  useGlossary();
  const result = useMemo(loadResult, []);

  useEffect(() => {
    if (!result) navigate("/examen", { replace: true });
  }, [navigate, result]);

  if (!result) return null;
  const passed = result.score >= 32;

  return <div className="page">
    <div className="result-hero" style={{ "--result-color": passed ? "var(--green)" : "var(--orange)" } as React.CSSProperties}>
      <div className="score-ring" style={{ "--score": `${percent(result.score, 40)}%` } as React.CSSProperties}><strong>{result.score}/40</strong></div>
      <p className="eyebrow">{result.timeUp && "Temps écoulé · "}Résultat</p><h1>{passed ? "Examen blanc réussi" : "Encore un effort"}</h1>
      <p>{passed ? "Vous avez atteint le seuil de 80 %. Continuez à réviser pour stabiliser ce résultat." : `Il vous manque ${32 - result.score} bonne${32 - result.score > 1 ? "s" : ""} réponse${32 - result.score > 1 ? "s" : ""} pour atteindre le seuil.`}</p>
      <div className="actions" style={{ justifyContent: "center" }}><Link className="button" to="/examen">Nouvel examen</Link><Link className="button button-secondary" to="/reviser?filter=review">Réviser mes erreurs</Link></div>
    </div>
    <section className="breakdown"><h2>Résultat par thème</h2>{Object.entries(themes).map(([id, theme]) => {
      const ids = result.ids.filter((questionId) => getQuestion(questionId).theme === id);
      const correct = ids.filter((questionId) => result.answers[questionId] === (getQuestion(questionId) as PracticeQuestion).answer).length;
      return <div className="breakdown-row" key={id}><span>{theme.short}</span><ProgressBar value={percent(correct, ids.length) / 100} /><strong>{correct}/{ids.length}</strong></div>;
    })}</section>
    <section className="section"><div className="section-heading"><h2>Correction détaillée</h2></div><div className="review-list">{result.ids.map((id, index) => {
      const question = getQuestion(id) as PracticeQuestion;
      const choice = result.answers[id];
      const good = choice === question.answer;
      return <article className={`review-item ${good ? "good" : "bad"}`} key={`${id}-${index}`}><div><QuestionTags question={question} /></div><h3>{index + 1}. {question.q}</h3><p><strong>Votre réponse :</strong> {choice === undefined ? "Aucune réponse" : question.choices[choice]}</p>{!good && <p><strong>Bonne réponse :</strong> {question.choices[question.answer]}</p>}<p>{question.explanation}</p><GlossaryKnowledge entries={engine.glossaryEntriesForQuestion(question)} /></article>;
    })}</div></section>
  </div>;
}
