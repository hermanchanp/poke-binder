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
    return <div style={styles.container}><p>Loading...</p></div>;
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.logo}>PokeBinder</h1>
        <div style={styles.userArea}>
          {session?.user?.image && (
            <img src={session.user.image} alt="" style={styles.avatar} />
          )}
          <button onClick={() => signOut()} style={styles.signOutBtn}>
            Sign Out
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.actions}>
          <h2>My Binders</h2>
          <button onClick={() => setShowModal(true)} style={styles.createBtn}>
            + New Binder
          </button>
        </div>

        <div style={styles.grid}>
          {loading ? (
            <p>Loading binders...</p>
          ) : binders.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No binders yet. Create one to get started!</p>
          ) : (
          binders.map((binder) => (
            <div
              key={binder.id}
              style={styles.binderCard}
              onClick={() => router.push(`/binder/${binder.id}`)}
            >
              <h3>{binder.name}</h3>
              <p>{binder.rows}x{binder.cols} - {binder.pages} pages</p>
              <p style={styles.cardCount}>{binder.cards.length} cards</p>
            </div>
          ))
          )}
        </div>
      </main>

      {showModal && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Create New Binder</h3>
            <input
              type="text"
              placeholder="Binder name"
              value={newBinder.name}
              onChange={(e) => setNewBinder({ ...newBinder, name: e.target.value })}
              style={styles.input}
            />
            <label style={styles.label}>
              Template:
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                style={styles.input}
              >
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>
            <div style={styles.row}>
              <label>
                Rows:
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newBinder.rows}
                  onChange={(e) => setNewBinder({ ...newBinder, rows: parseInt(e.target.value) || 4 })}
                  style={styles.smallInput}
                />
              </label>
              <label>
                Cols:
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newBinder.cols}
                  onChange={(e) => setNewBinder({ ...newBinder, cols: parseInt(e.target.value) || 4 })}
                  style={styles.smallInput}
                />
              </label>
              <label>
                Pages:
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newBinder.pages}
                  onChange={(e) => setNewBinder({ ...newBinder, pages: parseInt(e.target.value) || 10 })}
                  style={styles.smallInput}
                />
              </label>
            </div>
            <div style={styles.modalActions}>
              <button onClick={closeModal} style={styles.cancelBtn}>
                Cancel
              </button>
              <button onClick={createBinder} style={styles.saveBtn}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    padding: "24px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
  },
  logo: {
    fontSize: "28px",
    background: "linear-gradient(135deg, #e94560, #ff6b6b)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  userArea: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
  },
  signOutBtn: {
    background: "transparent",
    border: "1px solid var(--border)",
    color: "var(--text-secondary)",
    padding: "8px 16px",
    borderRadius: "var(--radius)",
  },
  main: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  createBtn: {
    background: "var(--accent)",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "var(--radius)",
    fontWeight: 600,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "20px",
  },
  binderCard: {
    background: "var(--bg-card)",
    padding: "24px",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border)",
    cursor: "pointer",
    transition: "transform 0.2s, border-color 0.2s",
  },
  cardCount: {
    color: "var(--text-secondary)",
    fontSize: "14px",
    marginTop: "8px",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  modal: {
    background: "var(--bg-secondary)",
    padding: "32px",
    borderRadius: "var(--radius-lg)",
    width: "400px",
    maxWidth: "90%",
  },
  label: {
    display: "block",
    marginBottom: "16px",
    color: "var(--text-secondary)",
    fontSize: "14px",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "16px",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    color: "var(--text-primary)",
    fontSize: "16px",
  },
  row: {
    display: "flex",
    gap: "16px",
    marginBottom: "24px",
  },
  smallInput: {
    width: "60px",
    padding: "8px",
    marginLeft: "8px",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    color: "var(--text-primary)",
    fontSize: "14px",
  },
  modalActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
  },
  cancelBtn: {
    background: "transparent",
    border: "1px solid var(--border)",
    color: "var(--text-secondary)",
    padding: "10px 20px",
    borderRadius: "var(--radius)",
  },
  saveBtn: {
    background: "var(--accent)",
    border: "none",
    color: "white",
    padding: "10px 20px",
    borderRadius: "var(--radius)",
    fontWeight: 600,
  },
};
