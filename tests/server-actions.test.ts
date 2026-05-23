import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockDb } = vi.hoisted(() => {
  const m = {
    behavior: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    invitation: { findUnique: vi.fn(), update: vi.fn() },
    membership: { findFirst: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(async (cb: (tx: unknown) => unknown) => cb(m)),
  };
  return { mockDb: m };
});

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: mockDb }));

vi.mock("@/lib/auth-helpers", () => ({
  requireUser: vi.fn(async () => ({
    id: "user-1",
    email: "u@example.com",
    name: "U",
    memberships: [],
  })),
  requireOrganization: vi.fn(async () => ({
    user: { id: "user-1", email: "u@example.com", name: "U", memberships: [] },
    organization: { id: "org-1", name: "Org", slug: "org" },
    role: "OWNER",
  })),
}));

import { upsertBehaviorByName } from "@/server/behavior-catalog";
import { acceptInvitation } from "@/server/organizations";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("upsertBehaviorByName", () => {
  it("crea uno nuevo si no existe", async () => {
    mockDb.behavior.findUnique.mockResolvedValueOnce(null);
    mockDb.behavior.create.mockResolvedValueOnce({ id: "b-1", name: "Conducta X" });

    const result = await upsertBehaviorByName("org-1", "  Conducta X  ");
    expect(result).toEqual({ id: "b-1", name: "Conducta X" });
    expect(mockDb.behavior.create).toHaveBeenCalledWith({
      data: { organizationId: "org-1", name: "Conducta X" },
    });
  });

  it("reusa el existente sin tocar la base", async () => {
    mockDb.behavior.findUnique.mockResolvedValueOnce({
      id: "b-2",
      name: "Conducta Y",
      deletedAt: null,
    });
    const result = await upsertBehaviorByName("org-1", "Conducta Y");
    expect(result).toEqual({ id: "b-2", name: "Conducta Y" });
    expect(mockDb.behavior.create).not.toHaveBeenCalled();
    expect(mockDb.behavior.update).not.toHaveBeenCalled();
  });

  it("reactiva uno soft-deleted con el mismo nombre", async () => {
    mockDb.behavior.findUnique.mockResolvedValueOnce({
      id: "b-3",
      name: "Vieja",
      deletedAt: new Date(),
    });
    mockDb.behavior.update.mockResolvedValueOnce({ id: "b-3", name: "Vieja" });
    const result = await upsertBehaviorByName("org-1", "Vieja");
    expect(result.id).toBe("b-3");
    expect(mockDb.behavior.update).toHaveBeenCalledWith({
      where: { id: "b-3" },
      data: { deletedAt: null },
    });
  });

  it("rechaza nombre vacío", async () => {
    await expect(upsertBehaviorByName("org-1", "   ")).rejects.toThrow();
  });
});

describe("acceptInvitation", () => {
  it("rechaza token inexistente", async () => {
    mockDb.invitation.findUnique.mockResolvedValueOnce(null);
    const result = await acceptInvitation("nope");
    expect(result).toEqual({ ok: false, error: "Invitación no encontrada" });
  });

  it("rechaza si ya fue aceptada", async () => {
    mockDb.invitation.findUnique.mockResolvedValueOnce({
      id: "inv-1",
      organizationId: "org-1",
      role: "THERAPIST",
      acceptedAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000),
    });
    const result = await acceptInvitation("token");
    expect(result).toEqual({ ok: false, error: "La invitación ya fue aceptada" });
  });

  it("rechaza si ya venció", async () => {
    mockDb.invitation.findUnique.mockResolvedValueOnce({
      id: "inv-2",
      organizationId: "org-1",
      role: "THERAPIST",
      acceptedAt: null,
      expiresAt: new Date(Date.now() - 86400000),
    });
    const result = await acceptInvitation("token");
    expect(result).toEqual({ ok: false, error: "La invitación venció" });
  });

  it("crea Membership cuando todo está en orden", async () => {
    mockDb.invitation.findUnique.mockResolvedValueOnce({
      id: "inv-3",
      organizationId: "org-2",
      role: "ADMIN",
      acceptedAt: null,
      expiresAt: new Date(Date.now() + 86400000),
    });
    mockDb.membership.findFirst.mockResolvedValueOnce(null);

    const result = await acceptInvitation("token");
    expect(result).toEqual({ ok: true, organizationId: "org-2" });
    expect(mockDb.membership.create).toHaveBeenCalledWith({
      data: { userId: "user-1", organizationId: "org-2", role: "ADMIN" },
    });
    expect(mockDb.invitation.update).toHaveBeenCalledWith({
      where: { id: "inv-3" },
      data: { acceptedAt: expect.any(Date) },
    });
  });

  it("es idempotente: si ya hay Membership, marca aceptada sin duplicar", async () => {
    mockDb.invitation.findUnique.mockResolvedValueOnce({
      id: "inv-4",
      organizationId: "org-3",
      role: "THERAPIST",
      acceptedAt: null,
      expiresAt: new Date(Date.now() + 86400000),
    });
    mockDb.membership.findFirst.mockResolvedValueOnce({ id: "mem-existing" });

    const result = await acceptInvitation("token");
    expect(result).toEqual({ ok: true, organizationId: "org-3" });
    expect(mockDb.membership.create).not.toHaveBeenCalled();
    expect(mockDb.invitation.update).toHaveBeenCalled();
  });
});
