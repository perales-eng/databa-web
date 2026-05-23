"use client";

import * as React from "react";
import { AlertCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[AppError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5" />
          </div>
          <CardTitle>No pudimos cargar esta sección</CardTitle>
          <CardDescription>
            Probá de nuevo en un momento. {error.digest ? `(${error.digest})` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={reset} size="sm">
            <RotateCw className="h-4 w-4" /> Reintentar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
