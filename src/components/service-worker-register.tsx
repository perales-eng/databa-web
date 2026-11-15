"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        registration = reg;
        // Forzar chequeo de nueva versión al abrir la app (en vez de esperar
        // al refresh diario que hace el browser por default).
        reg.update().catch(() => {});
      })
      .catch((err) => console.warn("[sw] register failed", err));

    // Si el browser detecta un SW nuevo esperando, pedirle que active ya.
    function handleControllerChange() {
      // El SW nuevo tomó control. Siguiente navegación verá sus cambios.
    }
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    // Re-chequear si la pestaña vuelve a foco (otro intento de agarrar updates).
    function onVisibility() {
      if (document.visibilityState === "visible" && registration) {
        registration.update().catch(() => {});
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
