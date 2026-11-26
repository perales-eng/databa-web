import { cache } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

/**
 * Server-side guard: returns the current user + memberships, or redirects to /login.
 *
 * Envuelto en React.cache() para que múltiples llamadas dentro del mismo
 * request-render (layout + page + componentes) compartan una sola query.
 * Sin esto, cada server component que llame requireOrganization/requireUser
 * dispara su propia findUnique, agotando la connection pool de Prisma
 * (connection_limit=1 serializa, 10s timeout → P2024).
 */
export const requireUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      memberships: { include: { organization: true } },
    },
  });

  if (!user) redirect("/login");
  return user;
});

/**
 * Returns the user's "current" organization. For now we pick the first membership.
 * Later this will read a cookie or session preference.
 * Redirects to /suspended if the organization is suspended.
 *
 * También cacheado: el result de requireUser ya se dedupea, pero envolvemos
 * esta función por si algún caller la llama varias veces también.
 */
export const requireOrganization = cache(async () => {
  const user = await requireUser();
  const membership = user.memberships[0];
  if (!membership) {
    redirect("/onboarding");
  }
  
  // Verificar si la organización está suspendida (solo aplica a no-DEV)
  if (membership.organization.suspended && membership.role !== "DEV") {
    redirect("/suspended");
  }
  
  return {
    user,
    organization: membership.organization,
    role: membership.role,
  };
});
