/**
 * Inicialización de Sentry en el cliente. Sólo se activa si
 * NEXT_PUBLIC_SENTRY_DSN está presente — sin DSN no se carga el SDK.
 */

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      replaysSessionSampleRate: 0,
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV || "development",
    });
  });
}
