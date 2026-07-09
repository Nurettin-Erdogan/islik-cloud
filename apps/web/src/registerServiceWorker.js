function clearDevelopmentServiceWorkers() {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });

  if ("caches" in window) {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    });
  }
}

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  if (!import.meta.env.PROD) {
    clearDevelopmentServiceWorkers();
    return;
  }

  const isSupportedOrigin =
    window.location.protocol === "https:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (!isSupportedOrigin) {
    return;
  }

  function register() {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }

  if (document.readyState === "complete") {
    register();
    return;
  }

  window.addEventListener("load", register, { once: true });
}
