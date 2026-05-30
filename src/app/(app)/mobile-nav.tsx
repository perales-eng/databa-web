"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Calendar, BarChart3, Settings, Menu, X } from "lucide-react";
import { Logomark } from "@/components/marketing/brand";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/students", label: "Estudiantes", icon: Users },
  { href: "/calendar", label: "Calendario", icon: Calendar },
  { href: "/reports", label: "Reportes", icon: BarChart3 },
  { href: "/settings", label: "Configuración", icon: Settings },
];

export function MobileNav({
  organizationName,
  role,
  userLabel,
  userEmail,
  logoutSlot,
}: {
  organizationName: string;
  role: string;
  userLabel: string;
  userEmail: string;
  logoutSlot: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  // Lock scroll del body cuando el drawer está abierto
  React.useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <>
      {/* Top bar mobile */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ink/10 bg-cream/95 px-4 backdrop-blur md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Logomark size={28} />
          <span className="text-[16px] font-medium tracking-tight">
            dat<span className="font-display font-semibold italic">ABA</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-ink/10 bg-white/70 text-ink transition hover:border-ink/20"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/45 backdrop-blur-sm animate-[fade_0.18s_ease-out]"
          />
          <aside className="absolute left-0 top-0 flex h-full w-[85vw] max-w-[320px] flex-col border-r border-ink/10 bg-cream shadow-2xl animate-[slideIn_0.22s_ease-out]">
            <div className="flex h-14 items-center justify-between border-b border-ink/10 px-5">
              <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
                <Logomark size={28} />
                <span className="text-[16px] font-medium tracking-tight">
                  dat<span className="font-display font-semibold italic">ABA</span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-ink/70 transition hover:bg-ink/5 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-ink/10 px-5 py-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink/55">
                Organización
              </span>
              <p className="mt-2 truncate font-display text-[18px] font-light leading-tight tracking-[-0.015em] text-ink">
                {organizationName}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-teal-deep">
                {role.toLowerCase()}
              </p>
            </div>

            <nav className="flex-1 space-y-0.5 px-3 py-4">
              {navItems.map((item) => {
                const active = pathname === item.href || pathname?.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] transition ${
                      active
                        ? "bg-ink/[0.06] text-ink"
                        : "text-ink/75 hover:bg-ink/[0.04] hover:text-ink"
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${active ? "text-teal-deep" : ""}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-ink/10 p-5">
              <p className="truncate text-[14px] font-medium text-ink">{userLabel}</p>
              <p className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-ink/55">
                {userEmail}
              </p>
              <div className="mt-4">{logoutSlot}</div>
            </div>
          </aside>

          <style>{`
            @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
            @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
          `}</style>
        </div>
      )}
    </>
  );
}
