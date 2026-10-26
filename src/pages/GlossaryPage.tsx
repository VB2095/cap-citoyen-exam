import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { engine } from "../data";
import { useGlossary } from "../hooks/useGlossary";
import { normalizeSearch, scrollToElement } from "../lib/utils";

export function GlossaryPage() {
  const [params] = useSearchParams();
  const { data, error } = useGlossary();
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState("all");
  const focused = useRef(false);
  const requestedSlug = params.get("notion");

  const filtered = useMemo(() => data?.entrees.filter((entry) => {
    const searchable = normalizeSearch(`${entry.terme} ${entry.definition} ${entry.reference ?? ""}`);
    return (theme === "all" || entry.thematique === theme) && (!query || searchable.includes(normalizeSearch(query.trim())));
  }) ?? [], [data, query, theme]);

  useEffect(() => {
    if (!data || !requestedSlug || focused.current) return;
    focused.current = true;
    window.requestAnimationFrame(() => {
      const target = document.getElementById(`notion-${requestedSlug}`) as HTMLDetailsElement | null;
      if (!target) return;
      target.open = true;
      scrollToElement(target);
      target.querySelector<HTMLElement>("summary")?.focus({ preventScroll: true });
    });
  }, [data, requestedSlug]);

  if (error) return <div className="page page-narrow"><h1>Glossaire des notions civiques</h1><div className="notice notice-warning"><strong>Le glossaire n’a pas pu être chargé</strong>Vérifiez votre connexion puis rechargez cette page. S’il a déjà été ouvert, il reste normalement disponible hors connexion.</div><button className="button" type="button" onClick={() => window.location.reload()}>Réessayer</button></div>;
  if (!data) return <div className="page"><h1>Glossaire des notions civiques</h1><p className="lead">Chargement des définitions…</p><div className="glossary-loading" role="status">Préparation du glossaire</div></div>;

  const labels = Object.fromEntries(data.metadata.thematiques.map((item) => [item.id, item.libelle]));
  const entries = new Map(data.entrees.map((entry) => [entry.slug, entry]));
  const reset = () => { setQuery(""); setTheme("all"); };

  return <div className="page">
    <h1>Glossaire des notions civiques</h1><p className="lead">Retrouvez 81 notions du programme, leur définition, leur référence juridique et les concepts associés.</p>
    <div className="notice"><strong>Origine des définitions</strong>Ce glossaire est produit par <a href={data.metadata.url_producteur} target="_blank" rel="noopener noreferrer">examenciviquenaturalisation.fr <span aria-hidden="true">↗</span></a>, une initiative privée, et publié sous Licence Ouverte 2.0 sur <a href={engine.sourceUrls.glossaryData} target="_blank" rel="noopener noreferrer">data.gouv.fr <span aria-hidden="true">↗</span></a>. Il complète les sources officielles sans s’y substituer.</div>
    <div className="glossary-toolbar" role="search" aria-label="Rechercher dans le glossaire">
      <div className="field field-grow"><label htmlFor="glossary-search">Rechercher une notion</label><input id="glossary-search" type="search" placeholder="Ex. laïcité, Parlement, Sécurité sociale" autoComplete="off" aria-controls="glossary-list" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      <div className="field"><label htmlFor="glossary-theme">Thème</label><select id="glossary-theme" aria-controls="glossary-list" value={theme} onChange={(event) => setTheme(event.target.value)}><option value="all">Tous les thèmes</option>{data.metadata.thematiques.map((item) => <option value={item.id} key={item.id}>{item.libelle}</option>)}</select></div>
    </div>
    <p className="glossary-count" role="status" aria-live="polite">{filtered.length} notion{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""} sur {data.entrees.length}</p>
    <div className="glossary-list" id="glossary-list">{filtered.length ? filtered.map((entry) => {
      const related = entry.termes_lies.map((slug) => entries.get(slug)).filter(Boolean);
      return <details className="glossary-entry" id={`notion-${entry.slug}`} key={entry.slug}><summary><span className="glossary-term">{entry.terme}</span><span className="tag">{labels[entry.thematique] ?? entry.thematique}</span></summary><div className="glossary-content"><p>{entry.definition}</p><p className="glossary-reference"><strong>Référence :</strong> {entry.reference || "aucune référence juridique indiquée dans le jeu de données."}</p>{related.length > 0 && <div className="glossary-related"><strong>Notions associées</strong><div>{related.map((item) => item && <Link to={`/glossaire?notion=${encodeURIComponent(item.slug)}`} key={item.slug}>{item.terme}</Link>)}</div></div>}</div></details>;
    }) : <div className="empty"><h2>Aucune notion trouvée</h2><p>Essayez un autre mot ou affichez tous les thèmes.</p><button className="button button-secondary" type="button" onClick={reset}>Réinitialiser la recherche</button></div>}</div>
    <p className="source-note">Version {data.metadata.version} · Mise à jour du {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(`${data.metadata.date_mise_a_jour}T12:00:00`))}.</p>
  </div>;
}
