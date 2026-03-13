"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  if (status === "loading") {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>PokeBinder</h1>
        <p style={styles.subtitle}>Manage your Pokemon card collection</p>
        <button onClick={() => signIn("google")} style={styles.button}>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
  },
  card: {
    background: "var(--bg-card)",
    padding: "48px",
    borderRadius: "16px",
    textAlign: "center",
    border: "1px solid var(--border)",
  },
  title: {
    fontSize: "48px",
    marginBottom: "8px",
    background: "linear-gradient(135deg, #e94560, #ff6b6b)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    color: "var(--text-secondary)",
    marginBottom: "32px",
    fontSize: "18px",
  },
  button: {
    background: "var(--accent)",
    color: "white",
    border: "none",
    padding: "14px 32px",
    fontSize: "16px",
    fontWeight: 600,
    borderRadius: "var(--radius)",
    transition: "background 0.2s",
  },
  loading: {
    color: "var(--text-secondary)",
  },
};
