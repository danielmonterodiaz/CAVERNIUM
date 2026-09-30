"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function CreateArtistPage() {
  const router = useRouter();
  const supabase = createClient();

  const [artistName, setArtistName] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreateArtist() {
    const name = artistName.trim();

    if (!name) {
      setMessage("Please enter an artist name.");
      return;
    }

    setMessage("");
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You need to be logged in to create an artist profile.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("artists")
      .insert({
        id: user.id,
        artist_name: name,
      });

    if (error) {
      setMessage(`Error creating artist profile: ${error.message}`);
      setSaving(false);
      return;
    }

    router.push("/upload");
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <button
          type="button"
          onClick={() => router.push("/profile")}
          className="text-sm text-white/50 hover:text-white"
        >
          ← Back to My Profile
        </button>

        <h1 className="mt-8 text-3xl font-bold">
          Create Artist Profile
        </h1>

        <p className="mt-2 text-sm text-white/50">
          Create your artist profile before uploading your music.
        </p>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <label className="block text-sm text-white/70">
            Artist Name
          </label>

          <input
            type="text"
            value={artistName}
            onChange={(event) => setArtistName(event.target.value)}
            placeholder="Enter your artist name"
            className="mt-3 w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-white/40"
          />

          <button
            type="button"
            onClick={handleCreateArtist}
            disabled={saving}
            className="mt-6 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Artist Profile"}
          </button>
        </section>

        {message && (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/70">
              {message}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}