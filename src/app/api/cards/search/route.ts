import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const set = searchParams.get("set");
  const localId = searchParams.get("localId");
  const rarity = searchParams.get("rarity");

  if (!query || query.length < 1) {
    return NextResponse.json([]);
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
      return NextResponse.json([]);
    }

    const cards = await response.json();

    const simplifiedCards = cards.slice(0, 20).map((card: any) => ({
      id: card.id,
      name: card.name,
      imageUrl: card.image ? `${card.image}/high.webp` : null,
      set: card.localId,
      setId: card.set?.id,
    }));

    return NextResponse.json(simplifiedCards);
  } catch (error) {
    return NextResponse.json([]);
  }
}
