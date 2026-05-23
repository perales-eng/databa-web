"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";

const orgSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
});

export type OnboardingResult =
  | { ok: true; organizationId: string; slug: string }
  | { ok: false; error: string };

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

export async function createOrganization(formData: FormData): Promise<OnboardingResult> {
  const user = await requireUser();
  const parsed = orgSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  if (user.memberships.length > 0) {
    const existing = user.memberships[0].organization;
    return { ok: true, organizationId: existing.id, slug: existing.slug };
  }

  const name = parsed.data.name.trim();
  const slug = await uniqueSlug(slugify(name));

  const org = await db.$transaction(async (tx) => {
    const created = await tx.organization.create({
      data: { name, slug },
    });
    await tx.membership.create({
      data: {
        userId: user.id,
        organizationId: created.id,
        role: "OWNER",
      },
    });
    return created;
  });

  revalidatePath("/dashboard");
  return { ok: true, organizationId: org.id, slug: org.slug };
}
