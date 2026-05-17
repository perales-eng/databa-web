import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireOrganization } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BehaviorMethodForm } from "@/components/behaviors/behavior-method-form";

export default async function NewBehaviorMethodPage({ params }: { params: Promise<{ id: string }> }) {
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
          <CardTitle>Nuevo método de medición</CardTitle>
          <CardDescription>{student.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <BehaviorMethodForm studentId={student.id} />
        </CardContent>
      </Card>
    </div>
  );
}
