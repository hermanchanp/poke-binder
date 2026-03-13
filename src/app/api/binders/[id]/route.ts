import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const binder = await prisma.binder.findFirst({
    where: { id, userId: session.user.id },
    include: { cards: true },
  });

  if (!binder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(binder);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, rows, cols, pages } = body;

  const binder = await prisma.binder.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!binder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.binder.update({
    where: { id },
    data: { name, rows, cols, pages },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const binder = await prisma.binder.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!binder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.binder.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
