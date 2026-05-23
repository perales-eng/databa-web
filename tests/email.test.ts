import { describe, it, expect } from "vitest";
import { invitationEmail } from "@/lib/email";

describe("invitationEmail", () => {
  it("genera subject con nombres del inviter y org", () => {
    const { subject } = invitationEmail({
      organizationName: "Clínica X",
      inviterName: "Ana",
      inviteUrl: "https://app/invite/abc",
      role: "THERAPIST",
    });
    expect(subject).toBe("Ana te invitó a Clínica X en datABA");
  });

  it("incluye el link en HTML y text", () => {
    const url = "https://app/invite/token-123";
    const { html, text } = invitationEmail({
      organizationName: "Org",
      inviterName: "Inv",
      inviteUrl: url,
      role: "ADMIN",
    });
    expect(html).toContain(url);
    expect(text).toContain(url);
    expect(html).toContain("Administrador");
  });

  it("escapa HTML peligroso en nombres", () => {
    const { html } = invitationEmail({
      organizationName: "<script>alert(1)</script>",
      inviterName: 'Bob "the" <evil>',
      inviteUrl: "https://app/invite/x",
      role: "THERAPIST",
    });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&quot;the&quot;");
  });

  it("traduce el rol al castellano", () => {
    expect(invitationEmail({ organizationName: "o", inviterName: "i", inviteUrl: "u", role: "OWNER" }).html).toContain("Propietario");
    expect(invitationEmail({ organizationName: "o", inviterName: "i", inviteUrl: "u", role: "ADMIN" }).html).toContain("Administrador");
    expect(invitationEmail({ organizationName: "o", inviterName: "i", inviteUrl: "u", role: "THERAPIST" }).html).toContain("Terapeuta");
  });
});
