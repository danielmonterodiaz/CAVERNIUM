"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import ArtistTracksClient from "@/app/components/ArtistTracksClient";
import MobileNav from "@/app/components/MobileNav";

type EditArtistPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type ArtistTrack = {
  id: string;
  title: string;
  description: string | null;
  language: string | null;
  cover_url: string | null;
  coverSignedUrl: string | null;
  audioSignedUrl: string | null;
  genre: string | null;
  duration_seconds: number | null;
  ai_creation_type: string | null;
};

export default function EditArtistPage({
  params,
}: EditArtistPageProps) {
  const supabase = createClient();
  const [id, setId] = useState("");

  const [artist, setArtist] = useState<{
    id: string;
    artist_name: string;
    cover_url: string | null;
    bio: string | null;
  } | null>(null);

  const [tracks, setTracks] = useState<ArtistTrack[]>([]);
  const [coverSignedUrl, setCoverSignedUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const [bio, setBio] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [savingBio, setSavingBio] = useState(false);

  useEffect(() => {
    async function loadArtist() {
      const { id: artistId } = await params;
      setId(artistId);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || user.id !== artistId) {
        setMessage("You are not authorized to edit this artist.");
        setLoading(false);
        return;
      }

      const { data: artistData, error: artistError } = await supabase
        .from("artists")
        .select(
          "id, artist_name, cover_url, bio"
        )
        .eq("id", artistId)
        .single();

      if (artistError || !artistData) {
        setMessage(artistError?.message ?? "Artist not found.");
        setLoading(false);
        return;
      }

      setArtist(artistData);
      setBio(artistData.bio ?? "");
      if (artistData.cover_url) {
        const { data: coverData } = await supabase.storage
          .from("covers")
          .createSignedUrl(artistData.cover_url, 3600);

        setCoverSignedUrl(coverData?.signedUrl ?? null);
      }

      const { data: trackData, error: tracksError } = await supabase
        .from("tracks")
        .select(
          "id, title, description, language, cover_url, audio_url, genre, duration_seconds, ai_creation_type"
        )
        .eq("artist_id", artistId)
        .order("created_at", { ascending: false });

      if (tracksError) {
        setMessage(`Error loading tracks: ${tracksError.message}`);
      } else {
        const trackList = trackData ?? [];

        const coverPaths = trackList
          .filter((track) => track.cover_url)
          .map((track) => track.cover_url);

        const audioPaths = trackList
          .filter((track) => track.audio_url)
          .map((track) => track.audio_url);

        const { data: coverSignedData } =
          coverPaths.length > 0
            ? await supabase.storage
                .from("covers")
                .createSignedUrls(coverPaths, 3600)
            : { data: [] };

        const { data: audioSignedData } =
          audioPaths.length > 0
            ? await supabase.storage
                .from("tracks")
                .createSignedUrls(audioPaths, 3600)
            : { data: [] };

        const coverUrlMap = new Map(
          coverPaths.map((path, index) => [
            path,
            coverSignedData?.[index]?.signedUrl ?? null,
          ])
        );

        const audioUrlMap = new Map(
          audioPaths.map((path, index) => [
            path,
            audioSignedData?.[index]?.signedUrl ?? null,
          ])
        );

        const tracksWithUrls = trackList.map((track) => ({
          id: track.id,
          title: track.title,
          description: track.description,
          language: track.language,
          cover_url: track.cover_url,
          coverSignedUrl: track.cover_url
            ? coverUrlMap.get(track.cover_url) ?? null
            : null,
          audioSignedUrl: track.audio_url
            ? audioUrlMap.get(track.audio_url) ?? null
            : null,
          genre: track.genre,
          duration_seconds: track.duration_seconds,
          ai_creation_type: track.ai_creation_type,
        }));

        setTracks(tracksWithUrls);
      }

      setLoading(false);
    }

    loadArtist();
  }, [params]);

  async function handleUpdateArtistImage() {
    if (!file || !artist) {
      setMessage("Please select an artist image.");
      return;
    }

    if (file.size > 500 * 1024) {
      setMessage("Artist image must be 500 KB or smaller.");
      return;
    }

    setMessage("");
    setUpdating(true);

    const isSquare = await new Promise<boolean>((resolve) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(image.width === image.height);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(false);
      };

      image.src = objectUrl;
    });

    if (!isSquare) {
      setMessage("Artist image must be square (1:1).");
      setUpdating(false);
      return;
    }

    const fileExtension =
      file.name.split(".").pop()?.toLowerCase() || "png";

    const filePath = `artists/${artist.id}/${crypto.randomUUID()}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from("covers")
      .upload(filePath, file);

    if (uploadError) {
      setMessage(`Upload error: ${uploadError.message}`);
      setUpdating(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("artists")
      .update({ cover_url: filePath })
      .eq("id", artist.id);

    if (updateError) {
      setMessage(`Update error: ${updateError.message}`);
      setUpdating(false);
      return;
    }

    const { data: coverData } = await supabase.storage
      .from("covers")
      .createSignedUrl(filePath, 3600);

    setCoverSignedUrl(coverData?.signedUrl ?? null);

    setArtist({
      ...artist,
      cover_url: filePath,
    });

    setFile(null);
    setMessage("Artist image updated successfully.");
    setUpdating(false);
  }

  async function handleSaveBio() {
    if (!artist) return;

    setMessage("");
    setSavingBio(true);

    const { error } = await supabase
      .from("artists")
      .update({ bio: bio.trim() || null })
      .eq("id", artist.id);

    if (error) {
      setMessage(`Update error: ${error.message}`);
      setSavingBio(false);
      return;
    }

    setArtist({
      ...artist,
      bio: bio.trim() || null,
    });

    setMessage("Artist bio updated successfully.");
    setSavingBio(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-10 text-white">
        <p className="text-white/60">Loading...</p>
      </main>
    );
  }

  if (!artist) {
    return (
      <main className="min-h-screen bg-black p-10 text-white">
        <h1 className="text-3xl font-bold">Edit Artist</h1>

        <p className="mt-4 text-red-400">{message}</p>

        <Link
          href="/profile"
          className="mt-6 inline-block text-sm text-white/60 hover:text-white"
        >
          ← Back to My Profile
        </Link>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <img
          src="/backgrounds/cavernium-pro-bg.png"
          alt=""
          aria-hidden="true"
          className="h-full w-full scale-[1.16] object-cover object-center opacity-[0.30]"
        />
        <div className="absolute inset-0 bg-black/48" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(2,134,220,0.08),transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-0 pb-12">
        <header className="mb-4 border-b border-white/10 pb-1">
          <div className="flex items-center">
            <Link href="/" className="shrink-0">
              <img
                src="/icons/LOGO%20CAVERNIUM.png"
                alt="CAVERNIUM"
                className="h-auto w-36"
              />
            </Link>

            <div className="mx-0 h-10 w-px bg-white/20" />

            <nav className="ml-5 hidden items-center gap-7 text-sm text-white/60 md:flex">
              <Link href="/" className="transition hover:text-white">
                Home
              </Link>

              <Link
                href="/discover"
                className="transition hover:text-white"
              >
                Discover
              </Link>

              <Link
                href="/rankings"
                className="transition hover:text-white"
              >
                Rankings
              </Link>

              <Link
                href="/artists"
                className="text-white transition hover:text-white"
              >
                Artists
              </Link>

              <Link href="/profile" className="transition hover:text-white">
                My Profile
              </Link>

              <span className="rounded-lg border border-white/10 bg-white/[0.025] px-3 py-1.5 text-xs text-white/50 backdrop-blur-sm">
                LOGGED AS {artist.artist_name}
              </span>
            </nav>

            <div className="ml-auto hidden text-xs tracking-widest text-white/40 md:block">
              LISTEN · RATE · DISCOVER
            </div>

            <MobileNav
              isLoggedIn={true}
              loggedArtistName={artist.artist_name}
            />
          </div>
        </header>

        <div className="relative mx-auto max-w-7xl overflow-hidden">
          <img
            src="/icons/LOGO%20CAVERNIUM.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[360px] z-0 w-[620px] -translate-x-1/2 opacity-[0.055]"
          />

          <Link
            href="/profile"
            className="inline-block font-sans text-xs font-medium uppercase tracking-wider text-[#0286DC] transition hover:text-[#5CCBFF] hover:drop-shadow-[0_0_6px_rgba(2,134,220,0.55)]"
          >
            ← Back to My Profile
          </Link>

          <h1 className="mt-8 text-2xl font-semibold uppercase tracking-wide text-[#E8F8FF]">
            Edit Artist
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-white/50">
            Update your artist profile.
          </p>

          <section className="mt-8 rounded-2xl border border-white/10 bg-transparent p-6 backdrop-blur-none">
            <h2 className="text-xl font-semibold uppercase tracking-wide text-[#E8F8FF]">
              {artist.artist_name}
            </h2>

            <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
              <div>
                <p className="font-sans text-xs font-medium uppercase tracking-wider text-white/45">
                  Current artist image
                </p>

                <div className="mt-3 aspect-square w-64 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
                  {coverSignedUrl ? (
                    <img
                      src={coverSignedUrl}
                      alt={`Artist image for ${artist.artist_name}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-5xl">
                      ♪
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <label className="mb-2 block font-sans text-xs font-medium uppercase tracking-wider text-white/45">
                    New Artist Image (1:1)
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      setFile(event.target.files?.[0] ?? null);
                      setMessage("");
                    }}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-xs text-white/75 backdrop-blur-sm file:mr-4 file:rounded-lg file:border file:border-[#0286DC]/50 file:bg-[#0286DC]/10 file:px-3 file:py-2 file:text-xs file:font-medium file:uppercase file:tracking-wider file:text-[#5CCBFF] hover:file:border-[#5CCBFF] hover:file:bg-[#0286DC]/15"
                  />

                  <p className="mt-2 text-xs text-white/35">
                    Square image only.
                  </p>

                  <button
                    type="button"
                    onClick={handleUpdateArtistImage}
                    disabled={updating}
                    className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-lg border border-[#0286DC]/60 bg-black/40 px-4 py-2 font-sans text-xs font-medium uppercase tracking-wider text-[#5CCBFF] transition hover:border-[#5CCBFF] hover:bg-[#0286DC]/15 hover:text-white hover:drop-shadow-[0_0_6px_rgba(2,134,220,0.55)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {updating
                      ? "Updating..."
                      : "Update Artist Image"}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 backdrop-blur-sm">
                <h3 className="text-xl font-semibold uppercase tracking-wide text-[#E8F8FF]">
                  Artist Bio
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-white/45">
                  Tell listeners a little about the artist.
                </p>

                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  rows={5}
                  placeholder="Write a short biography..."
                  className="mt-5 w-full resize-none rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm text-white/90 outline-none backdrop-blur-sm placeholder:text-white/25 focus:border-[#0286DC]/50 focus:ring-1 focus:ring-[#0286DC]/20"
                />

                <button
                  type="button"
                  onClick={handleSaveBio}
                  disabled={savingBio}
                  className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-lg border border-[#0286DC]/60 bg-black/40 px-4 py-2 font-sans text-xs font-medium uppercase tracking-wider text-[#5CCBFF] transition hover:border-[#5CCBFF] hover:bg-[#0286DC]/15 hover:text-white hover:drop-shadow-[0_0_6px_rgba(2,134,220,0.55)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {savingBio ? "Saving..." : "Save Bio"}
                </button>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-white/10 bg-transparent p-6 backdrop-blur-none">
            <h2 className="text-xl font-semibold uppercase tracking-wide text-[#E8F8FF]">
              My Tracks
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-white/45">
              Manage the tracks published by this artist.
            </p>

            {tracks.length === 0 ? (
              <p className="mt-6 text-sm text-white/40">
                No tracks found.
              </p>
            ) : (
              <ArtistTracksClient
                tracks={tracks}
                artistName={artist.artist_name}
                showEditLinks={true}
                editPlayerLayout={true}
              />
            )}
          </section>

          {message && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#071016]/90 p-6 shadow-[0_0_30px_rgba(0,0,0,0.45)] backdrop-blur-md">
                <p className="text-sm leading-relaxed text-white/80">
                  {message}
                </p>

                <button
                  type="button"
                  onClick={() => setMessage("")}
                  className="mt-6 w-full rounded-lg border border-[#0286DC]/60 bg-black/40 px-4 py-2 font-sans text-xs font-medium uppercase tracking-wider text-[#5CCBFF] transition hover:border-[#5CCBFF] hover:bg-[#0286DC]/15 hover:text-white hover:drop-shadow-[0_0_6px_rgba(2,134,220,0.55)]"
                >
                  OK
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
