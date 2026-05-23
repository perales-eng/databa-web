import { Resend } from "resend";
import { logger } from "@/lib/logger";

type SendResult = { ok: true; id: string } | { ok: false; error: string; skipped?: boolean };

let cached: Resend | null = null;

function client(): Resend | null {
  if (cached) return cached;
  const key = process.env.AUTH_RESEND_KEY;
  if (!key) return null;
  cached = new Resend(key);
  return cached;
}

export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<SendResult> {
  const c = client();
  if (!c) {
    logger.info("email.skipped", { reason: "no AUTH_RESEND_KEY", to: args.to });
    return { ok: false, error: "Email no configurado", skipped: true };
  }
  const from = process.env.EMAIL_FROM || "datABA <onboarding@resend.dev>";
  try {
    const { data, error } = await c.emails.send({
      from,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    });
    if (error) {
      logger.error("email.send_failed", { to: args.to, error: error.message });
      return { ok: false, error: error.message };
    }
    if (!data) return { ok: false, error: "Sin respuesta de Resend" };
    logger.info("email.sent", { to: args.to, id: data.id });
    return { ok: true, id: data.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("email.exception", { to: args.to, error: msg });
    return { ok: false, error: msg };
  }
}

export function invitationEmail(args: {
  organizationName: string;
  inviterName: string;
  inviteUrl: string;
  role: string;
}): { subject: string; html: string; text: string } {
  const { organizationName, inviterName, inviteUrl, role } = args;
  const roleLabel = role === "OWNER" ? "Propietario" : role === "ADMIN" ? "Administrador" : "Terapeuta";

  const subject = `${inviterName} te invitó a ${organizationName} en datABA`;

  const html = `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;color:#0f172a;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e5e5;border-radius:12px;overflow:hidden;">
    <div style="background:#0F766E;padding:24px 28px;color:#fff;">
      <h1 style="margin:0;font-size:20px;font-weight:700;">datABA</h1>
      <p style="margin:4px 0 0;opacity:.85;font-size:13px;">Análisis de Conducta Aplicada</p>
    </div>
    <div style="padding:28px;">
      <p style="margin:0 0 14px;font-size:16px;">Hola,</p>
      <p style="margin:0 0 14px;font-size:14px;line-height:1.55;">
        <strong>${escapeHtml(inviterName)}</strong> te invitó a unirte a
        <strong>${escapeHtml(organizationName)}</strong> en datABA como
        <strong>${roleLabel}</strong>.
      </p>
      <p style="margin:0 0 22px;font-size:14px;line-height:1.55;color:#64748b;">
        datABA es una plataforma para registrar y analizar datos conductuales ABA.
      </p>
      <p style="text-align:center;margin:0 0 24px;">
        <a href="${inviteUrl}"
           style="display:inline-block;padding:12px 22px;background:#0f172a;color:#fff;text-decoration:none;border-radius:8px;font-weight:500;font-size:14px;">
          Aceptar invitación
        </a>
      </p>
      <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">
        Si el botón no funciona, copiá y pegá este link en el navegador:<br>
        <a href="${inviteUrl}" style="color:#0f766e;word-break:break-all;">${inviteUrl}</a>
      </p>
      <hr style="border:0;border-top:1px solid #e5e5e5;margin:24px 0 16px;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">
        La invitación vence en 7 días. Si no esperabas este email, podés ignorarlo.
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = `${inviterName} te invitó a ${organizationName} en datABA como ${roleLabel}.

Aceptá la invitación en este link:
${inviteUrl}

La invitación vence en 7 días.`;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
