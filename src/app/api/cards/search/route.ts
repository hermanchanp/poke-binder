import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const set = searchParams.get("set");
  const localId = searchParams.get("localId");
  const rarity = searchParams.get("rarity");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  if (!query || query.length < 1) {
    return NextResponse.json({ cards: [], total: 0 });
  }

  let url = `https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(query)}`;
  if (set) {
    url += `&set=${encodeURIComponent(set)}`;
  }
  if (localId) {
    url += `&localId=${encodeURIComponent(localId)}`;
  }
  if (rarity) {
    url += `&rarity=${encodeURIComponent(rarity)}`;
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json({ cards: [], total: 0 });
    }

    const allCards = await response.json();
    const total = allCards.length;
    
    const startIndex = (page - 1) * limit;
    const paginatedCards = allCards.slice(startIndex, startIndex + limit);

    const simplifiedCards = paginatedCards.map((card: any) => ({
      id: card.id,
      name: card.name,
      imageUrl: card.image ? `${card.image}/high.webp` : null,
      set: card.localId,
      setId: card.set?.id,
    }));

    return NextResponse.json({ cards: simplifiedCards, total });
  } catch (error) {
    return NextResponse.json({ cards: [], total: 0 });
  }
}
