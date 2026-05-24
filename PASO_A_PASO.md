# Cómo poner datABA online — paso a paso

> Guía pensada para alguien que **no es programador**. Si en algún paso algo no aparece como lo describo, no es tu culpa: las páginas cambian. Avisame y lo actualizamos.

Tiempo total estimado: **45 minutos** la primera vez (después un deploy es 1 minuto).
Costo: **$0** si usás el dominio gratis de Vercel. ~$10/año si querés uno propio (opcional).

---

## Lo que necesitás antes de empezar

- Una cuenta de email (la vamos a usar para registrarte en GitHub, Vercel y Neon).
- Una computadora con un navegador (Chrome, Safari, Edge — cualquiera funciona).
- 30 min seguidos sin interrupciones.
- **No necesitás** tarjeta de crédito.

---

## Paso 1 — Subir el código a GitHub (~10 min)

GitHub es donde "vive" el código. Vercel lo lee de ahí para ponerlo online.

### 1.1. Crear cuenta GitHub (si no tenés una)

1. Abrí [github.com](https://github.com) en el navegador.
2. Clic en **"Sign up"** arriba a la derecha.
3. Seguí los pasos (email, contraseña, username).
4. Verificá el email cuando llegue.

### 1.2. Crear un repositorio nuevo

1. Una vez logueado, clic en el **`+`** arriba a la derecha → **"New repository"**.
2. **Repository name**: `databa-web` (o el que quieras).
3. **Description**: opcional.
4. Dejá **Public** (las cuentas gratis solo pueden hacer deploys de repos públicos en algunos planes, aunque Vercel acepta privados gratis también — ambas opciones funcionan).
5. **NO** tildes "Add a README", "Add .gitignore", "Choose a license". El proyecto ya los tiene.
6. Clic en **"Create repository"**.

### 1.3. Subir el código

GitHub te va a mostrar una pantalla con instrucciones. Vas a usar las del bloque **"…or push an existing repository from the command line"**.

Abrí la Terminal en tu Mac (Aplicaciones → Utilidades → Terminal) y pegá estos comandos uno por uno (cambiá `TU-USUARIO` por tu username de GitHub real):

```bash
cd /Users/papa-mac/Projects/localmac/databa-web
git remote add origin https://github.com/TU-USUARIO/databa-web.git
git branch -M main
git push -u origin main
```

La primera vez te va a pedir login. **Si te pide contraseña, NO uses la de GitHub** — GitHub ya no acepta eso. Tenés que usar un "Personal Access Token":

1. En GitHub: clic en tu foto arriba a la derecha → **Settings**.
2. En el menú izquierdo, bajá hasta **"Developer settings"**.
3. **Personal access tokens** → **Tokens (classic)** → **Generate new token (classic)**.
4. Note: "databa-web push".
5. Expiration: 90 days.
6. Tildá solo el primer scope: **repo**.
7. Generate token. **Copialo ya** — no lo vas a poder ver de nuevo.
8. Pegalo cuando la terminal pida "Password".

**Verificación**: actualizá la página del repositorio en GitHub. Debería aparecer todo el código (PLAN.md, DEPLOY.md, src/, etc.).

---

## Paso 2 — Crear la base de datos en Neon (~5 min)

Neon es donde van a vivir los datos (estudiantes, sesiones, mediciones). Tiene un plan gratis perfecto para empezar.

1. Abrí [neon.tech](https://neon.tech).
2. Clic en **"Sign Up"** (arriba a la derecha) → **"Continue with GitHub"**. Te logueás con tu cuenta GitHub.
3. En el formulario inicial:
   - **Project name**: `databa`
   - **Postgres version**: dejá lo default
   - **Region**: elegí **"AWS South America (São Paulo)"** si vas a usar la app desde Argentina/LatAm (más rápido).
4. Clic en **"Create project"**.

### 2.1. Copiar la "connection string"

Una vez creado, vas a ver una pantalla con datos de conexión.

1. Vas a ver un cuadro con un link largo que empieza con `postgresql://...`. Asegurate que arriba diga **"Pooled connection"** (a veces hay un toggle entre pooled y direct — usá **pooled**).
2. Clic en el botón de **copiar** (ícono de dos rectángulos).
3. **Pegá ese link en un documento de notas** — lo vamos a usar en el paso siguiente. Anotalo como "DATABASE_URL".

> 🛟 Si cerraste la pantalla sin copiar: en el dashboard de Neon, **Dashboard → Connection Details** lo volvés a ver.

---

## Paso 3 — Deploy en Vercel (~10 min)

Vercel toma el código de GitHub y lo pone online.

### 3.1. Crear cuenta

1. Abrí [vercel.com](https://vercel.com).
2. Clic en **"Sign Up"** → **"Continue with GitHub"**.
3. Aceptá los permisos que pide (Vercel necesita leer tu repo).
4. Si te pregunta "Which scope" o "Hobby plan", elegí **Hobby (free)**.

### 3.2. Importar el repo

1. En el dashboard de Vercel vas a ver **"Add New..." → Project**.
2. Te aparece una lista de repos de GitHub. Buscá **`databa-web`** y clic en **"Import"**.
3. La siguiente pantalla detecta automáticamente que es un proyecto Next.js. **No cambies nada** de:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: dejá lo default

### 3.3. Configurar las "Environment Variables"

Esto es lo más importante. Son las "claves" que la app necesita para conectarse a la base de datos y manejar el login.

> ⚠️ **Los nombres deben ser EXACTOS** (mayúsculas, guion bajo, sin espacios). La forma más segura es **copiar y pegar** el nombre desde acá:
>
> - `DATABASE_URL`
> - `AUTH_SECRET`
> - `AUTH_URL`
>
> Variantes parecidas (`AUTH_KEY`, `AUTHSECRET`, `auth_secret`, etc.) **NO funcionan** — la app no las encuentra y vas a tener errores raros tipo "page not found" en todos los botones.

Bajá en la misma pantalla hasta donde dice **"Environment Variables"**. Vas a agregar **TRES** entradas. En cada una asegurate que los **3 environments** estén tildados: ☑ Production, ☑ Preview, ☑ Development.

**Entrada 1: `DATABASE_URL`**
- Key: `DATABASE_URL` (copiá y pegá esto)
- Value: pegá el link que copiaste de Neon en el paso 2.1 (el "Pooled connection", empieza con `postgresql://...`).
- Clic en **"Save"** (o "Add Another" si querés cargar la siguiente sin guardar todavía).

**Entrada 2: `AUTH_SECRET`**

Es una clave aleatoria que usa la app para firmar las cookies de login. Generá una así:

1. Abrí [generate-secret.vercel.app/32](https://generate-secret.vercel.app/32) en otra pestaña.
2. Vas a ver una cadena larga de letras/números/símbolos. Copiala (Cmd+A → Cmd+C).
3. Volvé a Vercel.
- Key: `AUTH_SECRET` (copiá y pegá esto, **NO** uses `AUTH_KEY`, `SECRET`, ni nada parecido)
- Value: pegá la cadena del paso 2.

**Entrada 3: `AUTH_URL`**

Acá necesitás el dominio que te asignó Vercel. Si todavía no deployaste, **no lo conocés** — por eso este paso parece raro. Tenés dos opciones:

**Opción A (recomendada): hacer el deploy primero, después agregar `AUTH_URL`**

1. **Saltate esta entrada por ahora**.
2. Hacé el paso 3.4 (Deploy) con solo las primeras 2 variables.
3. El primer deploy probablemente falle al loguear, pero ya vas a tener el dominio. Volvé acá y agregá `AUTH_URL` con el dominio real.

**Opción B: agregarla con un valor temporal y editarla después**

- Key: `AUTH_URL`
- Value: `https://placeholder.vercel.app` (la vamos a corregir en el paso 3.5)

### 3.4. Deploy

1. Clic en el botón grande **"Deploy"**.
2. Va a aparecer una pantalla con texto desfilando — está compilando la app y aplicando la estructura de la base de datos. **Esto tarda 2-4 minutos**.
3. Cuando termine, vas a ver fuegos artificiales 🎉 y un link a tu app, algo como `databa-web-xxx.vercel.app`.

### 3.5. Ajustar AUTH_URL al dominio real

Necesitamos decirle a la app cuál es su dirección real:

1. En la pantalla post-deploy, copiá el dominio que te asignó Vercel (ej: `databa-web-abc123.vercel.app`).
2. En Vercel, clic en **"Continue to Dashboard"** (o en tu proyecto si ya estás ahí).
3. Arriba clic en la pestaña **"Settings"**.
4. En el menú izquierdo: **"Environment Variables"**.
5. Buscá la fila `AUTH_URL`. Clic en los **tres puntitos** a la derecha → **"Edit"**.
6. Cambiá el valor a: `https://databa-web-abc123.vercel.app` (el tuyo real, con `https://` adelante y sin `/` al final).
7. **Save**.

### 3.6. Re-deploy para que tome el cambio

1. Arriba clic en la pestaña **"Deployments"**.
2. En el deploy más reciente (el de arriba), clic en los **tres puntitos** a la derecha → **"Redeploy"**.
3. Va a aparecer un popup. Clic en **"Redeploy"** otra vez (sin tildar "Use existing Build Cache").
4. Esperá 2 min.

### 3.7. Probarlo

1. Abrí tu dominio en el navegador: `https://databa-web-xxx.vercel.app`.
2. Vas a ver la pantalla de bienvenida. Clic en **"Crear cuenta"** o **"Iniciar sesión"**.
3. Probá registrarte con tu email real.
4. Después del signup deberías ver el dashboard.

**Si funciona: ¡felicitaciones, la app está online!**

---

## Paso 4 — Cargar datos demo (opcional, ~5 min)

Si querés que la app tenga datos de ejemplo para mostrar antes de cargar los tuyos reales:

1. Volvé a Neon → tu proyecto → **Dashboard**.
2. Esta vez necesitamos la **"Direct connection"** (no la pooled). Hay un toggle/menú que dice "Pooled connection" — cambialo a **"Direct connection"** y copiá ese link.
3. En tu Mac, abrí la Terminal y pegá (reemplazando `PEGAR_AQUI_EL_LINK_DIRECT`):

```bash
cd /Users/papa-mac/Projects/localmac/databa-web
DATABASE_URL="PEGAR_AQUI_EL_LINK_DIRECT" npx tsx prisma/seed.ts
```

4. Vas a ver:
   ```
   ✓ Seed completo:
     Login: demo@databa.app / demo1234
     ...
   ```
5. Ahora podés loguearte en `tu-app.vercel.app` con **demo@databa.app** / **demo1234** y ver datos de ejemplo (Mateo, Sofía, etc.).

---

## Paso 5 — Emails de invitación (opcional, ~10 min)

Hoy, cuando invitás a alguien a tu organización, la app genera un link y vos tenés que copiárselo manualmente. Para que el email se envíe solo:

### 5.1. Cuenta Resend

1. Abrí [resend.com](https://resend.com).
2. Clic en **"Sign Up"** → **"Continue with GitHub"**.
3. Una vez adentro, en el menú izquierdo: **"API Keys"**.
4. Clic en **"Create API Key"**.
5. Name: `databa production`. Permissions: **Full Access**. Domain: dejá "All Domains".
6. Clic en **"Add"**. Copiá el key que aparece (empieza con `re_...`). **Solo se ve una vez**.

### 5.2. Agregar el key a Vercel

1. En Vercel: **Settings → Environment Variables → "Add New"**.
2. Key: `AUTH_RESEND_KEY`. Value: el key que copiaste.
3. **Save**.
4. Hacé un redeploy (paso 3.6).

Listo. Ahora cuando invites a alguien, va a llegarles un email con el link de invitación. **El link copiable también sigue apareciendo** por si el email cae en spam.

> � Sin un dominio propio verificado en Resend, los emails salen desde `onboarding@resend.dev`. Funciona, pero algunos servidores de email pueden marcarlos como spam. Si querés que salgan desde `noreply@tu-dominio.com`, hay que verificar el dominio en Resend — proceso aparte de ~10 min.

---

## Paso 6 — Dominio propio (opcional, ~15 min, ~$10/año)

Si querés que la app esté en `tu-clinica.com` en vez de `databa-web-xxx.vercel.app`:

### 6.1. Comprar el dominio

Recomendado: [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) (cobra precio de costo, sin trampas). Alternativas: Namecheap, Porkbun.

1. Buscá el dominio que querés. Pagá (~$10/año).

### 6.2. Conectarlo a Vercel

1. En Vercel: tu proyecto → **Settings → Domains**.
2. Escribí tu dominio (ej. `tu-clinica.com`) → **Add**.
3. Vercel te muestra qué registros DNS configurar (suelen ser uno A y uno CNAME).
4. En el panel de Cloudflare/Namecheap/donde compraste, agregás esos registros DNS.
5. Volvé a Vercel y esperá unos minutos a que verifique. Cuando aparece verde **"Valid Configuration"**, ya está.

### 6.3. Actualizar AUTH_URL

Mismo proceso del paso 3.5/3.6, pero usando el dominio nuevo (`https://tu-clinica.com`). Redeploy.

---

## Cómo deployar cambios futuros

Una vez configurado todo lo de arriba, **un nuevo deploy es automático**: cada vez que hagas cambios al código y los subas con `git push` a GitHub, Vercel detecta el cambio y deploya solo en 1-2 minutos.

Para hacer un cambio:

```bash
cd /Users/papa-mac/Projects/localmac/databa-web
# editás archivos
git add -A
git commit -m "describe qué cambiaste"
git push
```

Andá a [vercel.com/dashboard](https://vercel.com/dashboard), entrá a tu proyecto, y vas a ver el deploy en curso.

---

## Problemas comunes

### "Cualquier botón del home me tira a /dashboard con 'This page couldn't be found'"

**Causa**: `AUTH_SECRET` no está bien configurada (lo más común: mal nombrada, ej. `AUTH_KEY` en vez de `AUTH_SECRET`). Sin esa variable, la app no puede manejar las sesiones y todo el flujo de login se rompe.

**Verificación**: en Vercel → Logs (pestaña arriba o Observability → Logs), buscá una línea que diga:
```
[auth][error] MissingSecret: Please define a `secret`
```
Si la ves, confirmaste el diagnóstico.

**Solución**:
1. Settings → Environment Variables.
2. Mirá la lista de variables guardadas. Tiene que estar **exactamente** `AUTH_SECRET` (no `AUTH_KEY`, no `SECRET`, no `NEXTAUTH_SECRET`).
3. Si está mal nombrada: copiá el valor → borrá la variable mal nombrada → creá una nueva con el nombre `AUTH_SECRET` → pegá el valor → Save.
4. Tildá los 3 environments (Production, Preview, Development).
5. **Deployments → ⋯ → Redeploy** del deploy más reciente (sin "Use existing Build Cache").
6. Esperá a que termine y probá en una ventana incógnita nueva.

### "El deploy falla en el build"

Mirá el log que aparece en Vercel. Errores comunes:
- **"AUTH_SECRET is not set"** → falta o está mal nombrada (ver arriba).
- **"Can't reach database server"** → la `DATABASE_URL` está mal copiada. Volvé a copiarla de Neon y pegala en Vercel Settings → Environment Variables → editar la fila → Save → Redeploy.
- **"prisma migrate deploy failed"** → la URL de Neon "pooled" a veces no acepta migraciones. Cambialo temporalmente por la "direct connection" de Neon, redeploy, después podés volver a "pooled".

### "La app abre pero al loguearme me tira error"

Es casi seguro que `AUTH_URL` no coincide con el dominio actual. Andá a Settings → Environment Variables y verificá que el valor:
- Empiece con `https://` (no `http://`)
- Sea **exactamente** el dominio que ves en el navegador
- **No termine con `/`** (sin barra al final)

### "Demoró 5 segundos en cargar la primera vez"

Normal en el plan gratis. Neon "duerme" la base de datos cuando no la usás por 5 minutos. La primera request la despierta (tarda ~1-2s), las siguientes son rápidas. Si te molesta, hay que pasar a Neon Pro ($19/mes).

### "Cambié un env var pero el problema persiste"

Los environment variables **solo se aplican a deploys NUEVOS**. Después de cambiar uno tenés que ir a Deployments → ⋯ → Redeploy (sin "Use existing Build Cache"). El deploy actual sigue corriendo con los valores viejos hasta que lo redeployás.

### "Probé en incógnito pero sigue igual"

Algunos navegadores (DuckDuckGo, Brave) no limpian cookies en modo privado tan agresivamente como Chrome. Si la cookie vieja persiste, probá:
- En el mismo navegador: Settings → Privacy → borrar cookies de `tu-app.vercel.app` específicamente.
- O probá desde **Chrome en incógnito** (Cmd+Shift+N) — Chrome sí limpia todo entre sesiones incógnitas.

### "Algo se rompió y no sé qué"

1. Andá a Vercel → tu proyecto → pestaña **"Logs"** (o "Observability → Logs").
2. Vas a ver los errores en tiempo real. Compartilos si necesitás ayuda.
3. También podés filtrar por **Runtime Logs** (errores del servidor cuando se carga una página) o **Build Logs** (errores al compilar).

---

## Lo que ya tenés funcionando

Una vez seguido este paso a paso, tu instalación de datABA queda:

- ✅ Accesible desde cualquier teléfono o computadora con internet
- ✅ Instalable como app en Android / iOS / Mac (al abrir el link, "Add to Home Screen")
- ✅ Multi-usuario: cada terapeuta tiene su login
- ✅ Multi-organización: cada clínica tiene sus datos separados
- ✅ Con backups automáticos (Neon hace snapshots diarios)
- ✅ Con HTTPS (cifrado)
- ✅ Sin costo recurrente

**Lo que falta solo es la decisión de empezar.** 🚀
