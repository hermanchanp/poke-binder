"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SharedBinderView({ binder }: { binder: any }) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  const totalSlots = binder.rows * binder.cols;
  const leftPage = currentPage;
  const rightPage = currentPage + 1;
  const leftPageCards = binder.cards.filter((c: any) => c.pageNumber === leftPage);
  const rightPageCards = binder.cards.filter((c: any) => c.pageNumber === rightPage);

  return (
    <div className="min-h-screen p-6">
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/")} className="text-gray-400 hover:text-white bg-transparent border-none text-base cursor-pointer">
            ← Home
          </button>
          <h1 className="text-2xl font-bold font-archivo">{binder.name}</h1>
        </div>
        <div className="flex items-center gap-3 text-gray-400">
          <span className="text-sm">Created by {binder.user?.name || 'Anonymous'}</span>
          {binder.user?.image && (
            <img src={binder.user.image} alt="" className="w-9 h-9 rounded-full" />
          )}
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
                const card = leftPageCards.find((c: any) => c.slotIndex === index);
                const isOwned = card?.status === "owned";
                const isWish = card?.status === "wish";
                return (
                  <div
                    key={index}
                    className={`aspect-[5/7] bg-[#16213e] rounded-lg border-2 flex items-center justify-center relative overflow-hidden transition-transform duration-200 hover:scale-[1.02]
                      ${!card ? 'border-gray-800 border-dashed' : ''}
                      ${isOwned ? 'border-green-400 border-solid' : ''}
                      ${isWish ? 'border-amber-500 border-dashed' : ''}
                    `}
                  >
                    {card ? (
                      <div className="w-full h-full relative">
                        <img
                          src={card.cardImageUrl || ""}
                          alt={card.cardName || ""}
                          className={`w-full h-full object-cover rounded-md pointer-events-none ${isWish ? 'opacity-50' : 'opacity-100'}`}
                        />
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
                  const card = rightPageCards.find((c: any) => c.slotIndex === index);
                  const isOwned = card?.status === "owned";
                  const isWish = card?.status === "wish";
                  return (
                    <div
                      key={index}
                      className={`aspect-[5/7] bg-[#16213e] rounded-lg border-2 flex items-center justify-center relative overflow-hidden transition-transform duration-200 hover:scale-[1.02]
                        ${!card ? 'border-gray-800 border-dashed' : ''}
                        ${isOwned ? 'border-green-400 border-solid' : ''}
                        ${isWish ? 'border-amber-500 border-dashed' : ''}
                      `}
                    >
                      {card ? (
                        <div className="w-full h-full relative">
                          <img
                            src={card.cardImageUrl || ""}
                            alt={card.cardName || ""}
                            className={`w-full h-full object-cover rounded-md pointer-events-none ${isWish ? 'opacity-50' : 'opacity-100'}`}
                          />
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
    </div>
  );
}
