"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;

    function activateWaiting(reg: ServiceWorkerRegistration) {
      // Si hay un SW nuevo en "waiting", pedirle que active ya.
      if (reg.waiting) {
        reg.waiting.postMessage({ type: "skip-waiting" });
      }
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        registration = reg;
        // Forzar chequeo de nueva versión al abrir la app.
        reg.update().catch(() => {});

        // Si ya hay uno esperando (ej. la última visita instaló el nuevo
        // pero la PWA nunca se cerró), activarlo ya.
        activateWaiting(reg);

        // Si aparece un update nuevo durante esta sesión, activarlo apenas
        // termine de instalar.
        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed") {
              activateWaiting(reg);
            }
          });
        });
      })
      .catch((err) => console.warn("[sw] register failed", err));

    // Cuando el SW nuevo toma control (después del skipWaiting + claim),
    // recargamos para que la nueva lógica aplique a la vista actual.
    // Evitamos recargar durante el primer install para no interrumpir el flujo.
    let hadController = !!navigator.serviceWorker.controller;
    function handleControllerChange() {
      if (!hadController) {
        // Era el primer install (no había controller antes): no recargamos.
        hadController = true;
        return;
      }
      // Es un update: recargar para tomar el SW nuevo.
      window.location.reload();
    }
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    // Re-chequear si la pestaña vuelve a foco (importante en PWAs standalone).
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
