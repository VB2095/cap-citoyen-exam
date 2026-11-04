import { engine, sources } from "../data";

export function SourcesPage() {
  return <div className="page page-narrow">
    <p className="eyebrow">Transparence</p><h1>Sources officielles</h1><p className="lead">Le contenu pédagogique a été élaboré à partir des documents officiels disponibles au 23 octobre 2026.</p>
    <div className="source-list">
      <Source title={sources.livret} text="Socle de connaissances sur les valeurs, l’histoire, les institutions et la vie en France." href={engine.sourceUrls.livret} label="Consulter sur Légifrance" />
      <Source title={sources.arrete} text="Format du QCM, durée, seuil de réussite et répartition des questions." href={engine.sourceUrls.arrete} label="Consulter sur Légifrance" />
      <Source title={sources.questions} text="Intitulés publics des questions de connaissance classés par thème." href={engine.sourceUrls.questions} label="Consulter sur le site du ministère" />
      <Source title={sources.procedure} text="Informations pratiques concernant l’examen et l’accès à la nationalité française." href={engine.sourceUrls.procedure} label="Consulter sur le site du ministère" />
      <Source title="Jeu de données structuré et réponses pédagogiques" text="Les 258 intitulés sont issus de la liste ministérielle. Les réponses proposées par leqcmcivique.fr sont indépendantes et diffusées sous Licence Ouverte 2.0." href={engine.sourceUrls.officialData} label="Consulter sur data.gouv.fr" />
      <Source title="Glossaire des notions civiques" text="Les 81 définitions, références juridiques et relations entre notions sont produites par examenciviquenaturalisation.fr, une initiative privée, et diffusées sous Licence Ouverte 2.0." href={engine.sourceUrls.glossaryData} label="Consulter le jeu de données sur data.gouv.fr" />
      <Source title="Ressources d’approfondissement" text="Un lien Wikipédia est proposé uniquement lorsqu’un article précis a été associé à la notion. Les recherches automatiques trop larges ont été supprimées. Cette ressource encyclopédique complète la révision, mais ne remplace jamais les textes officiels." href="https://fr.wikipedia.org" label="Consulter Wikipédia" />
    </div>
    <div className="notice notice-warning"><strong>Important</strong>Cap Citoyen est un outil indépendant et non officiel. Les mises en situation proposées sont des créations pédagogiques : les questions officielles de mise en situation ne sont pas rendues publiques.</div>
  </div>;
}

function Source({ title, text, href, label }: { title: string; text: string; href: string; label: string }) {
  return <article className="source-item"><h3>{title}</h3><p>{text}</p><a href={href} target="_blank" rel="noopener noreferrer">{label} <span aria-hidden="true">↗</span></a></article>;
}
