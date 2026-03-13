import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const binders = await prisma.binder.findMany({
    where: { userId: session.user.id },
    include: { cards: true },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(binders);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, rows = 4, cols = 4, pages = 10, template } = body;

  let binderRows = rows;
  let binderCols = cols;
  let binderPages = pages;

  if (template === "base1") {
    binderRows = 4;
    binderCols = 4;
    binderPages = 10;
  }

  const binder = await prisma.binder.create({
    data: {
      userId: session.user.id,
      name,
      rows: binderRows,
      cols: binderCols,
      pages: binderPages,
    },
  });

  if (template && template !== "") {
    try {
      const response = await fetch(`https://api.tcgdex.net/v2/en/cards?set=${template}`);
      if (response.ok) {
        const cards = await response.json();

        // Per-template max localId (to exclude trainers/energies/secret rares)
        const maxLocalId: Record<string, number> = {
          "sv03.5": 151,
          "base1": 102,
        };
        const templateMax = maxLocalId[template] ?? Infinity;

        // Keep only numbered cards up to templateMax, sorted by localId
        const numberedCards = (cards as any[])
          .filter((card) => {
            const id = parseInt(card.localId);
            return !isNaN(id) && id >= 1 && id <= templateMax;
          })
          .sort((a, b) => parseInt(a.localId) - parseInt(b.localId));

        const slotsPerPage = binderRows * binderCols;
        const requiredPages = Math.ceil(numberedCards.length / slotsPerPage);

        // Ensure binder has enough pages
        if (requiredPages > binderPages) {
          await prisma.binder.update({
            where: { id: binder.id },
            data: { pages: requiredPages },
          });
        }

        // Place each card at its localId position so card #1 → slot 0 page 1, #17 → slot 0 page 2, etc.
        const cardSlots = numberedCards.map((card) => {
          const idx = parseInt(card.localId) - 1;
          return {
            binderId: binder.id,
            pageNumber: Math.floor(idx / slotsPerPage) + 1,
            slotIndex: idx % slotsPerPage,
            pokemonId: card.id,
            cardName: card.name,
            cardImageUrl: card.image ? `${card.image}/high.webp` : null,
            status: "wish",
          };
        });

        if (cardSlots.length > 0) {
          await prisma.cardSlot.createMany({ data: cardSlots });
        }
      }
    } catch (error) {
      console.error("Failed to fetch template cards:", error);
    }
  }

  return NextResponse.json(binder);
}
