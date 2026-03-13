"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";

interface CardSlot {
  id: string;
  pageNumber: number;
  slotIndex: number;
  pokemonId: string | null;
  cardName: string | null;
  cardImageUrl: string | null;
  status: string;
}

interface Binder {
  id: string;
  name: string;
  rows: number;
  cols: number;
  pages: number;
  cards: CardSlot[];
}

interface SearchResult {
  id: string;
  name: string;
  imageUrl: string;
  set: string;
  setId?: string;
}

export default function BinderPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [binder, setBinder] = useState<Binder | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ page: number; index: number } | null>(null);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [setFilter, setSetFilter] = useState("");
  const [localIdFilter, setLocalIdFilter] = useState("");
  const [rarityFilter, setRarityFilter] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotal, setSearchTotal] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  const [cardStatus, setCardStatus] = useState("owned");
  const [showSettings, setShowSettings] = useState(false);
  const [editingCard, setEditingCard] = useState<CardSlot | null>(null);
  
  const [draggedSlot, setDraggedSlot] = useState<{ page: number; index: number } | null>(null);

  const rarities = [
    { label: "Common", value: "common" },
    { label: "Uncommon", value: "uncommon" },
    { label: "Rare", value: "rare" },
    { label: "Holo Rare", value: "holo" },
    { label: "Ultra Rare", value: "ultra" },
    { label: "Illustration Rare", value: "illustration" },
    { label: "Special Illustration Rare", value: "special illustration" },
    { label: "Secret Rare", value: "secret" },
    { label: "Shiny Rare", value: "shiny" },
    { label: "Radiant Rare", value: "radiant" },
    { label: "Amazing Rare", value: "amazing" },
  ];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated" && params.id) {
      fetchBinder();
    }
  }, [status, params.id]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const fetchBinder = async () => {
    const id = params.id;
    if (!id) return;
    const res = await fetch(`/api/binders/${id}`);
    if (res.ok) {
      const data = await res.json();
      setBinder(data);
    } else {
      router.push("/dashboard");
    }
  };

  const handleSlotClick = (page: number, index: number) => {
    const existingCard = binder?.cards.find(
      (c) => c.pageNumber === page && c.slotIndex === index
    );
    setSelectedSlot({ page, index });
    setEditingCard(existingCard || null);
    setCardStatus(existingCard?.status || "owned");
    setSearchQuery("");
    setSearchResults([]);
    setSearchPage(1);
    setSearchTotal(0);
    setShowModal(true);
  };

  const toggleCardStatus = async () => {
    if (!editingCard || !binder) return;
    const newStatus = editingCard.status === "owned" ? "wish" : "owned";
    await fetch(`/api/binders/${binder.id}/cards/${editingCard.pageNumber}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageNumber: editingCard.pageNumber,
        slotIndex: editingCard.slotIndex,
        pokemonId: editingCard.pokemonId,
        cardName: editingCard.cardName,
        cardImageUrl: editingCard.cardImageUrl,
        status: newStatus,
      }),
    });
    setEditingCard({ ...editingCard, status: newStatus });
    setCardStatus(newStatus);
    fetchBinder();
  };

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const searchCards = async (query: string, page = 1) => {
    setSearchQuery(query);
    setSearchPage(page);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (query.length < 1) {
      setSearchResults([]);
      setSearchTotal(0);
      return;
    }
    
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      let url = `/api/cards/search?q=${encodeURIComponent(query)}&page=${page}&limit=20`;
      if (setFilter) {
        url += `&set=${encodeURIComponent(setFilter)}`;
      }
      if (localIdFilter) {
        url += `&localId=${encodeURIComponent(localIdFilter)}`;
      }
      if (rarityFilter) {
        url += `&rarity=${encodeURIComponent(rarityFilter)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.cards) {
        setSearchResults(data.cards);
        setSearchTotal(data.total);
      } else {
        setSearchResults([]);
        setSearchTotal(0);
      }
      setIsSearching(false);
    }, 300);
  };

  const handleFilterChange = () => {
    if (searchQuery) {
      searchCards(searchQuery, 1);
    }
  };

  const addCard = async (card: SearchResult) => {
    if (!selectedSlot || !binder) return;
    await fetch(`/api/binders/${binder.id}/cards/${selectedSlot.page}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageNumber: selectedSlot.page,
        slotIndex: selectedSlot.index,
        pokemonId: card.id,
        cardName: card.name,
        cardImageUrl: card.imageUrl,
        status: cardStatus,
      }),
    });
    setShowModal(false);
    setSearchQuery("");
    setSearchResults([]);
    fetchBinder();
  };

  const removeCard = async (slotId: string) => {
    if (!binder) return;
    await fetch(`/api/binders/${binder.id}/cards/${slotId}`, {
      method: "DELETE",
    });
    fetchBinder();
  };

  const updateBinderSettings = async (newSettings: Partial<Binder>) => {
    if (!binder) return;
    await fetch(`/api/binders/${binder.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...binder, ...newSettings }),
    });
    fetchBinder();
    setShowSettings(false);
  };

  const deleteBinder = async () => {
    if (!binder || !confirm("Delete this binder?")) return;
    await fetch(`/api/binders/${binder.id}`, { method: "DELETE" });
    router.push("/dashboard");
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, page: number, index: number) => {
    setDraggedSlot({ page, index });
    e.dataTransfer.effectAllowed = "move";
    // Make drag image transparent or keep default
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetPage: number, targetIndex: number) => {
    e.preventDefault();
    if (!draggedSlot || !binder) return;
    if (draggedSlot.page === targetPage && draggedSlot.index === targetIndex) return;

    // Optimistic Update
    const sourceCardIndex = binder.cards.findIndex(c => c.pageNumber === draggedSlot.page && c.slotIndex === draggedSlot.index);
    const targetCardIndex = binder.cards.findIndex(c => c.pageNumber === targetPage && c.slotIndex === targetIndex);
    
    const newCards = [...binder.cards];
    if (sourceCardIndex > -1) {
      const sourceCard = { ...newCards[sourceCardIndex] };
      let targetCard = null;
      if (targetCardIndex > -1) {
        targetCard = { ...newCards[targetCardIndex] };
        targetCard.pageNumber = draggedSlot.page;
        targetCard.slotIndex = draggedSlot.index;
        newCards[targetCardIndex] = targetCard;
      }
      sourceCard.pageNumber = targetPage;
      sourceCard.slotIndex = targetIndex;
      newCards[sourceCardIndex] = sourceCard;
      setBinder({ ...binder, cards: newCards });
    }

    await fetch(`/api/binders/${binder.id}/cards/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourcePage: draggedSlot.page,
        sourceIndex: draggedSlot.index,
        targetPage,
        targetIndex,
      }),
    });
    
    setDraggedSlot(null);
    fetchBinder();
  };

  if (status === "loading" || !binder) {
    return <div className="min-h-screen p-6 text-gray-400">Loading...</div>;
  }

  if (status === "unauthenticated") {
    return null;
  }

  const totalSlots = binder.rows * binder.cols;
  const leftPage = currentPage;
  const rightPage = currentPage + 1;
  const leftPageCards = binder.cards.filter((c) => c.pageNumber === leftPage);
  const rightPageCards = binder.cards.filter((c) => c.pageNumber === rightPage);

  return (
    <div className="min-h-screen p-6">
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard")} className="text-gray-400 hover:text-white bg-transparent border-none text-base cursor-pointer">
            ← Back
          </button>
          <h1 className="text-2xl font-bold font-archivo">{binder.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              const url = `${window.location.origin}/share/${binder.id}`;
              navigator.clipboard.writeText(url);
              alert("Share link copied to clipboard!");
            }} 
            className="bg-transparent border border-gray-700 text-gray-400 hover:text-white px-4 py-2 rounded-lg cursor-pointer"
          >
            🔗 Share
          </button>
          <button onClick={() => setShowSettings(true)} className="bg-transparent border border-gray-700 text-gray-400 hover:text-white px-4 py-2 rounded-lg cursor-pointer">
            ⚙ Settings
          </button>
          {session?.user?.image && (
            <img src={session.user.image} alt="" className="w-9 h-9 rounded-full" />
          )}
          <button onClick={() => signOut()} className="bg-transparent border border-gray-700 text-gray-400 hover:text-white px-4 py-2 rounded-lg cursor-pointer">
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto w-full">
        <div className="flex justify-center items-center gap-6 mb-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 2))}
            disabled={currentPage === 1}
            className="bg-[#0f0f23] border border-gray-700 text-gray-200 px-5 py-2.5 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          <span className="text-lg font-semibold">
            Pages {leftPage}-{rightPage > binder.pages ? binder.pages : rightPage} of {binder.pages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(binder.pages, p + 2))}
            disabled={rightPage >= binder.pages}
            className="bg-[#0f0f23] border border-gray-700 text-gray-200 px-5 py-2.5 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>

        {/* mobile stack flex-col, tablet/desktop side-by-side md:flex-row */}
        <div className="flex flex-col md:flex-row gap-6 justify-center">
          <div className="w-full md:w-[calc(50%-12px)] max-w-[600px] flex-none">
            <div className="text-center mb-3 font-semibold text-gray-400">Page {leftPage}</div>
            <div
              className="grid gap-3 bg-[#0f0f23] p-6 rounded-xl border border-gray-800"
              style={{ gridTemplateColumns: `repeat(${binder.cols}, 1fr)` }}
            >
              {Array.from({ length: totalSlots }).map((_, index) => {
                const card = leftPageCards.find((c) => c.slotIndex === index);
                const isOwned = card?.status === "owned";
                const isWish = card?.status === "wish";
                return (
                  <div
                    key={index}
                    draggable={!!card}
                    onDragStart={(e) => handleDragStart(e, leftPage, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, leftPage, index)}
                    className={`aspect-[5/7] bg-[#16213e] rounded-lg border-2 flex items-center justify-center cursor-pointer relative overflow-hidden transition-transform duration-200 hover:scale-[1.02]
                      ${!card ? 'border-gray-800 border-dashed' : ''}
                      ${isOwned ? 'border-green-400 border-solid' : ''}
                      ${isWish ? 'border-amber-500 border-dashed' : ''}
                    `}
                    onClick={() => handleSlotClick(leftPage, index)}
                  >
                    {card ? (
                      <div className="w-full h-full relative">
                        <img
                          src={card.cardImageUrl || ""}
                          alt={card.cardName || ""}
                          className={`w-full h-full object-cover rounded-md pointer-events-none ${isWish ? 'opacity-50' : 'opacity-100'}`}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCard(card.id);
                          }}
                          className="absolute top-1 right-1 bg-black/70 border-none text-white w-6 h-6 rounded-full cursor-pointer text-lg leading-none flex items-center justify-center hover:bg-red-600/80 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <span className="text-3xl text-gray-500 opacity-50 pointer-events-none">+</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {rightPage <= binder.pages && (
            <div className="w-full md:w-[calc(50%-12px)] max-w-[600px] flex-none">
              <div className="text-center mb-3 font-semibold text-gray-400">Page {rightPage}</div>
              <div
                className="grid gap-3 bg-[#0f0f23] p-6 rounded-xl border border-gray-800"
                style={{ gridTemplateColumns: `repeat(${binder.cols}, 1fr)` }}
              >
                {Array.from({ length: totalSlots }).map((_, index) => {
                  const card = rightPageCards.find((c) => c.slotIndex === index);
                  const isOwned = card?.status === "owned";
                  const isWish = card?.status === "wish";
                  return (
                    <div
                      key={index}
                      draggable={!!card}
                      onDragStart={(e) => handleDragStart(e, rightPage, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, rightPage, index)}
                      className={`aspect-[5/7] bg-[#16213e] rounded-lg border-2 flex items-center justify-center cursor-pointer relative overflow-hidden transition-transform duration-200 hover:scale-[1.02]
                        ${!card ? 'border-gray-800 border-dashed' : ''}
                        ${isOwned ? 'border-green-400 border-solid' : ''}
                        ${isWish ? 'border-amber-500 border-dashed' : ''}
                      `}
                      onClick={() => handleSlotClick(rightPage, index)}
                    >
                      {card ? (
                        <div className="w-full h-full relative">
                          <img
                            src={card.cardImageUrl || ""}
                            alt={card.cardName || ""}
                            className={`w-full h-full object-cover rounded-md pointer-events-none ${isWish ? 'opacity-50' : 'opacity-100'}`}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCard(card.id);
                            }}
                            className="absolute top-1 right-1 bg-black/70 border-none text-white w-6 h-6 rounded-full cursor-pointer text-lg leading-none flex items-center justify-center hover:bg-red-600/80 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <span className="text-3xl text-gray-500 opacity-50 pointer-events-none">+</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => { setShowModal(false); setEditingCard(null); }}>
          <div className="bg-[#16213e] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-gray-800">
              <h3 className="text-xl font-bold font-archivo">{editingCard ? "Edit Slot" : "Add Card"}</h3>
              <button 
                onClick={() => { setShowModal(false); setEditingCard(null); }}
                className="text-gray-400 hover:text-white text-2xl leading-none bg-transparent border-none cursor-pointer p-2"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {editingCard && (
                <div className="flex items-center gap-5 mb-6 border-b border-gray-700 pb-6">
                  <img 
                    src={editingCard.cardImageUrl || ""} 
                    alt={editingCard.cardName || ""} 
                    className="w-24 sm:w-32 h-auto rounded shadow-lg" 
                  />
                  <div className="flex-1">
                    <h4 className="mb-4 text-lg font-bold font-archivo">{editingCard.cardName}</h4>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={toggleCardStatus}
                        className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-colors ${editingCard.status === "owned" ? "bg-green-500 hover:bg-green-600 text-white" : "bg-amber-500 hover:bg-amber-600 text-white"}`}
                      >
                        {editingCard.status === "owned" ? "I Have ✓" : "I Wish ✗"}
                      </button>
                      <button 
                        onClick={() => {
                          removeCard(editingCard.id);
                          setShowModal(false);
                          setEditingCard(null);
                        }} 
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-lg font-semibold transition-colors"
                      >
                        Remove Card
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <h4 className="text-lg font-bold font-archivo mb-4">{editingCard ? "Search Replacement" : "Search Card"}</h4>
              <input
                type="text"
                placeholder="Search Pokemon..."
                value={searchQuery}
                onChange={(e) => searchCards(e.target.value, 1)}
                className="w-full p-3 mb-4 bg-[#0f0f23] border border-gray-700 rounded-lg text-gray-200 text-base focus:border-[#e94560] focus:outline-none"
                autoFocus={!editingCard}
              />
              <div className="flex flex-wrap sm:flex-nowrap gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Set (e.g. swsh)..."
                  value={setFilter}
                  onChange={(e) => { setSetFilter(e.target.value); handleFilterChange(); }}
                  className="flex-1 min-w-[120px] p-3 bg-[#0f0f23] border border-gray-700 rounded-lg text-gray-200 text-sm focus:border-[#e94560] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Card #..."
                  value={localIdFilter}
                  onChange={(e) => { setLocalIdFilter(e.target.value); handleFilterChange(); }}
                  className="w-24 p-3 bg-[#0f0f23] border border-gray-700 rounded-lg text-gray-200 text-sm focus:border-[#e94560] focus:outline-none"
                />
                <select
                  value={rarityFilter}
                  onChange={(e) => { setRarityFilter(e.target.value); handleFilterChange(); }}
                  className="w-full sm:w-40 p-3 bg-[#0f0f23] border border-gray-700 rounded-lg text-gray-200 text-sm focus:border-[#e94560] focus:outline-none"
                >
                  <option value="">Any Rarity</option>
                  {rarities.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setCardStatus("owned")}
                  className={`flex-1 p-2.5 rounded-lg border font-semibold transition-colors ${cardStatus === "owned" ? "bg-green-500 border-green-500 text-white" : "bg-transparent border-gray-600 text-gray-300 hover:border-green-500"}`}
                >
                  I Have
                </button>
                <button
                  onClick={() => setCardStatus("wish")}
                  className={`flex-1 p-2.5 rounded-lg border font-semibold transition-colors ${cardStatus === "wish" ? "bg-amber-500 border-amber-500 text-white" : "bg-transparent border-gray-600 text-gray-300 hover:border-amber-500"}`}
                >
                  I Wish
                </button>
              </div>
              
              {isSearching ? (
                <div className="text-center py-8 text-gray-400">Searching...</div>
              ) : (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[40vh] overflow-y-auto mb-4 pr-1 scrollbar-thin">
                    {searchResults.length === 0 && searchQuery ? (
                      <p className="text-center text-gray-400 py-8 col-span-full">No cards found.</p>
                    ) : (
                      searchResults.map((card) => (
                        <div
                          key={card.id}
                          className="flex flex-col gap-1 cursor-pointer group"
                          onClick={() => addCard(card)}
                        >
                          <img 
                            src={card.imageUrl} 
                            alt={card.name} 
                            className="w-full aspect-[5/7] object-contain rounded-lg border-2 border-transparent group-hover:border-[#e94560] group-hover:scale-105 transition-all bg-[#0f0f23]" 
                          />
                          <p className="text-xs text-center text-gray-400 truncate mt-1" title={`${card.name} - ${card.setId} #${card.set}`}>
                            {card.setId} #{card.set}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {searchTotal > 20 && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                      <span className="text-sm text-gray-400">{searchTotal} results found</span>
                      <div className="flex gap-2">
                        <button 
                          disabled={searchPage === 1}
                          onClick={() => searchCards(searchQuery, searchPage - 1)}
                          className="px-4 py-2 bg-[#0f0f23] border border-gray-600 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-[#1a1a2e] cursor-pointer"
                        >
                          Prev
                        </button>
                        <span className="text-sm py-2 px-3 bg-[#1a1a2e] rounded-lg">Page {searchPage}</span>
                        <button 
                          disabled={searchPage * 20 >= searchTotal}
                          onClick={() => searchCards(searchQuery, searchPage + 1)}
                          className="px-4 py-2 bg-[#0f0f23] border border-gray-600 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-[#1a1a2e] cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowSettings(false)}>
          <div className="bg-[#16213e] p-6 rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold font-archivo mb-5">Binder Settings</h3>
            <label className="block mb-4 text-sm text-gray-300">
              Name:
              <input
                type="text"
                value={binder.name}
                onChange={(e) => setBinder({ ...binder, name: e.target.value })}
                className="w-full mt-1.5 p-2.5 bg-[#0f0f23] border border-gray-700 rounded-lg text-white text-sm focus:border-[#e94560] focus:outline-none"
              />
            </label>
            <div className="flex gap-4 mb-6">
              <label className="block text-sm text-gray-300 flex-1">
                Rows:
                <input
                  type="number"
                  value={binder.rows}
                  onChange={(e) => setBinder({ ...binder, rows: parseInt(e.target.value) || 4 })}
                  className="w-full mt-1.5 p-2 bg-[#0f0f23] border border-gray-700 rounded-lg text-white text-sm focus:border-[#e94560] focus:outline-none"
                />
              </label>
              <label className="block text-sm text-gray-300 flex-1">
                Cols:
                <input
                  type="number"
                  value={binder.cols}
                  onChange={(e) => setBinder({ ...binder, cols: parseInt(e.target.value) || 4 })}
                  className="w-full mt-1.5 p-2 bg-[#0f0f23] border border-gray-700 rounded-lg text-white text-sm focus:border-[#e94560] focus:outline-none"
                />
              </label>
              <label className="block text-sm text-gray-300 flex-1">
                Pages:
                <input
                  type="number"
                  value={binder.pages}
                  onChange={(e) => setBinder({ ...binder, pages: parseInt(e.target.value) || 10 })}
                  className="w-full mt-1.5 p-2 bg-[#0f0f23] border border-gray-700 rounded-lg text-white text-sm focus:border-[#e94560] focus:outline-none"
                />
              </label>
            </div>
            <div className="flex justify-between gap-3">
              <button onClick={deleteBinder} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors">
                Delete Binder
              </button>
              <button
                onClick={() => updateBinderSettings(binder)}
                className="bg-[#e94560] hover:bg-[#ff6b6b] text-white px-6 py-2.5 rounded-lg font-semibold transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
