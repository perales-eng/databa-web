import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireOrganization } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentForm } from "../../student-form";

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { organization } = await requireOrganization();
  const { id } = await params;
  const student = await db.student.findFirst({
    where: { id, organizationId: organization.id, deletedAt: null },
  });
  if (!student) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/students/${student.id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Volver al perfil
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Editar estudiante</CardTitle>
          <CardDescription>Actualizá los datos del perfil.</CardDescription>
        </CardHeader>
        <CardContent>
          <StudentForm
            initial={{
              id: student.id,
              name: student.name,
              color: student.color,
              birthDate: student.birthDate,
              notes: student.notes,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
