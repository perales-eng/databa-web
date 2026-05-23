# Plan de operación / deploy — datABA web

> Estado actual: aplicación Next.js 16 + Prisma + Postgres funcionando en local. Fases 0–8 del PLAN cerradas. No hay deploy ni distribución todavía.

Este documento describe dos caminos para llevar el producto a usuarios reales:

- **Plan A — Gratis (MVP operativo)**: la app online y usable, con costo $0/mes (dominio opcional ~$10/año).
- **Plan B — Profesional ($$)**: misma app, infraestructura robusta y compliant, listo para escalar y facturar.

Ambos planes son **incrementales**: arrancás con A y migrás piezas a B cuando lo justifiquen los usuarios reales.

---

## Plan A — Gratis / MVP operativo

**Objetivo**: que cualquier persona con un link pueda usar la app desde su browser o teléfono. Cero costo recurrente.

### Stack propuesto

| Componente | Servicio | Free tier | Por qué |
|---|---|---|---|
| **Hosting Next.js** | [Vercel](https://vercel.com) Hobby | 100 GB ancho de banda/mes, deploys ilimitados, 10s function timeout | Soporte nativo Next.js, deploy con `git push`, edge functions automáticas |
| **Postgres** | [Neon](https://neon.tech) Free | 0.5 GB storage, 100h compute/mes, auto-suspend en idle | Postgres serverless, integración 1-click con Vercel, branches por PR |
| **Auth** | NextAuth credentials (ya implementado) | $0 | Sin terceros |
| **Email transaccional** | [Resend](https://resend.com) Free | 3000 emails/mes, 100/día | Para invitaciones reales (hoy copy-link). Bonus: API simple |
| **Dominio** | `tuapp.vercel.app` gratis | $0 | Dominio propio opcional, ~$10/año (Cloudflare/Namecheap/Porkbun) |
| **SSL** | Automático en Vercel | $0 | Let's Encrypt detrás |
| **Logs** | Vercel built-in (7 días retención) | $0 | Console logs ya estructurados en JSON (logger.ts) |
| **Monitoreo errores** | [Sentry](https://sentry.io) Developer | 5 k errores/mes, 50 reemplays/mes | Captura runtime errors front + server actions |
| **Backups BD** | Neon auto-snapshots | 7 días retención point-in-time | Sin acción manual |
| **CI** | GitHub Actions (ya configurado) | 2000 min/mes en repos públicos | Ya está cableado para lint/typecheck/test/build |
| **PWA** | Sin costo, código propio | $0 | Cubre Android + iOS + Mac desde el mismo código |

### Trabajo pendiente (en orden recomendado)

#### Fase 9 — PWA (1-2 días)
- [ ] **9.1.** `public/manifest.webmanifest` con nombre, ícono, theme color, display=standalone.
- [ ] **9.2.** Set de íconos PWA (192px, 512px, maskable).
- [ ] **9.3.** Service worker con cache de assets estáticos + offline fallback page.
- [ ] **9.4.** `<meta>` tags en root layout para iOS/Android.
- [ ] **9.5.** Detectar `beforeinstallprompt` y mostrar CTA "Instalar app" en el dashboard.
- [ ] **9.6.** Verificar PWA con Lighthouse (objetivo >90 en PWA score).
- [ ] **9.7.** Probar en Chrome Android + Safari iOS (Add to Home Screen).

**Resultado**: la app se instala en cualquier teléfono o tablet desde el browser, sin stores.

#### Fase 10 — Deploy a Vercel + Neon (medio día)
- [ ] **10.1.** Crear cuenta Vercel + GitHub linked.
- [ ] **10.2.** Crear cuenta Neon, crear database `databa-prod`.
- [ ] **10.3.** Conectar repo en Vercel → import.
- [ ] **10.4.** Env vars: `DATABASE_URL` (Neon pooled URL), `NEXTAUTH_SECRET` (`openssl rand -base64 32`), `NEXTAUTH_URL` (`https://tu-app.vercel.app`).
- [ ] **10.5.** Modificar `package.json`: `"build": "prisma migrate deploy && next build"` para correr migraciones en cada deploy.
- [ ] **10.6.** Primer deploy → verificar que carga, que login funciona.
- [ ] **10.7.** Correr seed remoto: `DATABASE_URL="..." npx tsx prisma/seed.ts`.
- [ ] **10.8.** Hardening de cookies: agregar `secure: true, sameSite: "lax"` en NextAuth config si no está.
- [ ] **10.9.** Configurar dominio propio (opcional) — Vercel guía paso a paso.

#### Fase 11 — Invitaciones por email reales (medio día)
- [ ] **11.1.** Crear cuenta Resend, verificar dominio (o usar `onboarding@resend.dev` para testing).
- [ ] **11.2.** Env var `RESEND_API_KEY`.
- [ ] **11.3.** En `inviteMember()` (src/server/organizations.ts), tras crear el token, llamar a `resend.emails.send(...)` con link a `/invite/[token]`.
- [ ] **11.4.** Mantener el copy-link como fallback en la UI por si el email no llega.

#### Fase 12 — Hardening básico para prod (1 día)
- [ ] **12.1.** Rate limit en `/api/auth/callback/credentials` para evitar brute force (usar `@upstash/ratelimit` + Upstash Redis free, o middleware simple por IP).
- [ ] **12.2.** Integrar Sentry (`@sentry/nextjs`) con DSN free tier.
- [ ] **12.3.** `robots.txt` + `sitemap.xml` mínimo.
- [ ] **12.4.** Validar que los uploads (si los hubiera más adelante) tienen límites.
- [ ] **12.5.** Smoke test final post-deploy: signup, crear org, invitar, medir, exportar PDF.

### Limitaciones reales del Plan A

| Limitación | Impacto | Cuándo molesta |
|---|---|---|
| Neon auto-suspende tras 5 min idle | Primera request tras pausa: ~1 s extra | Solo en uso esporádico. Tras suspender la app despierta sola |
| Neon free: 0.5 GB | Suficiente para ~10–20 clínicas pequeñas | Cuando empieza a usarse en serio |
| Vercel function timeout 10 s | PDFs grandes (>50 estudiantes) podrían cortar | No es problema hoy (PDFs son <50 KB) |
| Resend: 100 emails/día | Hasta 100 invitaciones por día | Casi nunca para una clínica chica |
| Sin SLA, sin soporte | Si Vercel cae, vos esperás como todos | Aceptable para MVP |
| Sin región específica | Latencia variable según usuarios | Aceptable para Argentina/LatAm en Vercel global |

### Costo total Plan A

- **$0/mes** si usás dominio `*.vercel.app`.
- **~$10/año** si querés dominio propio (sólo el costo del registrar).

---

## Plan B — Profesional / "100% productivo"

**Objetivo**: cumplir con expectativas de una empresa SaaS real (clínicas pagando, datos sensibles, equipos distribuidos). Listo para auditar, escalar y vender.

### Stack propuesto

| Componente | Servicio | Costo aprox/mes | Por qué |
|---|---|---|---|
| **Hosting** | Vercel Pro o Fly.io / Railway | $20–40 | Más bandwidth, function timeout 60–300 s, password-protect deploys, analytics |
| **Postgres** | Neon Pro o Supabase Pro o RDS | $19–25+ | Sin auto-suspend, branching ilimitado, PITR, mayor compute |
| **Email** | Postmark o Resend Pro | $15–20 | Mejor deliverability (importante: invitaciones llegan, no se quedan en spam), reportes de bounces, dominio dedicado |
| **Monitoreo errores** | Sentry Team | $26 | Más eventos, alertas, integraciones Slack |
| **Logs centralizados** | Better Stack / Datadog / Axiom | $20–60 | Búsqueda, retención larga, alertas por queries |
| **Monitoring sintético** | Checkly o UptimeRobot Pro | $0–15 | Pinguea endpoints cada minuto, te avisa si cae |
| **CDN / WAF** | Cloudflare Pro (opcional) | $20 | Caching, anti-DDoS, bot management |
| **Storage** (si se suman uploads) | Vercel Blob, R2 (Cloudflare) | $0–5 | Avatars, fotos en ABC records, attachments |
| **Backups externos** | S3/R2 + cron | $1–3 | Dump diario fuera de la BD primaria — política "3-2-1" |
| **Dominio propio** | Cloudflare Registrar | ~$1/mes ($10/año) | A precio de costo, sin upsells |
| **Auth federado** | Google/Microsoft OAuth (gratis) o WorkOS | $0–125 | Las clínicas grandes piden SSO |
| **Compliance** | HIPAA-eligible hosting (AWS BAA, Vercel Enterprise) | varía | Si datos clínicos lo exigen legalmente |

**Total estimado**: ~$80–150/mes para una operación profesional sin necesidades extremas.

### Trabajo pendiente (orden recomendado)

#### Fase 13 — Identidad y compliance (1 semana)
- [ ] **13.1. 2FA opcional** (`@simplewebauthn/server` o TOTP via `otpauth`). Para roles OWNER/ADMIN como mínimo.
- [ ] **13.2. SSO Google/Microsoft** vía NextAuth providers oficiales. Una clínica que viene con Google Workspace lo pide día 1.
- [ ] **13.3. Audit log**: tabla `AuditEvent` (actor, action, entity, before/after, ip, ua, timestamp) + helper para grabar desde server actions clave (login, invite, change role, delete student/session).
- [ ] **13.4. Página `/account/export-my-data`**: dump JSON de todo lo que el usuario "produjo" para cumplir GDPR/Ley 25.326 (Argentina).
- [ ] **13.5. Botón `/account/delete`**: soft-delete del usuario y purge programado a 30 días.
- [ ] **13.6. Política de retención** documentada en `/legal/privacy`.

#### Fase 14 — Robustez de infraestructura (3-5 días)
- [ ] **14.1.** Vercel Pro o migrar a Fly.io (sin auto-suspend, region pinned, healthchecks).
- [ ] **14.2.** Neon/Supabase Pro: branch automática por PR, PITR 30 días.
- [ ] **14.3.** Sentry Team + alertas a Slack/Discord.
- [ ] **14.4.** Better Stack para logs estructurados (ya emitís JSON line desde logger.ts).
- [ ] **14.5.** Synthetic checks (Checkly o cron + Slack): login + crear sesión + medir → si falla, alarma.
- [ ] **14.6.** Cloudflare delante (proxy DNS): WAF rules, rate limit, bot fight mode.
- [ ] **14.7.** Backups externos: cron diario que pgdump → S3/R2 (~$2/mes total).
- [ ] **14.8.** Restore drill documentado y probado al menos 1 vez.

#### Fase 15 — Features profesionales (variable)
- [ ] **15.1. File uploads**: avatares estudiantes, fotos en ABC records, attachments en notas. Usar Vercel Blob o R2 con presigned URLs.
- [ ] **15.2. Notificaciones push** (web push API + Service Worker, gratis): "Tu próxima sesión empieza en 15 min".
- [ ] **15.3. Recordatorios por email** (Postmark + cron).
- [ ] **15.4. Webhooks salientes** para integraciones con sistemas de turnos / facturación externos.
- [ ] **15.5. Billing/Stripe** si se va a cobrar a clínicas: plan, asientos, trial, métricas.
- [ ] **15.6. Multi-language**: l10n con `next-intl` (hoy todo está en español hardcodeado).
- [ ] **15.7. White-label opcional**: cada org elige logo y color primario.

#### Fase 16 — Mobile nativa con Capacitor (1-2 semanas)
- [ ] **16.1.** Instalar Capacitor 6 y configurar para proyectos Next.js + remote URL.
- [ ] **16.2.** Generar proyectos `ios/` y `android/`.
- [ ] **16.3.** Ajustar CORS y cookies para esquemas `capacitor://localhost` y `https://localhost`.
- [ ] **16.4.** Configurar deep links para retornar tras login OAuth.
- [ ] **16.5.** Splash screen + íconos nativos.
- [ ] **16.6. Android**: cuenta Google Play Developer ($25 one-time), publicar APK firmado.
- [ ] **16.7. iOS**: cuenta Apple Developer ($99/año), Xcode, publicar TestFlight → App Store.
- [ ] **16.8.** Pipeline de release con [EAS Build](https://expo.dev/eas) o GitHub Actions + Fastlane.

### Lo que se gana con Plan B

| Capacidad | Plan A | Plan B |
|---|---|---|
| Tiempo de respuesta consistente | sub-2 s (a veces 1 s extra cold start) | sub-500 ms siempre |
| SLA / uptime | "best effort" | 99.9 %+ con monitoreo activo |
| Datos sensibles | OK para uso interno | Auditable, retenciones documentadas |
| SSO / 2FA | Solo credentials | Google, Microsoft, 2FA opcional |
| Auditoría legal | No | Audit log + export + delete |
| Push notifications | Limitado en iOS PWA | Nativo en iOS via Capacitor |
| Distribución | Link / "Add to home" | Play Store + App Store |
| Crecimiento BD | 0.5 GB | TB-scale, branches, PITR |

---

## Plan recomendado — orden de ejecución

### Fase 1: Llegar a producción gratis (1 semana)
1. **Fase 9 — PWA** (lo más valioso para usuarios móviles, $0)
2. **Fase 10 — Deploy Vercel + Neon**
3. **Fase 11 — Email invitaciones con Resend**
4. **Fase 12 — Rate limit + Sentry + smoke test**

Al final: app online, instalable como app en Android/iOS/Mac, invitaciones funcionando, $0/mes.

### Fase 2: Validar con usuarios reales (1–3 meses)
Sin agregar costo, recoger feedback de 5–10 clínicas piloto. Aprender qué falta de verdad.

### Fase 3: Profesionalizar lo que duele (cuando duela)
Migrar pieza por pieza a Plan B según necesidad real:
- ¿Las invitaciones caen en spam? → Postmark.
- ¿Una clínica grande pide SSO? → Fase 13.2.
- ¿Cayó la BD un sábado? → Neon Pro + monitoreo (Fase 14).
- ¿Piden app de App Store? → Fase 16.

**No pagar por adelantado lo que todavía no duele.**

### Fase 4: Si se monetiza (Fase 15.5)
Recién acá entra Stripe, planes, métricas. Antes no tiene sentido.

---

## Resumen ejecutivo

| | Plan A | Plan B completo |
|---|---|---|
| Costo recurrente | **$0/mes** | ~$80–150/mes + $99/año Apple |
| Setup inicial | 1 semana de trabajo | 3-4 semanas adicionales sobre Plan A |
| Distribución | Web + PWA (Android, iOS, Mac) | + Play Store + App Store |
| Audiencia objetivo | Uso piloto, beta privada, clínicas chicas | SaaS multi-tenant pagando |
| Cuándo no alcanza | Cuando hay >50 clínicas activas, requisitos legales formales, o necesidad de SLA | — |

**Recomendación**: empezar **Fase 9 (PWA)** mañana. Es lo de mejor ratio valor/esfuerzo y abre la puerta a todo lo demás.
