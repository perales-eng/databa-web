import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

/**
 * Server-side guard: returns the current user + memberships, or redirects to /login.
 */
export async function requireUser() {
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
}

/**
 * Returns the user's "current" organization. For now we pick the first membership.
 * Later this will read a cookie or session preference.
 */
export async function requireOrganization() {
  const user = await requireUser();
  const membership = user.memberships[0];
  if (!membership) {
    // No org yet — we'll route to onboarding in Fase 7. For now, redirect to a stub.
    redirect("/onboarding");
  }
  return {
    user,
    organization: membership.organization,
    role: membership.role,
  };
}
