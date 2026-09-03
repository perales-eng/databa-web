"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOrganization, requireUser } from "@/lib/auth-helpers";
import { invitationEmail, sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

const INVITATION_TTL_DAYS = 7;

export type ActionResult<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

function appBaseUrl(): string {
  return (process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

// ─────────────────── 7.7. Renombrar organización ────────────────────────────

const renameSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
});

export async function renameOrganization(
  formData: FormData,
): Promise<ActionResult<{ name: string }>> {
  const { organization, role } = await requireOrganization();
  if (role !== "DEV" && role !== "OWNER") {
    return { ok: false, error: "Solo el desarrollador o propietario puede renombrar" };
  }

  const parsed = renameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const name = parsed.data.name.trim();

  await db.organization.update({ where: { id: organization.id }, data: { name } });
  revalidatePath("/settings");
  return { ok: true, name };
}

// ─────────────────── 7.4. Invitaciones ──────────────────────────────────────

const inviteSchema = z.object({
  email: z.string().email("Email inválido"),
  role: z.enum(["DEV", "OWNER", "ADMIN", "THERAPIST"]).default("THERAPIST"),
});

function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function inviteMember(
  formData: FormData,
): Promise<ActionResult<{ token: string; email: string; emailSent: boolean }>> {
  const { organization, role } = await requireOrganization();
  if (role !== "DEV" && role !== "OWNER" && role !== "ADMIN") {
    return { ok: false, error: "Sin permisos para invitar" };
  }

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role") || "THERAPIST",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const email = parsed.data.email.toLowerCase().trim();
  const inviteeRole = parsed.data.role;

  // Validación jerárquica de permisos
  if (role === "ADMIN") {
    // ADMIN solo puede invitar THERAPIST
    if (inviteeRole !== "THERAPIST") {
      return { ok: false, error: "Los administradores solo pueden invitar terapeutas" };
    }
  } else if (role === "OWNER") {
    // OWNER puede invitar ADMIN o THERAPIST (no OWNER ni DEV)
    if (inviteeRole !== "ADMIN" && inviteeRole !== "THERAPIST") {
      return { ok: false, error: "Los propietarios solo pueden invitar administradores o terapeutas" };
    }
  } else if (role === "DEV") {
    // DEV puede invitar solo OWNER
    if (inviteeRole !== "OWNER") {
      return { ok: false, error: "Los desarrolladores solo pueden invitar propietarios" };
    }
  }

  // Si ya es miembro, no invitar de nuevo.
  const existingMember = await db.membership.findFirst({
    where: { organizationId: organization.id, user: { email } },
  });
  if (existingMember) return { ok: false, error: "Ese email ya es miembro" };

  // Revocar invitaciones pendientes previas para el mismo email/org.
  await db.invitation.deleteMany({
    where: { organizationId: organization.id, email, acceptedAt: null },
  });

  const token = generateToken();
  const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);
  const me = await requireUser();

  await db.invitation.create({
    data: {
      organizationId: organization.id,
      email,
      role: inviteeRole,
      token,
      expiresAt,
      createdById: me.id,
    },
  });

  // Intentar enviar email (silent fallback a copy-link si no hay Resend key).
  const inviteUrl = `${appBaseUrl()}/invite/${token}`;
  const { subject, html, text } = invitationEmail({
    organizationName: organization.name,
    inviterName: me.name ?? me.email,
    inviteUrl,
    role: inviteeRole,
  });
  const emailResult = await sendEmail({ to: email, subject, html, text });
  const emailSent = emailResult.ok;

  revalidatePath("/settings");
  return { ok: true, token, email, emailSent };
}

export async function revokeInvitation(id: string): Promise<ActionResult> {
  const { organization, role } = await requireOrganization();
  if (role !== "OWNER" && role !== "ADMIN") return { ok: false, error: "Sin permisos" };

  await db.invitation.deleteMany({
    where: { id, organizationId: organization.id, acceptedAt: null },
  });
  revalidatePath("/settings");
  return { ok: true };
}

// ─────────────────── 7.6. Gestión de miembros ───────────────────────────────

const roleSchema = z.enum(["DEV", "OWNER", "ADMIN", "THERAPIST"]);

export async function changeMemberRole(
  membershipId: string,
  newRole: string,
): Promise<ActionResult> {
  const { organization, role, user } = await requireOrganization();
  
  // Solo DEV y OWNER pueden cambiar roles
  if (role !== "DEV" && role !== "OWNER") {
    return { ok: false, error: "Sin permisos para cambiar roles" };
  }

  const parsed = roleSchema.safeParse(newRole);
  if (!parsed.success) return { ok: false, error: "Rol inválido" };

  const m = await db.membership.findFirst({
    where: { id: membershipId, organizationId: organization.id },
  });
  if (!m) return { ok: false, error: "Membresía no encontrada" };
  if (m.userId === user.id) return { ok: false, error: "No podés cambiar tu propio rol" };

  // Validación jerárquica para cambio de roles
  if (role === "OWNER") {
    // OWNER puede cambiar roles de ADMIN y THERAPIST únicamente
    const targetMembership = await db.membership.findUnique({
      where: { id: membershipId },
      select: { role: true },
    });
    
    if (targetMembership?.role === "DEV" || targetMembership?.role === "OWNER") {
      return { ok: false, error: "No tenés permisos para cambiar el rol de propietarios o desarrolladores" };
    }
    
    if (parsed.data === "DEV" || parsed.data === "OWNER") {
      return { ok: false, error: "No podés asignar el rol de propietario o desarrollador" };
    }
  }
  // DEV puede cambiar cualquier rol (no necesita validación adicional)

  await db.membership.update({ where: { id: m.id }, data: { role: parsed.data } });
  revalidatePath("/settings");
  return { ok: true };
}

