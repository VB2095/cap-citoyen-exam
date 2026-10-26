import { useNavigate } from "react-router-dom";

import { useApp } from "../context/AppContext";

export function PrivacyPage() {
  const navigate = useNavigate();
  const { resetData } = useApp();
  const erase = () => {
    if (!window.confirm("Effacer la progression, l’examen en cours et les préférences enregistrées sur cet appareil ?")) return;
    resetData();
    navigate("/");
  };
  return <div className="page page-narrow">
    <p className="eyebrow">Vie privée</p><h1>Vos révisions restent sur votre appareil</h1><p className="lead">Cap Citoyen ne demande pas de compte et n’utilise ni publicité, ni outil de mesure d’audience, ni traceur de profilage.</p>
    <div className="privacy-list">
      <section className="privacy-section"><h2>Données enregistrées localement</h2><p>Votre progression, les cartes à revoir, les échéances de répétition espacée, la session d’examen en cours, votre préférence de thème et la version technique de l’application sont enregistrées dans le stockage de votre navigateur.</p><p>Ces informations servent uniquement à retrouver votre parcours sur cet appareil. Le code de Cap Citoyen ne les transmet à aucun serveur et ne peut pas les synchroniser avec un autre appareil.</p></section>
      <section className="privacy-section"><h2>Mode hors connexion</h2><p>L’application conserve dans un cache technique les fichiers publics nécessaires à son fonctionnement : pages, styles, scripts, icônes, banque de questions et glossaire. Ce cache ne contient pas votre identité ni votre progression.</p><p>Il permet d’ouvrir les flashcards et les examens blancs sans connexion. Le navigateur le remplace lorsqu’une nouvelle version de l’application est disponible.</p></section>
      <section className="privacy-section"><h2>Hébergement et liens externes</h2><p>Le site est distribué par Netlify. Comme tout hébergeur, Netlify peut traiter les données techniques nécessaires à la livraison et à la sécurisation du service selon sa propre politique de confidentialité.</p><p>Les sites externes cités dans les sources ne sont contactés que lorsque vous choisissez d’ouvrir leurs liens.</p><p><a href="https://www.netlify.com/privacy/" target="_blank" rel="noopener noreferrer">Consulter la politique de confidentialité de Netlify <span aria-hidden="true">↗</span></a></p></section>
      <section className="privacy-section"><h2>Consentement et suppression</h2><p>Le stockage utilisé est limité aux fonctions demandées — mémoriser votre progression, votre présentation et rendre l’application disponible hors ligne. Aucun bandeau de consentement publicitaire ou statistique n’est donc affiché.</p><p><a href="https://www.cnil.fr/fr/cookies-et-autres-traceurs/que-dit-la-loi" target="_blank" rel="noopener noreferrer">Comprendre les règles relatives aux traceurs sur le site de la CNIL <span aria-hidden="true">↗</span></a></p><p>Vous pouvez réinitialiser vos données ci-dessous ou supprimer toutes les données du site depuis les réglages de votre navigateur. Désinstaller l’application ne supprime pas nécessairement les données du navigateur associé.</p><button className="button button-danger" type="button" onClick={erase}>Effacer ma progression et mes préférences</button></section>
    </div>
    <div className="notice"><strong>Notre engagement actuel</strong>Si un outil d’analyse, une publicité, un compte utilisateur ou une synchronisation en ligne est ajouté ultérieurement, cette page et le mécanisme de consentement seront réévalués avant sa mise en service.</div>
    <p className="source-note">Dernière mise à jour : 23 octobre 2026.</p>
  </div>;
}
