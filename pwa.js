(() => {
  "use strict";

  const installButton = document.querySelector("#install-app");
  const installDialog = document.querySelector("#install-dialog");
  const updateNotice = document.querySelector("#pwa-update");
  const updateButton = document.querySelector("#apply-update");
  const connectionStatus = document.querySelector("#connection-status");
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    || window.navigator.standalone === true;
  let deferredInstallPrompt = null;
  let waitingWorker = null;
  let refreshing = false;
  let registration = null;
  let connectionTimer = null;

  document.documentElement.classList.toggle("is-standalone", isStandalone);

  function showInstallButton() {
    if (!isStandalone) installButton.hidden = false;
  }

  function openIOSInstructions() {
    if (typeof installDialog.showModal === "function") installDialog.showModal();
    else installDialog.setAttribute("open", "");
  }

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    showInstallButton();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installButton.hidden = true;
  });

  installButton.addEventListener("click", async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      if (outcome === "accepted") installButton.hidden = true;
      return;
    }
    if (isIOS) openIOSInstructions();
  });

  if (isIOS && !isStandalone) showInstallButton();

  function updateConnectionStatus(restored = false) {
    window.clearTimeout(connectionTimer);
    if (!navigator.onLine) {
      connectionStatus.textContent = "Mode hors connexion — vos révisions restent disponibles.";
      connectionStatus.classList.remove("is-online");
      connectionStatus.hidden = false;
      return;
    }
    if (restored) {
      connectionStatus.textContent = "Connexion rétablie.";
      connectionStatus.classList.add("is-online");
      connectionStatus.hidden = false;
      connectionTimer = window.setTimeout(() => { connectionStatus.hidden = true; }, 2500);
      registration?.update();
      return;
    }
    connectionStatus.hidden = true;
  }

  window.addEventListener("offline", () => updateConnectionStatus());
  window.addEventListener("online", () => updateConnectionStatus(true));
  updateConnectionStatus();

  function showUpdate(worker) {
    waitingWorker = worker;
    updateNotice.hidden = false;
  }

  updateButton.addEventListener("click", () => {
    if (waitingWorker) waitingWorker.postMessage({ type: "SKIP_WAITING" });
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        registration = await navigator.serviceWorker.register("./service-worker.js");

        if (registration.waiting && navigator.serviceWorker.controller) {
          showUpdate(registration.waiting);
        }

        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;
          installingWorker.addEventListener("statechange", () => {
            if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
              showUpdate(installingWorker);
            }
          });
        });

        window.setInterval(() => registration.update(), 60 * 60 * 1000);
      } catch (error) {
        console.warn("Le mode hors connexion n’a pas pu être activé.", error);
      }
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && navigator.onLine) registration?.update();
    });
  }
})();
