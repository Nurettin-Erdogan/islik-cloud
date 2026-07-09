import { useEffect, useState } from "react";

function isStandaloneApp() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function InstallAppButton({ className = "" }) {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    setInstalled(isStandaloneApp());

    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setInstallPrompt(event);
    }

    function handleAppInstalled() {
      setInstallPrompt(null);
      setInstalled(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function installApp() {
    if (!installPrompt) {
      return;
    }

    installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice?.outcome === "accepted") {
      setInstalled(true);
    }

    setInstallPrompt(null);
  }

  if (installed || !installPrompt) {
    return null;
  }

  return (
    <button
      type="button"
      className={`install-button ${className}`.trim()}
      onClick={installApp}
    >
      Telefona Kur
    </button>
  );
}

export default InstallAppButton;
