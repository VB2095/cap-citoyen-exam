import { Link } from "react-router-dom";

import { engine, themes } from "../data";
import { useSpeech } from "../hooks/useSpeech";
import type { CardQuestion, GlossaryEntry, PracticeQuestion } from "../types";

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div className="progress" aria-label={label}>
      <span style={{ "--progress": value } as React.CSSProperties} />
    </div>
  );
}

export function QuestionTags({ question, reworded = false, adapted = false }: { question: CardQuestion; reworded?: boolean; adapted?: boolean }) {
  const theme = themes[question.theme];
  return (
    <>
      <span className="tag" style={{ "--theme-color": theme.color } as React.CSSProperties}>{theme.short}</span>{" "}
      {question.official && <><span className="tag tag-official">Question officielle</span>{" "}</>}
      {question.type === "situation" && <><span className="tag tag-situation">Mise en situation · entraînement</span>{" "}</>}
      {adapted && <><span className="tag tag-official">Connaissance officielle · QCM adapté</span>{" "}</>}
      {reworded && <span className="tag tag-reworded">Formulation d’entraînement</span>}
    </>
  );
}

export function SpeechButton({ text }: { text: string }) {
  const speech = useSpeech(text);
  if (!speech.supported) return null;
  return (
    <div className="question-audio">
      <button
        className={`listen-button${speech.speaking ? " is-speaking" : ""}`}
        type="button"
        aria-label={speech.speaking ? "Arrêter la lecture de la question" : "Lire la question à voix haute"}
        aria-pressed={speech.speaking}
        onClick={speech.toggle}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4Zm11.5-.5a5 5 0 0 1 0 7l1.4 1.4a7 7 0 0 0 0-9.8l-1.4 1.4Zm2.8-2.8a9 9 0 0 1 0 12.6l1.4 1.4a11 11 0 0 0 0-15.4l-1.4 1.4Z" /></svg>
        <span>{speech.speaking ? "Arrêter" : "Écouter"}</span>
      </button>
    </div>
  );
}

export function GlossaryKnowledge({ entries }: { entries: GlossaryEntry[] }) {
  if (!entries.length) return null;
  return (
    <details className="knowledge-panel">
      <summary>Approfondir avec le glossaire · {entries.length} notion{entries.length > 1 ? "s" : ""}</summary>
      <div className="knowledge-content">
        {entries.map((entry) => (
          <article className="knowledge-entry" key={entry.slug}>
            <h4><Link to={`/glossaire?notion=${encodeURIComponent(entry.slug)}`}>{entry.terme}</Link></h4>
            <p>{entry.definition}</p>
            {entry.reference && <p className="knowledge-reference"><strong>Référence :</strong> {entry.reference}</p>}
          </article>
        ))}
        <p className="source-note">Définitions complémentaires produites par examenciviquenaturalisation.fr et publiées sous Licence Ouverte 2.0.</p>
      </div>
    </details>
  );
}

export function FlashAnswer({ question, english, glossary, onToggleEnglish }: { question: CardQuestion; english: boolean; glossary: GlossaryEntry[]; onToggleEnglish: () => void }) {
  const note = engine.pedagogicalNote(question);
  const why = engine.whyExplanation(question);
  const trap = engine.commonTrap(question);
  const external = engine.externalSource(question);
  const answer = "answers" in question ? question.answers[0] : question.choices[question.answer];
  const acceptedAnswers = "answers" in question ? question.answers.slice(1) : [];
  const context = note && note.fr !== why.fr ? (english ? note.en : note.fr) : null;
  return (
    <>
      <div className="short-answer"><span>Réponse à retenir</span><strong>{answer}</strong></div>
      {acceptedAnswers.length > 0 && (
        <details className="accepted-answers"><summary>Voir les autres formulations admises</summary><ul>{acceptedAnswers.map((item) => <li key={item}>{item}</li>)}</ul></details>
      )}
      <section className="explanation-box">
        <div className="explanation-heading">
          <h3>{english ? "To understand" : "Pour comprendre"}</h3>
          <button className="translation-button" type="button" lang={english ? "en" : "fr"} onClick={onToggleEnglish}>{english ? "Lire en français" : "Read in English"}</button>
        </div>
        <p className="explanation-main" lang={english ? "en" : "fr"}>{english ? why.en : why.fr}</p>
        {context && <p className="context-note" lang={english ? "en" : "fr"}><strong>{english ? "Useful context" : "Repère utile"}</strong>{context}</p>}
        <aside className="trap-box" lang={english ? "en" : "fr"}><strong>{english ? "Common trap" : "Piège fréquent"}</strong><p>{english ? trap.en : trap.fr}</p></aside>
      </section>
      <GlossaryKnowledge entries={glossary} />
      <div className="answer-sources">
        <a href={engine.sourceUrls[question.source]} target="_blank" rel="noopener noreferrer">{"answers" in question ? "Source de la question et attribution" : "Source officielle"} <span aria-hidden="true">↗</span></a>
        {external && <a href={external.url} target="_blank" rel="noopener noreferrer">{external.label} <span aria-hidden="true">↗</span></a>}
      </div>
      {"answers" in question && <p className="source-note">Réponse pédagogique indépendante proposée par leqcmcivique.fr ; l’administration ne publie pas de corrigé officiel.{external ? " La ressource Wikipédia apporte uniquement un contexte complémentaire." : ""}</p>}
    </>
  );
}

export function PracticeFeedback({ question, selected, reworded, glossary }: { question: PracticeQuestion; selected: number; reworded: boolean; glossary: GlossaryEntry[] }) {
  const correct = selected === question.answer;
  const why = engine.whyExplanation(question).fr;
  const trap = engine.commonTrap(question).fr;
  const external = engine.externalSource(question);
  return (
    <section className={`feedback${correct ? "" : " incorrect"}`} aria-label="Correction" tabIndex={-1}>
      <h3>{correct ? "Bonne réponse" : "Réponse incorrecte"}</h3>
      <div className="feedback-answer"><span>Réponse à retenir</span><strong>{question.choices[question.answer]}</strong></div>
      {reworded && <p className="official-wording"><strong>Formulation d’origine :</strong> {question.q}</p>}
      <div className="feedback-explanation"><strong>Pourquoi&nbsp;?</strong><p>{question.explanation}</p></div>
      {why !== question.explanation && <div className="feedback-context"><strong>Pour mieux comprendre</strong><p>{why}</p></div>}
      <aside className="trap-box"><strong>Piège fréquent</strong><p>{trap}</p></aside>
      <GlossaryKnowledge entries={glossary} />
      <div className="answer-sources">
        <a href={engine.sourceUrls[question.source]} target="_blank" rel="noopener noreferrer">Voir la source officielle <span aria-hidden="true">↗</span></a>
        {external && <a href={external.url} target="_blank" rel="noopener noreferrer">{external.label} <span aria-hidden="true">↗</span></a>}
      </div>
    </section>
  );
}
