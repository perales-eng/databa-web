"use client";

import * as React from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "databa-install-dismissed-at";
const DISMISS_FOR_MS = 14 * 24 * 60 * 60 * 1000; // 14 días

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isDismissed(): boolean {
  if (typeof window === "undefined") return false;
  const at = Number(localStorage.getItem(DISMISSED_KEY) ?? 0);
  return Boolean(at && Date.now() - at < DISMISS_FOR_MS);
}

export function InstallPrompt() {
  const [deferred, setDeferred] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = React.useState<boolean>(() => isStandalone());
  const [dismissedInitial] = React.useState<boolean>(() => isDismissed());

  React.useEffect(() => {
    if (installed || dismissedInitial) return;

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }
    function onAppInstalled() {
      setInstalled(true);
      setDeferred(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [installed, dismissedInitial]);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setDeferred(null);
  }

  if (installed || !deferred) return null;

  return (
    <div className="relative flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Download className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Instalá datABA en tu dispositivo</p>
        <p className="text-xs text-muted-foreground">
          Acceso directo desde la pantalla de inicio, sin barra del navegador.
        </p>
      </div>
      <Button size="sm" onClick={install}>Instalar</Button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Descartar"
        className="absolute right-1 top-1 text-muted-foreground hover:text-foreground"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