export async function removeMember(membershipId: string): Promise<ActionResult> {
  const { organization, role, user } = await requireOrganization();
  
  // Solo DEV y OWNER pueden remover miembros
  if (role !== "DEV" && role !== "OWNER") {
    return { ok: false, error: "Sin permisos para remover miembros" };
  }

  const m = await db.membership.findFirst({
    where: { id: membershipId, organizationId: organization.id },
  });
  if (!m) return { ok: false, error: "Membresía no encontrada" };
  if (m.userId === user.id) return { ok: false, error: "No podés removerte a vos mismo" };

  // OWNER no puede remover DEV u otros OWNER
  if (role === "OWNER") {
    const targetMembership = await db.membership.findUnique({
      where: { id: membershipId },
      select: { role: true },
    });
    
    if (targetMembership?.role === "DEV" || targetMembership?.role === "OWNER") {
      return { ok: false, error: "No tenés permisos para remover propietarios o desarrolladores" };
    }
  }
  // DEV puede remover a cualquiera

  await db.membership.delete({ where: { id: m.id } });
  revalidatePath("/settings");
  return { ok: true };
}

// ─────────────────── 7.5. Aceptar invitación ────────────────────────────────

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function uniqueSlug(base: string): Promise<string> {
  const root = base || "org";
  let candidate = root;
  let n = 2;
  while (await db.organization.findUnique({ where: { slug: candidate } })) {
    candidate = `${root}-${n++}`;
    if (n > 1000) throw new Error("No se pudo generar slug único");
  }
  return candidate;
}

export async function acceptInvitation(
  token: string,
): Promise<ActionResult<{ organizationId: string }>> {
  const user = await requireUser();

  // Anti-enumeración de tokens: 20 intentos por user cada 5 min.
  const rl = rateLimit(`accept-invite:${user.id}`, { max: 20, windowSec: 5 * 60 });
  if (!rl.ok) return { ok: false, error: "Demasiados intentos. Probá más tarde." };

  const inv = await db.invitation.findUnique({ 
    where: { token },
    include: {
      organization: {
        include: {
          memberships: {
            where: { role: "DEV" },
            select: { role: true }
          }
        }
      }
    }
  });
  
  if (!inv) return { ok: false, error: "Invitación no encontrada" };
  if (inv.acceptedAt) return { ok: false, error: "La invitación ya fue aceptada" };
  if (inv.expiresAt < new Date()) return { ok: false, error: "La invitación venció" };

  // Detectar si es una invitación de DEV a OWNER
  const isDevInvitingOwner = inv.organization.memberships.some(m => m.role === "DEV") && inv.role === "OWNER";

  if (isDevInvitingOwner) {
    // Caso especial: DEV invitando a OWNER → crear nueva organización Y unirse a la del DEV
    const orgName = user.name ? `Clínica ${user.name}` : `Organización ${user.email.split("@")[0]}`;
    const slug = await uniqueSlug(slugify(orgName));

    const newOrg = await db.$transaction(async (tx) => {
      // 1. Crear nueva organización para el OWNER
      const created = await tx.organization.create({
        data: { name: orgName, slug },
      });

      // 2. Hacer al usuario OWNER de su nueva organización
      await tx.membership.create({
        data: {
          userId: user.id,
          organizationId: created.id,
          role: "OWNER",
        },
      });

      // 3. También unir al OWNER a la organización del DEV
      await tx.membership.create({
        data: {
          userId: user.id,
          organizationId: inv.organizationId,
          role: "OWNER",
        },
      });

      // 4. Marcar invitación como aceptada
      await tx.invitation.update({
        where: { id: inv.id },
        data: { acceptedAt: new Date() },
      });

      return created;
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { ok: true, organizationId: newOrg.id };
  }

  // Caso normal: unirse a la organización del invitador
  const existing = await db.membership.findFirst({
    where: { userId: user.id, organizationId: inv.organizationId },
  });

  await db.$transaction(async (tx) => {
    if (!existing) {
      await tx.membership.create({
        data: {
          userId: user.id,
          organizationId: inv.organizationId,
          role: inv.role,
        },
      });
    }
    await tx.invitation.update({
      where: { id: inv.id },
      data: { acceptedAt: new Date() },
    });
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true, organizationId: inv.organizationId };
}
