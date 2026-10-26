import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { FlashAnswer, ProgressBar, QuestionTags, SpeechButton } from "../components/QuestionContent";
import { cardQuestions, engine, getQuestion, reviewableQuestions, themes } from "../data";
import { useApp } from "../context/AppContext";
import { useGlossary } from "../hooks/useGlossary";
import { applyCardRating, intervalForRating, intervalLabel } from "../lib/repetition";
import { percent, scrollToElement, shuffle, unique } from "../lib/utils";
import type { Rating } from "../types";

interface FlashSession {
  ids: string[];
  wordings: Record<string, string>;
  translations: Record<string, boolean>;
  index: number;
  revealed: boolean;
}

const emptySession: FlashSession = { ids: [], wordings: {}, translations: {}, index: 0, revealed: false };

export function RevisePage() {
  const [params] = useSearchParams();
  const { progress, setProgress, showToast } = useApp();
  const { data: glossaryData } = useGlossary();
  const zoneRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState(() => params.get("theme") && themes[params.get("theme") as keyof typeof themes] ? params.get("theme")! : "all");
  const [filter, setFilter] = useState(() => ["all", "review", "due", "unseen", "known"].includes(params.get("filter") ?? "") ? params.get("filter")! : "all");
  const [origin, setOrigin] = useState("all");
  const [wording, setWording] = useState("mixed");
  const [session, setSession] = useState<FlashSession>(emptySession);

  const isDue = useCallback((id: string) => {
    const dueAt = progress.schedule[id]?.dueAt;
    return Boolean(dueAt && new Date(dueAt).getTime() <= Date.now());
  }, [progress.schedule]);

  const start = useCallback((scroll = false) => {
    let pool = (["review", "due"].includes(filter) ? reviewableQuestions : cardQuestions)
      .filter((question) => theme === "all" || question.theme === theme);
    if (origin === "official") pool = pool.filter((question) => question.official);
    if (origin === "training") pool = pool.filter((question) => question.type === "situation");
    if (filter === "review") pool = pool.filter((question) => progress.review.includes(question.id) || isDue(question.id));
    if (filter === "due") pool = pool.filter((question) => isDue(question.id));
    if (filter === "unseen") pool = pool.filter((question) => !progress.seen.includes(question.id));
    if (filter === "known") pool = pool.filter((question) => progress.known.includes(question.id));
    const ids = shuffle(pool).map((question) => question.id);
    const wordings = Object.fromEntries(ids.map((id) => {
      const question = getQuestion(id);
      const alternate = engine.alternateWording(question.q);
      const useAlternate = wording === "alternate" || (wording === "mixed" && Math.random() < 0.5);
      return [id, useAlternate ? alternate : question.q];
    }));
    setSession({ ids, wordings, translations: {}, index: 0, revealed: false });
    if (scroll && window.matchMedia("(max-width: 800px)").matches) {
      window.requestAnimationFrame(() => scrollToElement(zoneRef.current));
    }
  }, [filter, isDue, origin, progress.known, progress.review, progress.seen, theme, wording]);

  useEffect(() => { start(false); }, []); // Keep the initial session stable while filters are edited.

  const question = session.index < session.ids.length ? getQuestion(session.ids[session.index]) : null;
  const displayedQuestion = question ? session.wordings[question.id] || question.q : "";
  const isReworded = Boolean(question && displayedQuestion !== question.q);
  const glossary = useMemo(() => question ? engine.glossaryEntriesForQuestion(question) : [], [question, glossaryData]);

  const goTo = (index: number) => {
    setSession((current) => ({ ...current, index, revealed: false }));
    if (window.matchMedia("(max-width: 800px)").matches) window.requestAnimationFrame(() => scrollToElement(zoneRef.current));
  };

  const reveal = () => {
    if (!question) return;
    setProgress((current) => ({ ...current, seen: unique([...current.seen, question.id]) }));
    setSession((current) => ({ ...current, revealed: true }));
    if (window.matchMedia("(max-width: 800px)").matches) {
      window.requestAnimationFrame(() => scrollToElement(answerRef.current));
    }
  };

  const rate = (rating: Rating) => {
    if (!question) return;
    const intervalDays = intervalForRating(progress, question.id, rating);
    setProgress((current) => {
      return applyCardRating(current, question.id, rating).progress;
    });
    setSession((current) => {
      const ids = [...current.ids];
      if (rating === "again" && !ids.slice(current.index + 1).includes(question.id)) {
        ids.splice(Math.min(current.index + 4, ids.length), 0, question.id);
      }
      return { ...current, ids, index: current.index + 1, revealed: false };
    });
    showToast(rating === "again" ? "Cette carte reviendra dans quelques minutes" : rating === "hard" ? "Révision programmée pour demain" : `Révision programmée dans ${intervalDays} jours`);
    window.requestAnimationFrame(() => scrollToElement(zoneRef.current));
  };

  const status = question ? progress.known.includes(question.id) ? "✓ Maîtrisée"
    : !progress.seen.includes(question.id) ? "Nouvelle"
      : isDue(question.id) ? progress.schedule[question.id]?.lastRating === "again" ? "À revoir maintenant" : "Révision prévue aujourd’hui"
        : progress.schedule[question.id]?.repetitions >= 2 ? "À consolider" : "En apprentissage" : "";

  return (
    <div className="page">
      <p className="eyebrow">Mémoriser</p><h1>Réviser avec les flashcards</h1>
      <p className="lead">Parcourez les 258 questions de connaissance de la liste officielle et les mises en situation d’entraînement. Après chaque réponse, indiquez votre niveau : la prochaine révision sera automatiquement programmée sur cet appareil.</p>
      <div className="toolbar">
        <div className="field"><label htmlFor="flash-theme">Thème</label><select id="flash-theme" value={theme} onChange={(event) => setTheme(event.target.value)}><option value="all">Tous les thèmes</option>{Object.entries(themes).map(([id, item]) => <option value={id} key={id}>{item.name}</option>)}</select></div>
        <div className="field"><label htmlFor="flash-filter">Cartes à afficher</label><select id="flash-filter" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Toutes les cartes</option><option value="review">À revoir</option><option value="due">Prévues aujourd’hui</option><option value="unseen">Pas encore vues</option><option value="known">Maîtrisées</option></select></div>
        <div className="field"><label htmlFor="flash-origin">Origine</label><select id="flash-origin" value={origin} onChange={(event) => setOrigin(event.target.value)}><option value="all">Officielles + entraînement</option><option value="official">Questions officielles uniquement</option><option value="training">Situations d’entraînement uniquement</option></select></div>
        <div className="field"><label htmlFor="flash-wording">Formulation</label><select id="flash-wording" value={wording} onChange={(event) => setWording(event.target.value)}><option value="mixed">Mixte : d’origine et reformulée</option><option value="original">Toujours la formulation d’origine</option><option value="alternate">Reformulée si disponible</option></select></div>
        <button className="button" type="button" onClick={() => start(true)}>Lancer la révision</button>
      </div>
      <div id="flash-zone" ref={zoneRef}>
        {!session.ids.length ? <div className="empty"><h2>Aucune carte ici</h2><p>Essayez un autre filtre ou un autre thème.</p></div>
          : !question ? <div className="result-hero" style={{ "--result-color": "var(--green)" } as React.CSSProperties}><p className="eyebrow">Session terminée</p><h2>Révision enregistrée</h2><p>Les prochaines cartes seront proposées selon vos réponses et leur date de révision.</p><button className="button" type="button" onClick={() => start(true)}>Nouvelle session</button></div>
            : <div className="study-shell">
              <div className="study-meta"><span>Carte {session.index + 1} sur {session.ids.length}</span><span>{status}</span></div>
              <ProgressBar value={percent(session.index + 1, session.ids.length) / 100} />
              <article className="flashcard" aria-labelledby="flash-question">
                <div className="flash-tags"><QuestionTags question={question} reworded={isReworded} /></div>
                <SpeechButton text={displayedQuestion} />
                <h2 id="flash-question" tabIndex={-1}>{displayedQuestion}</h2>
                {session.revealed ? <div ref={answerRef} className="answer" aria-label="Réponse affichée">
                  {isReworded && <p className="official-wording"><strong>Formulation officielle :</strong> {question.q}</p>}
                  <FlashAnswer question={question} english={Boolean(session.translations[question.id])} glossary={glossary} onToggleEnglish={() => setSession((current) => ({ ...current, translations: { ...current.translations, [question.id]: !current.translations[question.id] } }))} />
                </div> : <button className="button button-secondary reveal-button" type="button" aria-expanded="false" onClick={reveal}>Afficher la réponse</button>}
              </article>
              {session.revealed && <fieldset className="rating-panel"><legend>Comment évaluez-vous votre réponse&nbsp;?</legend><div className="rating-grid">
                {(["again", "hard", "good", "easy"] as Rating[]).map((rating) => <button className={`rating-button rating-${rating}`} type="button" key={rating} onClick={() => rate(rating)}><strong>{{ again: "Je ne savais pas", hard: "Presque", good: "Je savais", easy: "Trop facile" }[rating]}</strong><small>{intervalLabel(progress, question.id, rating)}</small></button>)}
              </div></fieldset>}
              <div className="study-controls"><button className="button button-ghost" type="button" disabled={session.index === 0} onClick={() => goTo(session.index - 1)}>← Précédente</button><button className="button button-ghost" type="button" disabled={session.index === session.ids.length - 1} onClick={() => goTo(session.index + 1)}>Suivante →</button></div>
            </div>}
      </div>
    </div>
  );
}
