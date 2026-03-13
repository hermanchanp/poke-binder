"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Binder {
  id: string;
  name: string;
  rows: number;
  cols: number;
  pages: number;
  cards: { id: string }[];
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [binders, setBinders] = useState<Binder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [newBinder, setNewBinder] = useState({ name: "", rows: 4, cols: 4, pages: 10 });

  const templates = [
    { id: "", name: "Empty Binder" },
    { id: "base1", name: "151 Original (Base Set)" },
    { id: "sv03.5", name: "151 (Scarlet & Violet)" },
    { id: "sv01", name: "Scarlet & Violet Base Set" },
    { id: "swsh1", name: "Sword & Shield Base Set" },
    { id: "swsh7", name: "Evolving Skies" },
    { id: "swsh12.5", name: "Crown Zenith" },
  ];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (session) {
      fetchBinders();
    }
  }, [session, status, router]);

  const fetchBinders = async () => {
    setLoading(true);
    const res = await fetch("/api/binders");
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    if (Array.isArray(data)) {
      setBinders(data);
    }
    setLoading(false);
  };

  const createBinder = async () => {
    if (!newBinder.name.trim()) return;
    await fetch("/api/binders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newBinder, template: selectedTemplate }),
    });
    setShowModal(false);
    setNewBinder({ name: "", rows: 4, cols: 4, pages: 10 });
    setSelectedTemplate("");
    fetchBinders();
  };

  const closeModal = () => {
    setShowModal(false);
    setNewBinder({ name: "", rows: 4, cols: 4, pages: 10 });
    setSelectedTemplate("");
  };

  if (status === "loading") {
    return <div className="min-h-screen p-6 text-gray-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-archivo bg-gradient-to-br from-[#e94560] to-[#ff6b6b] bg-clip-text text-transparent">
          PokeBinder
        </h1>
        <div className="flex items-center gap-4">
          {session?.user?.image && (
            <img src={session.user.image} alt="" className="w-10 h-10 rounded-full" />
          )}
          <button 
            onClick={() => signOut()} 
            className="bg-transparent border border-gray-700 text-gray-400 px-4 py-2 rounded-lg hover:text-white transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-archivo">My Binders</h2>
          <button 
            onClick={() => setShowModal(true)} 
            className="bg-[#e94560] hover:bg-[#ff6b6b] text-white border-none px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            + New Binder
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {loading ? (
            <p className="text-gray-400">Loading binders...</p>
          ) : binders.length === 0 ? (
            <p className="text-gray-400 col-span-full">No binders yet. Create one to get started!</p>
          ) : (
            binders.map((binder) => (
              <div
                key={binder.id}
                className="bg-[#0f0f23] p-6 rounded-2xl border border-gray-800 cursor-pointer hover:-translate-y-1 hover:border-[#e94560] transition-all"
                onClick={() => router.push(`/binder/${binder.id}`)}
              >
                <h3 className="text-xl font-bold font-archivo mb-2 text-gray-100">{binder.name}</h3>
                <p className="text-gray-400">{binder.rows}x{binder.cols} - {binder.pages} pages</p>
                <p className="text-gray-500 text-sm mt-3">{binder.cards.length} cards</p>
              </div>
            ))
          )}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-[#16213e] p-8 rounded-2xl w-full max-w-[400px]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold font-archivo mb-5">Create New Binder</h3>
            
            <input
              type="text"
              placeholder="Binder name"
              value={newBinder.name}
              onChange={(e) => setNewBinder({ ...newBinder, name: e.target.value })}
              className="w-full p-3 mb-4 bg-[#0f0f23] border border-gray-700 rounded-lg text-white text-base focus:border-[#e94560] focus:outline-none"
              autoFocus
            />
            
            <label className="block mb-4 text-sm text-gray-400">
              Template:
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full mt-2 p-3 bg-[#0f0f23] border border-gray-700 rounded-lg text-white text-base focus:border-[#e94560] focus:outline-none"
              >
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>
            
            <div className="flex gap-4 mb-6">
              <label className="block text-sm text-gray-400 flex-1">
                Rows:
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newBinder.rows}
                  onChange={(e) => setNewBinder({ ...newBinder, rows: parseInt(e.target.value) || 4 })}
                  className="w-full mt-2 p-2 bg-[#0f0f23] border border-gray-700 rounded-lg text-white text-sm focus:border-[#e94560] focus:outline-none"
                />
              </label>
              <label className="block text-sm text-gray-400 flex-1">
                Cols:
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newBinder.cols}
                  onChange={(e) => setNewBinder({ ...newBinder, cols: parseInt(e.target.value) || 4 })}
                  className="w-full mt-2 p-2 bg-[#0f0f23] border border-gray-700 rounded-lg text-white text-sm focus:border-[#e94560] focus:outline-none"
                />
              </label>
              <label className="block text-sm text-gray-400 flex-1">
                Pages:
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newBinder.pages}
                  onChange={(e) => setNewBinder({ ...newBinder, pages: parseInt(e.target.value) || 10 })}
                  className="w-full mt-2 p-2 bg-[#0f0f23] border border-gray-700 rounded-lg text-white text-sm focus:border-[#e94560] focus:outline-none"
                />
              </label>
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={closeModal} 
                className="bg-transparent border border-gray-700 text-gray-400 px-5 py-2.5 rounded-lg hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={createBinder} 
                className="bg-[#e94560] hover:bg-[#ff6b6b] text-white border-none px-5 py-2.5 rounded-lg font-semibold transition-colors cursor-pointer"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
