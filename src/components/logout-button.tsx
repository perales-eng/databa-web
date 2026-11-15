"use client";

import * as React from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

/**
 * Logout cliente: antes de cerrar sesión, le avisa al service worker que
 * purgue el cache de HTML (puede contener datos del usuario actual).
 */
export function LogoutButton() {
  const [pending, setPending] = React.useState(false);

  async function handleClick() {
    setPending(true);
    try {
      if (typeof navigator !== "undefined" && navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "purge-user-cache" });
      }
    } catch {
      // Si el postMessage falla no bloqueamos el logout.
    }
    await signOut({ callbackUrl: "/" });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="flex w-full items-center gap-2 rounded-xl border border-ink/10 px-3 py-2 text-[13px] text-ink/70 transition hover:border-ink/20 hover:text-ink disabled:opacity-50"
    >
      <LogOut className="h-3.5 w-3.5" />
      {pending ? "Cerrando…" : "Cerrar sesión"}
    </button>
  );
}
