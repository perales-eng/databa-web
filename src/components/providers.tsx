"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import * as React from "react";
import { startQueueWorker } from "@/lib/offline-client";

function QueueWorkerStarter() {
  React.useEffect(() => {
    startQueueWorker();
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueueWorkerStarter />
      {children}
      <Toaster position="bottom-right" richColors closeButton />
    </SessionProvider>
  );
}
