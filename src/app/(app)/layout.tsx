import Link from "next/link";
import { LayoutDashboard, Users, Calendar, BarChart3, Settings } from "lucide-react";
import { requireOrganization } from "@/lib/auth-helpers";
import { Logomark } from "@/components/marketing/brand";
import { SyncIndicator } from "@/components/sync-indicator";
import { SwVersionBadge } from "@/components/sw-version-badge";
import { LogoutButton } from "@/components/logout-button";
import { MobileNav } from "./mobile-nav";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/students", label: "Estudiantes", icon: Users },
  { href: "/calendar", label: "Calendario", icon: Calendar },
  { href: "/reports", label: "Reportes", icon: BarChart3 },
  { href: "/settings", label: "Configuración", icon: Settings },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, organization, role } = await requireOrganization();

  const logoutSlot = <LogoutButton />;

  return (
    <div className="flex min-h-screen flex-col bg-cream text-ink md:flex-row">
      {/* Top bar + drawer en mobile */}
      <MobileNav
        organizationName={organization.name}
        role={role}
        userLabel={user.name ?? user.email ?? ""}
        userEmail={user.email ?? ""}
        logoutSlot={logoutSlot}
      />

      {/* Sidebar desktop */}
      <aside className="hidden w-72 flex-col border-r border-ink/10 bg-white/60 backdrop-blur md:flex">
        <div className="flex h-16 items-center gap-3 border-b border-ink/10 px-6">
          <Logomark size={32} />
          <span className="text-[17px] font-medium tracking-tight">
            dat<span className="font-display font-semibold italic">ABA</span>
          </span>
        </div>

        <div className="border-b border-ink/10 px-6 py-5">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink/55">
            Organización
          </span>
          <p className="mt-2 truncate font-display text-[20px] font-light leading-tight tracking-[-0.015em] text-ink">
            {organization.name}
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-teal-deep">
            {role.toLowerCase()}
          </p>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] text-ink/70 transition hover:bg-ink/[0.04] hover:text-ink"
            >
              <item.icon className="h-4 w-4 transition group-hover:text-teal-deep" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-ink/10 p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <SyncIndicator compact />
            <SwVersionBadge />
          </div>
          <p className="truncate text-[14px] font-medium text-ink">{user.name ?? user.email}</p>
          <p className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-ink/55">
            {user.email}
          </p>
          <div className="mt-4">{logoutSlot}</div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1280px] px-5 py-8 md:px-10 md:py-10">{children}</div>
      </main>
    </div>
  );
}
