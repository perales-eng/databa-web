"use client";

import * as React from "react";
import { Download, X, Share2, Plus, Smartphone, Monitor, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "databa-install-dismissed-at";
const DISMISS_FOR_MS = 14 * 24 * 60 * 60 * 1000; // 14 días

type Platform =
  | "chromium-mobile"      // Chrome/Edge/Brave/Opera en Android — prompt automático
  | "chromium-desktop"     // Chrome/Edge/Brave/Opera en Mac/PC — prompt automático
  | "safari-ios"           // Safari en iPhone/iPad — instrucciones manuales
  | "safari-mac"           // Safari en Mac — Archivo → Agregar al Dock
  | "firefox"              // Firefox — limitado
  | "unsupported"          // DuckDuckGo, in-app browsers, etc.
  | "unknown";

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "unknown";
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
  const isMac = /Macintosh/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isSafari = /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(ua);
  const isDuckDuckGo = /DuckDuckGo/i.test(ua);
  const isFirefox = /Firefox|FxiOS/i.test(ua);
  const isChromium = /Chrome|CriOS|Edg|OPR|Brave/i.test(ua) && !isDuckDuckGo;

  if (isDuckDuckGo) return "unsupported";
  if (isIOS) return isSafari || !isChromium ? "safari-ios" : "safari-ios"; // iOS Chrome is Safari engine; same manual flow
  if (isMac && isSafari) return "safari-mac";
  if (isAndroid && isChromium) return "chromium-mobile";
  if (isChromium) return "chromium-desktop";
  if (isFirefox) return "firefox";
  return "unknown";
}

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
  // Distingue render en server (SSR) del cliente sin disparar setState en effect.
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [deferred, setDeferred] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = React.useState<boolean>(() => isStandalone());
  const [dismissed, setDismissed] = React.useState<boolean>(() => isDismissed());
  const [platform] = React.useState<Platform>(() => detectPlatform());
  const [showModal, setShowModal] = React.useState(false);

  React.useEffect(() => {
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
  }, []);

  async function installDirect() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setDismissed(true);
  }

  if (!mounted || installed || dismissed) return null;

  const hasAutoPrompt = Boolean(deferred);
  const canInstruct = platform === "safari-ios" || platform === "safari-mac";
  const unsupported = platform === "unsupported";

  // Mostramos para todas las plataformas conocidas. Solo ocultamos si realmente
  // no sabemos qué navegador es Y no hay prompt (no tenemos nada útil que decir).
  if (!hasAutoPrompt && platform === "unknown") {
    return null;
  }

  const titleByPlatform: Record<Platform, string> = {
    "chromium-mobile": "Instalá datABA en tu celular",
    "chromium-desktop": "Instalá datABA en tu computadora",
    "safari-ios": "Instalá datABA en tu iPhone",
    "safari-mac": "Instalá datABA en tu Mac",
    "firefox": "Instalá datABA desde Firefox",
    "unsupported": "Instalá datABA desde otro navegador",
    "unknown": "Instalá datABA",
  };

  const subtitleByPlatform: Record<Platform, string> = {
    "chromium-mobile": "Un toque y queda como app nativa en tu pantalla de inicio.",
    "chromium-desktop": "Queda en el Dock / barra de tareas sin barra del navegador.",
    "safari-ios": "Safari no instala apps solo — te mostramos los pasos exactos.",
    "safari-mac": "Safari de Mac instala desde el menú — te mostramos cómo.",
    "firefox": "Firefox tiene soporte parcial para apps web. En Android se instala desde el menú; en Mac/PC es más limitado.",
    "unsupported": "Este navegador no soporta instalar apps. Abrí databa.org en Chrome o Firefox.",
    "unknown": "Abrí databa.org en Chrome o Safari para instalar.",
  };

  return (
    <>
      <div className="relative flex items-start gap-4 rounded-2xl border border-ink/10 bg-white/70 p-4 backdrop-blur sm:p-5">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${unsupported ? "bg-amber/15 text-amber-deep" : "bg-teal-bright/15 text-teal-deep"}`}>
          {unsupported ? <AlertCircle className="h-5 w-5" /> : <Download className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium text-ink">{titleByPlatform[platform]}</p>
          <p className="mt-0.5 text-[13px] text-ink/60">{subtitleByPlatform[platform]}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {hasAutoPrompt && (
              <Button size="sm" onClick={installDirect}>
                <Download className="h-3.5 w-3.5" /> Instalar ahora
              </Button>
            )}
            {canInstruct && (
              <Button
                size="sm"
                variant={hasAutoPrompt ? "outline" : "default"}
                onClick={() => setShowModal(true)}
              >
                Ver instrucciones
              </Button>
            )}
            {!hasAutoPrompt && !canInstruct && !unsupported && (
              platform === "chromium-mobile" ||
              platform === "chromium-desktop" ||
              platform === "firefox"
            ) && (
              <Button size="sm" variant="outline" onClick={() => setShowModal(true)}>
                ¿Cómo instalar?
              </Button>
            )}
            {unsupported && (
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-deep">
                → Chrome · Firefox · Brave · Samsung Internet
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Descartar por 14 días"
          className="absolute right-2 top-2 rounded-md p-1 text-ink/40 transition hover:bg-ink/5 hover:text-ink"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {showModal && (
        <InstallInstructionsModal
          platform={platform}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

function InstallInstructionsModal({
  platform,
  onClose,
}: {
  platform: Platform;
  onClose: () => void;
}) {
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
      />
      <div className="relative m-0 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl bg-cream shadow-2xl sm:m-4 sm:max-w-md sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-bright/15 text-teal-deep">
              {platform === "safari-ios" ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink/55">Cómo instalar</p>
              <p className="text-[15px] font-medium text-ink">
                {platform === "safari-ios" ? "Safari — iPhone / iPad" :
                 platform === "safari-mac" ? "Safari — Mac" :
                 platform === "chromium-mobile" ? "Chrome — Android" :
                 platform === "chromium-desktop" ? "Chrome / Edge — PC o Mac" :
                 platform === "firefox" ? "Firefox" :
                 "Instrucciones"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-xl p-2 text-ink/60 transition hover:bg-ink/5 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          {platform === "safari-ios" && <SafariIOSInstructions />}
          {platform === "safari-mac" && <SafariMacInstructions />}
          {platform === "chromium-mobile" && <ChromiumMobileInstructions />}
          {platform === "chromium-desktop" && <ChromiumDesktopInstructions />}
          {platform === "firefox" && <FirefoxInstructions />}
          {platform === "unknown" && <GenericInstructions />}
        </div>
      </div>
    </div>
  );
}

function Step({ n, title, body, icon }: { n: number; title: string; body: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <li className="relative flex gap-4">
      <div className="flex shrink-0 flex-col items-center">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 bg-white font-display text-[16px] font-light text-teal-deep">
          {n}
        </span>
      </div>
      <div className="min-w-0 flex-1 pb-6">
        <h4 className="flex items-center gap-2 text-[14px] font-medium text-ink">
          {icon}
          {title}
        </h4>
        <p className="mt-1 text-[13px] leading-relaxed text-ink/70">{body}</p>
      </div>
    </li>
  );
}

function SafariIOSInstructions() {
  return (
    <ol className="space-y-0">
      <Step
        n={1}
        title="Tocá el botón Compartir"
        icon={<Share2 className="h-3.5 w-3.5 text-teal-deep" />}
        body={
          <>Está en la barra inferior de Safari — es un cuadrado con una flecha hacia arriba <span className="inline-block align-middle">📤</span>.</>
        }
      />
      <Step
        n={2}
        title="Buscá 'Agregar a pantalla de inicio'"
        icon={<Plus className="h-3.5 w-3.5 text-teal-deep" />}
        body="Bajá en el menú que aparece hasta encontrar esa opción. Está después de 'Opciones' y 'Marcadores'."
      />
      <Step
        n={3}
        title="Confirmá tocando 'Agregar'"
        body="Arriba a la derecha. El ícono de datABA va a aparecer en tu pantalla de inicio como cualquier otra app."
      />
      <div className="mt-3 rounded-xl border border-ink/10 bg-white/60 p-3 text-[12px] text-ink/65">
        <strong className="text-ink">Importante:</strong> en iPhone tiene que ser Safari. Si estás usando
        Chrome o Firefox en iPhone, abrí este mismo link desde Safari para poder instalar.
      </div>
    </ol>
  );
}

function SafariMacInstructions() {
  return (
    <ol className="space-y-0">
      <Step
        n={1}
        title="Abrí el menú Archivo"
        body="En la barra superior del Mac, mientras estás en esta página de Safari."
      />
      <Step
        n={2}
        title="Seleccioná 'Agregar al Dock'"
        icon={<Plus className="h-3.5 w-3.5 text-teal-deep" />}
        body="La opción se llama 'Agregar al Dock...' y está hacia el final del menú Archivo."
      />
      <Step
        n={3}
        title="Confirmá el nombre y tocá 'Agregar'"
        body="Se instala como app nativa en el Dock. Abre sin la barra del navegador."
      />
      <div className="mt-3 rounded-xl border border-ink/10 bg-white/60 p-3 text-[12px] text-ink/65">
        <strong className="text-ink">Requisito:</strong> Safari 17 o superior (macOS Sonoma / Ventura actualizado).
        Si no ves la opción en el menú, revisá que tu macOS esté actualizado.
      </div>
    </ol>
  );
}

function ChromiumMobileInstructions() {
  return (
    <ol className="space-y-0">
      <Step
        n={1}
        title="Tocá el menú de Chrome"
        body={<>Los tres puntitos <span className="font-mono">⋮</span> arriba a la derecha.</>}
      />
      <Step
        n={2}
        title="Seleccioná 'Instalar app' o 'Agregar a pantalla de inicio'"
        icon={<Plus className="h-3.5 w-3.5 text-teal-deep" />}
        body="Si Chrome ya detectó el sitio como instalable, verás 'Instalar app'. Si no, 'Agregar a pantalla de inicio' hace lo mismo."
      />
      <Step
        n={3}
        title="Confirmá"
        body="El ícono va a aparecer entre tus apps. Abrir datABA desde ahí lo lanza sin barra del browser."
      />
      <div className="mt-3 rounded-xl border border-ink/10 bg-white/60 p-3 text-[12px] text-ink/65">
        Si estás en <strong className="text-ink">DuckDuckGo</strong>, ese navegador no soporta instalar apps.
        Abrí <span className="font-mono text-ink">databa.org</span> en Chrome, Firefox, Brave o Samsung Internet.
      </div>
    </ol>
  );
}

function ChromiumDesktopInstructions() {
  return (
    <ol className="space-y-0">
      <Step
        n={1}
        title="Buscá el ícono 'Instalar' en la barra de direcciones"
        icon={<Download className="h-3.5 w-3.5 text-teal-deep" />}
        body="Aparece a la derecha del URL — es un pequeño ícono de descarga o monitor. Si no lo ves, pasá al siguiente paso."
      />
      <Step
        n={2}
        title="Menú de Chrome → 'Instalar datABA...'"
        body={<>Los tres puntitos <span className="font-mono">⋮</span> arriba a la derecha → opción {"‹"}Instalar datABA...{"›"} o {"‹"}Transmitir, guardar y compartir{"›"} → {"‹"}Instalar página como app...{"›"}.</>}
      />
      <Step
        n={3}
        title="Confirmá en el popup"
        body="Se agrega al Dock (Mac) o al menú Inicio (Windows). Se abre como ventana independiente."
      />
    </ol>
  );
}

function FirefoxInstructions() {
  return (
    <div className="space-y-4">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink/55">
          Firefox en Android
        </p>
        <ol className="mt-3 space-y-0">
          <Step
            n={1}
            title="Abrí el menú de Firefox"
            body={<>Los tres puntitos <span className="font-mono">⋮</span> arriba a la derecha.</>}
          />
          <Step
            n={2}
            title="Tocá 'Más'"
            body="Se abre un submenú con más opciones."
          />
          <Step
            n={3}
            title="Tocá 'Agregar app a la pantalla de inicio'"
            icon={<Plus className="h-3.5 w-3.5 text-teal-deep" />}
            body={
              <>
                Es esa la opción, aunque no diga literalmente {"‹"}Instalar{"›"}. Firefox Android llama así al
                proceso de instalar una PWA — el ícono de datABA queda junto a tus otras apps y se abre a
                pantalla completa.
              </>
            }
          />
          <Step
            n={4}
            title="Confirmá con 'Agregar'"
            body="Firefox te muestra cómo va a quedar el ícono. Confirmás y listo."
          />
        </ol>
        <div className="mt-3 rounded-xl border border-ink/10 bg-white/60 p-3 text-[12px] text-ink/65">
          <strong className="text-ink">Nota:</strong> en versiones muy nuevas de Firefox Android la opción
          puede aparecer directamente en el menú principal como {"‹"}Instalar{"›"}. Si la ves ahí, es la misma.
        </div>
      </div>

      <div className="rounded-xl border border-ink/10 bg-white/60 p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink/55">
          Firefox en Mac / PC
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-ink/70">
          Firefox desktop no soporta instalar apps web nativamente. Para una experiencia tipo app
          nativa en computadora, abrí <span className="font-mono text-ink">databa.org</span> en
          Chrome, Edge o Brave y usá su opción de instalar.
        </p>
      </div>

      <p className="text-[12px] text-ink/55">
        Igual podés seguir usando datABA desde Firefox desktop — solo que va a abrirse como pestaña
        del navegador en vez de como app con ícono propio.
      </p>
    </div>
  );
}

function GenericInstructions() {
  return (
    <div className="space-y-4 text-[14px] text-ink/75">
      <p>
        datABA es una <strong className="text-ink">Progressive Web App</strong> — se instala
        directamente desde el navegador, sin pasar por ninguna app store.
      </p>
      <p>
        Para la mejor experiencia, usá uno de estos navegadores en tu dispositivo:
      </p>
      <ul className="list-disc space-y-1 pl-5">
        <li><strong className="text-ink">Android:</strong> Chrome, Firefox, Brave, Samsung Internet</li>
        <li><strong className="text-ink">iPhone / iPad:</strong> Safari</li>
        <li><strong className="text-ink">Mac:</strong> Safari 17+, Chrome, Edge, Brave</li>
        <li><strong className="text-ink">PC:</strong> Chrome, Edge, Brave, Firefox</li>
      </ul>
      <p className="text-[13px] text-ink/60">
        Abrí <span className="font-mono text-ink">databa.org</span> en uno de ellos y vas a ver el botón
        para instalar en el dashboard.
      </p>
    </div>
  );
}
