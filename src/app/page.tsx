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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
      <div className="bg-[#0f0f23] p-12 rounded-2xl text-center border border-gray-800 shadow-xl">
        <h1 className="text-5xl font-archivo mb-2 bg-gradient-to-br from-[#e94560] to-[#ff6b6b] bg-clip-text text-transparent">
          PokeBinder
        </h1>
        <p className="text-gray-400 mb-8 text-lg">
          Manage your Pokemon card collection
        </p>
        <button
          onClick={() => signIn("google")}
          className="bg-[#e94560] hover:bg-[#ff6b6b] text-white border-none py-3.5 px-8 text-base font-semibold rounded-lg transition-colors cursor-pointer"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
