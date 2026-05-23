"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOrganization, requireUser } from "@/lib/auth-helpers";

const INVITATION_TTL_DAYS = 7;

export type ActionResult<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

// ─────────────────── 7.7. Renombrar organización ────────────────────────────

const renameSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
});

export async function renameOrganization(
  formData: FormData,
): Promise<ActionResult<{ name: string }>> {
  const { organization, role } = await requireOrganization();
  if (role !== "OWNER") return { ok: false, error: "Solo el propietario puede renombrar" };

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
  role: z.enum(["OWNER", "ADMIN", "THERAPIST"]).default("THERAPIST"),
});

function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function inviteMember(
  formData: FormData,
): Promise<ActionResult<{ token: string; email: string }>> {
  const { organization, role } = await requireOrganization();
  if (role !== "OWNER" && role !== "ADMIN") {
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
      role: parsed.data.role,
      token,
      expiresAt,
      createdById: me.id,
    },
  });

  revalidatePath("/settings");
  return { ok: true, token, email };
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

const roleSchema = z.enum(["OWNER", "ADMIN", "THERAPIST"]);

export async function changeMemberRole(
  membershipId: string,
  newRole: string,
): Promise<ActionResult> {
  const { organization, role, user } = await requireOrganization();
  if (role !== "OWNER") return { ok: false, error: "Solo el propietario puede cambiar roles" };

  const parsed = roleSchema.safeParse(newRole);
  if (!parsed.success) return { ok: false, error: "Rol inválido" };

  const m = await db.membership.findFirst({
    where: { id: membershipId, organizationId: organization.id },
  });
  if (!m) return { ok: false, error: "Membresía no encontrada" };
  if (m.userId === user.id) return { ok: false, error: "No podés cambiar tu propio rol" };

  await db.membership.update({ where: { id: m.id }, data: { role: parsed.data } });
  revalidatePath("/settings");
  return { ok: true };
}

export async function removeMember(membershipId: string): Promise<ActionResult> {
  const { organization, role, user } = await requireOrganization();
  if (role !== "OWNER") return { ok: false, error: "Solo el propietario puede remover miembros" };

  const m = await db.membership.findFirst({
    where: { id: membershipId, organizationId: organization.id },
  });
  if (!m) return { ok: false, error: "Membresía no encontrada" };
  if (m.userId === user.id) return { ok: false, error: "No podés removerte a vos mismo" };

  await db.membership.delete({ where: { id: m.id } });
  revalidatePath("/settings");
  return { ok: true };
}

// ─────────────────── 7.5. Aceptar invitación ────────────────────────────────

export async function acceptInvitation(
  token: string,
): Promise<ActionResult<{ organizationId: string }>> {
  const user = await requireUser();
  const inv = await db.invitation.findUnique({ where: { token } });
  if (!inv) return { ok: false, error: "Invitación no encontrada" };
  if (inv.acceptedAt) return { ok: false, error: "La invitación ya fue aceptada" };
  if (inv.expiresAt < new Date()) return { ok: false, error: "La invitación venció" };

  // Idempotente: si ya hay membership, marcar aceptada y listo.
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
