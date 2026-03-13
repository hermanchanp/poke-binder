import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
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

  const { sourcePage, sourceIndex, targetPage, targetIndex } = await request.json();

  try {
    const sourceCard = await prisma.cardSlot.findUnique({
      where: {
        binderId_pageNumber_slotIndex: {
          binderId: id,
          pageNumber: sourcePage,
          slotIndex: sourceIndex,
        },
      },
    });

    const targetCard = await prisma.cardSlot.findUnique({
      where: {
        binderId_pageNumber_slotIndex: {
          binderId: id,
          pageNumber: targetPage,
          slotIndex: targetIndex,
        },
      },
    });

    // Run as transaction
    await prisma.$transaction(async (tx) => {
      // Temporarily move target out of the way if it exists
      if (targetCard) {
        await tx.cardSlot.update({
          where: { id: targetCard.id },
          data: { pageNumber: -1, slotIndex: -1 }, // temporary dummy location
        });
      }

      if (sourceCard) {
        await tx.cardSlot.update({
          where: { id: sourceCard.id },
          data: { pageNumber: targetPage, slotIndex: targetIndex },
        });
      }

      if (targetCard) {
        await tx.cardSlot.update({
          where: { id: targetCard.id },
          data: { pageNumber: sourcePage, slotIndex: sourceIndex },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Move error:", error);
    return NextResponse.json({ error: "Failed to move card" }, { status: 500 });
  }
}
