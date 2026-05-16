import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireOrganization } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SessionForm } from "@/components/sessions/session-form";

export default async function EditSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { organization } = await requireOrganization();
  const { id } = await params;
  const session = await db.therapySession.findFirst({
    where: { id, organizationId: organization.id, deletedAt: null },
    include: { student: { select: { name: true } } },
  });
  if (!session) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/sessions/${session.id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Volver a la sesión
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Editar sesión</CardTitle>
          <CardDescription>{session.student.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <SessionForm
            studentId={session.studentId}
            initial={{
              id: session.id,
              title: session.title,
              description: session.description,
              sessionDate: session.sessionDate,
              durationMin: session.durationMin,
              sessionType: session.sessionType,
              status: session.status,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
