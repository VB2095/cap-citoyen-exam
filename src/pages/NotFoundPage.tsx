import { Link } from "react-router-dom";

export function NotFoundPage() {
  return <div className="page page-narrow"><div className="empty"><p className="eyebrow">Erreur 404</p><h1>Cette page n’existe pas</h1><Link className="button" to="/">Retour à l’accueil</Link></div></div>;
}
