import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; slotId: string }> }
) {
  const { id, slotId } = await params;
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

  const body = await request.json();
  const { pageNumber, slotIndex, pokemonId, cardName, cardImageUrl, status } = body;

  const card = await prisma.cardSlot.upsert({
    where: {
      binderId_pageNumber_slotIndex: {
        binderId: id,
        pageNumber,
        slotIndex,
      },
    },
    update: {
      pokemonId,
      cardName,
      cardImageUrl,
      status,
    },
    create: {
      binderId: id,
      pageNumber,
      slotIndex,
      pokemonId,
      cardName,
      cardImageUrl,
      status,
    },
  });

  return NextResponse.json(card);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; slotId: string }> }
) {
  const { id, slotId } = await params;
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

  await prisma.cardSlot.delete({
    where: { id: slotId },
  });

  return NextResponse.json({ success: true });
}
