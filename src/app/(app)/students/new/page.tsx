import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentForm } from "../student-form";

export default function NewStudentPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/students"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Volver a estudiantes
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Nuevo estudiante</CardTitle>
          <CardDescription>
            Crea un perfil para empezar a registrar mediciones, sesiones y observaciones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudentForm />
        </CardContent>
      </Card>
    </div>
  );
}
