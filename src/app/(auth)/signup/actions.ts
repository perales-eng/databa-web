"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { signupsEnabled } from "@/lib/feature-flags";

const schema = z.object({
  name: z.string().min(2),
  orgName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export type SignupResult = { ok: true } | { ok: false; error: string };

export async function signupAction(formData: FormData): Promise<SignupResult> {
  if (!signupsEnabled()) {
    return { ok: false, error: "El registro está deshabilitado. Pedí acceso al administrador." };
  }
  const parsed = schema.safeParse({
    name: formData.get("name"),
    orgName: formData.get("orgName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Revisá los campos del formulario." };
  }
  const { name, orgName, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "Ya existe una cuenta con ese email." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const slug = orgName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  const uniqueSlug = `${slug}-${Math.random().toString(36).slice(2, 7)}`;

  await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      memberships: {
        create: {
          role: "OWNER",
          organization: {
            create: { name: orgName, slug: uniqueSlug },
          },
        },
      },
    },
  });

  return { ok: true };
}
