# Deploy a producción — Vercel + Neon (gratis)

Guía paso a paso para llevar la app de local a producción en ~30 min, costo $0.

## Pre-requisitos

- Repo de GitHub con este código (push a `main` ya hecho).
- Cuenta GitHub (gratis).
- Tarjeta de crédito NO requerida para los free tiers.

## 1. Postgres en Neon (5 min)

1. Crear cuenta en [neon.tech](https://neon.tech) con GitHub.
2. **Create project** → nombre `databa`, región **South America (São Paulo)** (más cerca para AR/LatAm).
3. Tras crearlo, **Dashboard → Connection Details**:
   - Copiar la **"Pooled connection"** string (termina en `-pooler`). Esta es la que va en `DATABASE_URL`.
   - Tener a mano también la **Direct connection** para correr el seed manual una vez.
4. Por defecto Neon hace auto-suspend a los 5 min idle. Aceptable para empezar.

## 2. Deploy en Vercel (5 min)

1. Crear cuenta en [vercel.com](https://vercel.com) con GitHub.
2. **Add New → Project** → seleccionar este repo.
3. **Framework**: Next.js (auto-detectado).
4. **Root Directory**: dejar `/` (default).
5. **Environment Variables** — agregar las tres:
   ```
   DATABASE_URL = <pooled connection de Neon>
   AUTH_SECRET  = <generar con: openssl rand -base64 32>
   AUTH_URL     = https://<nombre>.vercel.app   # se ajusta tras el primer deploy
   ```
6. **Deploy**. El build correrá `prisma migrate deploy && next build` automáticamente, así que aplica las migraciones a Neon en el primer deploy.

## 3. Ajustar AUTH_URL al dominio final (1 min)

Tras el primer deploy Vercel asigna un dominio como `databa-xxxxx.vercel.app`:

1. **Settings → Domains** → copiar el dominio asignado.
2. **Settings → Environment Variables** → editar `AUTH_URL` con el dominio https.
3. **Deployments → Redeploy** (o triggear con un commit cualquiera).

## 4. Cargar datos demo (opcional, 2 min)

Para que la app tenga datos al primer login:

```bash
# Reemplazar con la Direct connection de Neon (no la pooled)
DATABASE_URL="postgresql://...neon.tech/...?sslmode=require" \
  npx tsx prisma/seed.ts
```

Login: `demo@databa.app` / `demo1234`.

## 5. Dominio propio (opcional, 5 min, ~$10/año)

1. Comprar dominio (Cloudflare Registrar, Namecheap, Porkbun).
2. Vercel **Settings → Domains → Add** → seguir las instrucciones de DNS.
3. Vercel emite SSL automáticamente vía Let's Encrypt.
4. Actualizar `AUTH_URL` al nuevo dominio. Redeploy.

## Verificación post-deploy

```bash
# Manifest sirve correctamente
curl -sI https://tu-app.vercel.app/manifest.webmanifest

# Service worker sirve
curl -sI https://tu-app.vercel.app/sw.js

# Login redirige cuando no hay sesión
curl -sI https://tu-app.vercel.app/dashboard
# → 307 con location: /login?from=%2Fdashboard
```

En móvil (Chrome Android o Safari iOS):

1. Abrir `https://tu-app.vercel.app`.
2. "Add to Home Screen" / aparece prompt nativo de instalación.
3. Abrir desde el ícono → debería verse fullscreen, sin barra del navegador.

## Troubleshooting

- **"AUTH_SECRET is not set"**: la env var falta. Setear en Vercel y redeploy.
- **Cold start lento (~1 s)**: Neon despertando. Es normal en free tier. Subsequente requests son rápidas.
- **Migraciones no se aplican**: chequear el log del build en Vercel; `prisma migrate deploy` debe correr. Si falla por permisos, usar la Direct connection para correrlas manualmente.
- **Cookies inválidas en login**: confirmar que `AUTH_URL` coincide con el dominio actual y empieza con `https://`.
