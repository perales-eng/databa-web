"use client";

import * as React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[FatalError]", error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          margin: 0,
          background: "#f9fafb",
        }}
      >
        <div style={{ maxWidth: 400, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Error crítico
          </h1>
          <p style={{ color: "#6b7280", marginBottom: 16 }}>
            La aplicación encontró un problema grave.
            {error.digest ? ` Código: ${error.digest}` : ""}
          </p>
          <button
            onClick={reset}
            style={{
              padding: "8px 16px",
              background: "#0f172a",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
