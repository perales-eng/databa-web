import Link from "next/link";
import { requireOrganization } from "@/lib/auth-helpers";
import { LayoutDashboard, Users, Calendar, BarChart3, Settings, LogOut } from "lucide-react";
import { signOut } from "@/auth";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/students", label: "Estudiantes", icon: Users },
  { href: "/calendar", label: "Calendario", icon: Calendar },
  { href: "/reports", label: "Reportes", icon: BarChart3 },
  { href: "/settings", label: "Configuración", icon: Settings },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, organization, role } = await requireOrganization();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 flex-col border-r bg-card md:flex">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="h-8 w-8 rounded-lg bg-primary" />
          <span className="text-lg font-semibold tracking-tight">datABA</span>
        </div>

        <div className="border-b px-6 py-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Organización</p>
          <p className="mt-1 truncate text-sm font-medium">{organization.name}</p>
          <p className="text-xs text-muted-foreground">{role.toLowerCase()}</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t p-4">
          <p className="truncate text-sm font-medium">{user.name ?? user.email}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="mt-3 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
