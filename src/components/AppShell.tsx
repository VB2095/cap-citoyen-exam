import { type PropsWithChildren, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";

import { useApp } from "../context/AppContext";
import { usePwa } from "../hooks/usePwa";

const navigation = [
  {
    to: "/reviser",
    label: "Réviser",
    path: "M4 4h6a3 3 0 0 1 3 3v13a4 4 0 0 0-4-4H4V4Zm16 0h-6a3 3 0 0 0-3 3v13a4 4 0 0 1 4-4h5V4Z",
  },
  {
    to: "/entrainement",
    label: "S'entraîner",
    path: "M9 3h6v2h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4V3Zm2 2v2h2V5h-2Zm-3 6v2h8v-2H8Zm0 4v2h5v-2H8Z",
  },
  {
    to: "/examen",
    label: "Examen blanc",
    path: "M12 2a10 10 0 1 1-7.07 2.93A9.97 9.97 0 0 1 12 2Zm0 2a8 8 0 1 0 5.66 2.34A7.95 7.95 0 0 0 12 4Zm1 3v4.59l3.2 3.2-1.41 1.42L11 12.41V7h2Z",
  },
];

export function AppShell({ children }: PropsWithChildren) {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const installDialogRef = useRef<HTMLDialogElement>(null);
  const { colorTheme, toggleTheme, resetData } = useApp();
  const pwa = usePwa();
  const activePath = location.pathname === "/resultats" ? "/examen" : location.pathname;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname]);

  useEffect(() => {
    const dialog = installDialogRef.current;
    if (!dialog) return;
    if (pwa.installDialogOpen && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    } else if (!pwa.installDialogOpen && dialog.open) {
      dialog.close();
    }
  }, [pwa.installDialogOpen]);

  const confirmReset = () => {
    if (!window.confirm("Supprimer toute la progression enregistrée sur cet appareil ?")) return;
    resetData();
  };

  return (
    <>
      <a className="skip-link" href="#main">Aller au contenu</a>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/" aria-label="Cap Citoyen — Accueil">
            <img className="brand-mark" src="/icons/icon-192-v3.png" width="48" height="48" alt="" />
            <span><strong>Cap Citoyen</strong><small>Préparation à l'examen civique</small></span>
          </Link>
          <nav className="main-nav" aria-label="Navigation principale">
            {navigation.map((item) => (
              <Link key={item.to} to={item.to} aria-current={activePath === item.to ? "page" : undefined}>
                <svg className="nav-icon" aria-hidden="true" viewBox="0 0 24 24"><path d={item.path} /></svg>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          {pwa.canInstall && (
            <button className="icon-button install-button" type="button" aria-label="Installer Cap Citoyen" title="Installer l’application" onClick={pwa.install}>
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M11 3h2v10.17l3.59-3.58L18 11l-6 6-6-6 1.41-1.41L11 13.17V3Zm-6 16h14v2H5v-2Z" /></svg>
              <span className="install-label">Installer</span>
            </button>
          )}
          <button
            className="icon-button theme-toggle"
            type="button"
            aria-label={colorTheme === "dark" ? "Activer le thème clair" : "Activer le thème sombre"}
            title="Changer de thème"
            onClick={toggleTheme}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36A7 7 0 0 1 13.36 3.1C12.92 3.04 12.46 3 12 3Z" /></svg>
          </button>
        </div>
      </header>

      <main id="main" ref={mainRef} tabIndex={-1}>{children}</main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div>
            <strong>Cap Citoyen</strong>
            <p>Outil indépendant d'entraînement. Ce site n'est pas un service officiel de l'administration française.</p>
            <p className="attribution">Questions : ministère de l’Intérieur · Ressources complémentaires : <a href="https://examenciviquenaturalisation.fr" target="_blank" rel="noopener noreferrer">examenciviquenaturalisation.fr</a>.</p>
          </div>
          <nav aria-label="Navigation secondaire">
            <Link to="/glossaire">Glossaire</Link>
            <Link to="/sources">Sources officielles</Link>
            <Link to="/confidentialite">Vie privée</Link>
            <button className="link-button" type="button" onClick={confirmReset}>Réinitialiser ma progression</button>
          </nav>
        </div>
      </footer>

      {pwa.onlineMessage && (
        <div className={`connection-status${navigator.onLine ? " is-online" : ""}`} role="status" aria-live="polite">
          {pwa.onlineMessage}
        </div>
      )}

      <dialog ref={installDialogRef} className="install-dialog" aria-labelledby="install-dialog-title" onClose={() => pwa.setInstallDialogOpen(false)}>
        <form method="dialog">
          <button className="dialog-close" value="close" aria-label="Fermer">×</button>
          <p className="eyebrow">Installer l’application</p>
          <h2 id="install-dialog-title">
            {pwa.installPlatform === "ios" ? "Ajouter Cap Citoyen à l’écran d’accueil" : pwa.installPlatform === "mobile" ? "Installer Cap Citoyen sur ce mobile" : "Installer Cap Citoyen sur cet ordinateur"}
          </h2>
          {pwa.installPlatform === "ios" ? <ol className="install-steps">
            <li>Ouvrez cette page dans Safari si nécessaire, puis touchez le bouton <strong>Partager</strong>.</li>
            <li>Faites défiler les actions puis choisissez <strong>Sur l’écran d’accueil</strong>.</li>
            <li>Confirmez avec <strong>Ajouter</strong>.</li>
          </ol> : pwa.installPlatform === "mobile" ? <ol className="install-steps">
            <li>Ouvrez le menu de votre navigateur.</li>
            <li>Choisissez <strong>Installer l’application</strong> ou <strong>Ajouter à l’écran d’accueil</strong>.</li>
            <li>Confirmez l’installation.</li>
          </ol> : <ol className="install-steps">
            <li>Dans Chrome ou Edge, utilisez l’icône d’installation dans la barre d’adresse ou l’option <strong>Installer Cap Citoyen</strong> du menu.</li>
            <li>Dans Safari sur macOS, choisissez <strong>Fichier → Ajouter au Dock</strong>.</li>
            <li>Si l’option n’apparaît pas, rechargez la page dans un navigateur compatible.</li>
          </ol>}
          <p className="dialog-note">L’application pourra ensuite être ouverte comme une application classique et continuera de fonctionner hors connexion.</p>
          <button className="button" value="close">J’ai compris</button>
        </form>
      </dialog>

      {(pwa.needRefresh || pwa.updated) && (
        <div className="pwa-update" role="status" aria-live="polite">
          <span>{pwa.needRefresh ? "Une nouvelle version de Cap Citoyen est disponible." : "Cap Citoyen a été mis à jour."}</span>
          {pwa.needRefresh && <><button className="button" type="button" onClick={pwa.applyUpdate}>Mettre à jour</button><button className="link-button" type="button" onClick={pwa.dismissUpdate}>Plus tard</button></>}
        </div>
      )}
    </>
  );
}
