import { Link } from "react-router-dom";

import { cardQuestions, reviewableQuestions, themes } from "../data";
import { useApp } from "../context/AppContext";
import { percent } from "../lib/utils";

export function HomePage() {
  const { progress } = useApp();
  const reviewCount = reviewableQuestions.filter((question) => progress.review.includes(question.id)
    || Boolean(progress.schedule[question.id]?.dueAt && new Date(progress.schedule[question.id].dueAt).getTime() <= Date.now())).length;
  const best = progress.exams.length ? Math.max(...progress.exams.map((exam) => exam.score)) : null;
  const last = progress.exams.at(-1);

  return (
    <div className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Examen civique · Naturalisation</p>
          <h1>Les bons repères pour réussir.</h1>
          <p className="lead">Révisez à votre rythme avec des cartes simples, puis testez-vous dans les conditions de l’examen.</p>
          <div className="actions">
            <Link className="button" to="/reviser">Commencer à réviser <span aria-hidden="true">→</span></Link>
            <Link className="button button-secondary" to="/examen">Passer un examen blanc</Link>
          </div>
        </div>
        <aside className="hero-card" aria-label="Format officiel de l’examen">
          <span className="exam-number">40</span><p>questions à choix multiples</p><hr />
          <div className="exam-facts">
            <div><strong>45 min</strong><span>maximum</span></div>
            <div><strong>32/40</strong><span>pour réussir</span></div>
            <div><strong>5</strong><span>thématiques</span></div>
          </div>
        </aside>
      </section>

      <section className="section" aria-labelledby="progress-title">
        <div className="section-heading"><div><p className="eyebrow">Votre progression</p><h2 id="progress-title">Reprenez là où vous en étiez</h2></div></div>
        <div className="stat-grid">
          <div className="stat"><strong>{progress.known.length}</strong><span>cartes maîtrisées</span></div>
          {reviewCount ? (
            <Link className="stat stat-link" to="/reviser?filter=review" aria-label={`Réviser les ${reviewCount} cartes à revoir`}>
              <strong>{reviewCount}</strong><span>carte{reviewCount > 1 ? "s" : ""} à revoir</span><small>Réviser maintenant <span aria-hidden="true">→</span></small>
            </Link>
          ) : (
            <div className="stat stat-empty"><strong>0</strong><span>carte à revoir</span><small>Aucune carte en attente</small></div>
          )}
          <div className="stat"><strong>{progress.seen.length}</strong><span>notions consultées</span></div>
          <div className="stat"><strong>{best === null ? "—" : `${best}/40`}</strong><span>meilleur examen</span></div>
        </div>
        {last && <p>Dernier examen blanc : <strong>{last.score}/40</strong> le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(last.date))}.</p>}
      </section>

      <section className="section" aria-labelledby="themes-title">
        <div className="section-heading"><div><p className="eyebrow">Programme officiel</p><h2 id="themes-title">Réviser par thème</h2></div><Link to="/reviser">Voir toutes les cartes</Link></div>
        <div className="grid">
          {Object.entries(themes).map(([id, theme], index) => {
            const pool = cardQuestions.filter((question) => question.theme === id);
            const officialCount = pool.filter((question) => question.official).length;
            const situationCount = pool.filter((question) => question.type === "situation").length;
            const mastered = pool.filter((question) => progress.known.includes(question.id)).length;
            return (
              <Link className="card card-link" style={{ "--theme-color": theme.color } as React.CSSProperties} to={`/reviser?theme=${id}`} key={id}>
                <span className="card-icon">{index + 1}</span><h3>{theme.name}</h3>
                <p>{officialCount} questions officielles{situationCount ? ` + ${situationCount} situations d’entraînement` : ""}</p>
                <p>{mastered} carte{mastered > 1 ? "s" : ""} maîtrisée{mastered > 1 ? "s" : ""} sur {pool.length}</p>
                <Progress value={percent(mastered, pool.length) / 100} label={`${percent(mastered, pool.length)} % maîtrisé`} />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="notice"><strong>Couverture intégrale</strong>Les 258 questions de connaissance publiées pour la naturalisation sont intégrées aux flashcards. Les réponses sont pédagogiques : l’administration publie les questions, mais pas de corrigé officiel. <Link to="/glossaire">Consulter également le glossaire des 81 notions civiques</Link>.</div>
        <div className="notice notice-warning"><strong>Bon à savoir</strong>Les questions officielles de mise en situation ne sont pas publiques. Celles proposées ici sont des exercices originaux signalés comme tels.</div>
      </section>
    </div>
  );
}

function Progress({ value, label }: { value: number; label: string }) {
  return <div className="progress" aria-label={label}><span style={{ "--progress": value } as React.CSSProperties} /></div>;
}
