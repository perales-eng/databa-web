import { NextResponse } from "next/server";
import { acceptInvitation } from "@/server/organizations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 400 }
      );
    }

    const result = await acceptInvitation(token);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ organizationId: result.organizationId });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Error al aceptar invitación" },
      { status: 500 }
    );
  }
}
