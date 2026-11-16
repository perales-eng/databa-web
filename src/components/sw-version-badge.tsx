"use client";

import * as React from "react";

const EXPECTED = "v4";

/**
 * Muestra la versión del SW activo. Pensado para debug / confianza — se oculta
 * si la versión es la esperada; muestra warning si es vieja.
 */
export function SwVersionBadge() {
  const [version, setVersion] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("caches" in window)) return;

    async function detect() {
      try {
        const names = await caches.keys();
        // Buscamos el v más alto en los nombres databa-*-vN
        let found: string | null = null;
        for (const name of names) {
          const m = name.match(/^databa-(assets|html)-v(\d+)$/);
          if (m) {
            const vTag = `v${m[2]}`;
            if (!found || Number(vTag.slice(1)) > Number(found.slice(1))) {
              found = vTag;
            }
          }
        }
        setVersion(found);
      } catch {
        setVersion(null);
      }
    }

    void detect();
    // Re-chequear cada 10s por si llega update durante uso.
    const interval = window.setInterval(detect, 10_000);
    return () => window.clearInterval(interval);
  }, []);

  if (!version) return null;

  const isOld = version !== EXPECTED;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] ${
        isOld ? "text-destructive" : "text-ink/35"
      }`}
      title={isOld ? `Tu PWA tiene SW ${version} — se esperaba ${EXPECTED}. Cerrá y reabrí la PWA.` : `SW ${version} activo`}
    >
      sw {version}
      {isOld && <span>⚠</span>}
    </span>
  );
}
