"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import SavedSongsClient from "@/app/components/SavedSongsClient";
import MyRatingsClient from "@/app/components/MyRatingsClient";
import TrackPlayer from "@/app/components/TrackPlayer";

type SavedTrack = {
  id: string;
  title: string;
  artist_id: string;
  genre: string | null;
  description: string | null;
  duration_seconds: number;
  cover_url: string | null;
  artist_name: string;
};

type RatingTrack = {
  id: string;
  track_id: string;
  title: string;
  artist_id: string;
  genre: string | null;
  description: string | null;
  duration_seconds: number;
  cover_url: string | null;
  artist_name: string;
  score: number;
  is_revaluation: boolean;
};

type PlayerTrack = {
  trackId: string;
  title: string;
  artist: string;
  genre: string;
  description: string;
  durationSeconds: number;
  coverUrl?: string;
};

const supabase = createClient();

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [artist, setArtist] = useState<{
    id: string;
    artist_name: string;
    cover_url?: string | null;
  } | null>(null);

  const [artistImageUrl, setArtistImageUrl] =
    useState<string | null>(null);

  const [savedTracks, setSavedTracks] = useState<SavedTrack[]>([]);
  const [ratingTracks, setRatingTracks] = useState<RatingTrack[]>([]);
  const [selectedTrack, setSelectedTrack] =
    useState<PlayerTrack | null>(null);

  useEffect(() => {
    if (!selectedTrack) return;

    const frame = window.requestAnimationFrame(() => {
      document.getElementById("profile-player")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedTrack?.trackId]);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: artistData } = await supabase
        .from("artists")
        .select("id, artist_name, cover_url")
        .eq("id", user.id)
        .maybeSingle();

      setArtist(artistData ?? null);

      const { data: proStatus } = await supabase.rpc(
        "get_my_pro_status"
      );

      setIsPro(proStatus?.[0]?.is_pro === true);

      if (artistData?.cover_url) {
        const { data: coverData } =
          await supabase.storage
            .from("covers")
            .createSignedUrl(
              artistData.cover_url,
              3600
            );

        setArtistImageUrl(
          coverData?.signedUrl ?? null
        );
      } else {
        setArtistImageUrl(null);
      }

      const { data: savedSongs } = await supabase
        .from("saves")
        .select(`
          id,
          created_at,
          tracks (
            id,
            title,
            artist_id,
            genre,
            description,
            duration_seconds,
            cover_url,
            artists (
              artist_name
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      const normalizedSavedTracks = (savedSongs ?? [])
        .map((save: any) => {
          const track = Array.isArray(save.tracks)
            ? save.tracks[0]
            : save.tracks;

          if (!track) return null;

          const trackArtist = Array.isArray(
            track.artists
          )
            ? track.artists[0]
            : track.artists;

          return {
            id: track.id,
            title: track.title,
            artist_id: track.artist_id,
            genre: track.genre,
            description: track.description,
            duration_seconds:
              track.duration_seconds,
            cover_url: track.cover_url,
            artist_name:
              trackArtist?.artist_name ??
              "Unknown Artist",
          };
        })
        .filter(Boolean) as SavedTrack[];

      setSavedTracks(normalizedSavedTracks);

      const { data: ratings } = await supabase
        .from("ratings")
        .select(`
          id,
          score,
          listened_percent,
          is_revaluation,
          created_at,
          updated_at,
          tracks (
            id,
            title,
            artist_id,
            genre,
            description,
            duration_seconds,
            cover_url,
            artists (
              artist_name
            )
          )
        `)
        .eq("user_id", user.id)
        .order("updated_at", {
          ascending: false,
        });

      const normalizedRatings = (ratings ?? [])
        .map((rating: any) => {
          const track = Array.isArray(
            rating.tracks
          )
            ? rating.tracks[0]
            : rating.tracks;

          if (!track) return null;

          const trackArtist = Array.isArray(
            track.artists
          )
            ? track.artists[0]
            : track.artists;

          return {
            id: rating.id,
            title: track.title,
            artist_id: track.artist_id,
            genre: track.genre,
            description: track.description,
            duration_seconds:
              track.duration_seconds,
            cover_url: track.cover_url,
            artist_name:
              trackArtist?.artist_name ??
              "Unknown Artist",
            score: rating.score,
            is_revaluation: rating.is_revaluation,
            track_id: track.id,
          };
        })
        .filter(Boolean) as RatingTrack[];

      setRatingTracks(normalizedRatings);

      setLoading(false);
    }

    loadProfile();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-10 text-white">
        <p className="text-white/50">
          Loading...
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-black p-10 text-white">
        <h1 className="text-3xl font-bold">
          My Profile
        </h1>

        <p className="mt-4 text-white/50">
          You need to log in to view your profile.
        </p>

        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-white/70 hover:text-white"
        >
          ← Log in
        </Link>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-visible bg-black text-white">
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

      <div className="relative z-10 mx-auto max-w-7xl px-2 py-0 md:px-6">
        <header className="relative mb-3 border-b border-white/10 pb-1">
          <img
            src="/images/cavernium-artist-placeholder.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[80%] z-0 h-[210px] w-[210px] -translate-x-1/2 scale-[1.2] -translate-y-1/2 object-contain opacity-[0.3]"
          />
          <div className="relative z-10 flex items-center">
            <div className="flex items-center">
              <Link
                href="/"
                className="shrink-0"
              >
                <img
                  src="/icons/LOGO%20CAVERNIUM.png"
                  alt="CAVERNIUM"
                  className="h-auto w-36"
                />
              </Link>

              <div className="mx-0 h-10 w-px bg-white/20" />

              <nav className="ml-5 hidden items-center gap-7 text-sm text-white/60 md:flex">
                <Link
                  href="/"
                  className="transition hover:text-white"
                >
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
              </nav>
            </div>

            {artist && (
              <div className="ml-auto flex flex-col items-end gap-3">
                <nav className="hidden items-center gap-5 md:flex">
                  <Link
                    href={`/artists/${artist.id}`}
                    className="font-sans text-xs font-medium uppercase tracking-wider text-[#0286DC] transition hover:text-[#5CCBFF] hover:drop-shadow-[0_0_6px_rgba(2,134,220,0.55)]"
                  >
                    View Artist Profile
                  </Link>

                  <span className="h-4 w-px bg-white/20" />

                  <Link
                    href={`/artists/${artist.id}/edit`}
                    className="font-sans text-xs font-medium uppercase tracking-wider text-[#0286DC] transition hover:text-[#5CCBFF] hover:drop-shadow-[0_0_6px_rgba(2,134,220,0.55)]"
                  >
                    Edit Artist Profile
                  </Link>

                  <span className="h-4 w-px bg-white/20" />

                  <Link
                    href="/upload"
                    className="font-sans text-xs font-medium uppercase tracking-wider text-[#0286DC] transition hover:text-[#5CCBFF] hover:drop-shadow-[0_0_6px_rgba(2,134,220,0.55)]"
                  >
                    Upload Track
                  </Link>
                </nav>

                <div className="flex flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const confirmed = window.confirm(
                        "Are you sure you want to log out?"
                      );

                      if (!confirmed) return;

                      await supabase.auth.signOut({
                        scope: "local",
                      });

                      window.location.href = "/";
                    }}
                    className="font-sans text-xs font-medium uppercase tracking-wider text-violet-400 transition hover:text-violet-300 hover:drop-shadow-[0_0_6px_rgba(167,139,250,0.55)]"
                  >
                    Log Out
                  </button>

                  <button
                    type="button"
                    disabled={deletingAccount}
                    onClick={() => setShowDeleteModal(true)}
                    className="font-sans text-[10px] font-medium uppercase tracking-wider text-red-400/70 transition hover:text-red-300 hover:drop-shadow-[0_0_6px_rgba(248,113,113,0.45)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {deletingAccount ? "Deleting Account..." : "Delete Account"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <Link
          href="/"
          className="mb-5 inline-block font-sans text-xs font-medium uppercase tracking-wider text-[#0286DC] transition hover:text-[#5CCBFF] hover:drop-shadow-[0_0_6px_rgba(2,134,220,0.55)]"
        >
          ← Back to Home
        </Link>

        <section className="relative overflow-hidden [overflow-anchor:none]">
          <img
            src="/icons/LOGO%20CAVERNIUM.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[58%] z-0 w-[520px] -translate-x-1/2 -translate-y-1/2 opacity-[0.07]"
          />

          <div className="relative z-10 grid min-w-0 grid-cols-1 items-stretch gap-5 md:grid-cols-[2.05fr_1.75fr]">
            <div className="flex h-full min-h-0 flex-col rounded-2xl border border-white/15 bg-[#071016]/75 p-6 shadow-[0_0_12px_rgba(0,0,0,0.25)]">
              <div className="flex flex-1 items-center justify-between gap-6">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold uppercase tracking-wide">
                    My Profile
                  </h2>

                  <div className="mt-1 flex items-center gap-2">
                    <p className="break-words text-xl font-semibold text-[#E8F8FF] drop-shadow-[0_0_6px_rgba(92,203,255,0.28)]">
                      {artist?.artist_name ?? "Artist"}
                    </p>

                    {isPro ? (
                      <>
                        <span className="inline-flex items-center rounded-md border border-[#0286DC]/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#5CCBFF]">
                          ARTIST PRO
                        </span>

                        <Link
                          href="/pro"
                          className="font-sans text-[10px] font-medium uppercase tracking-wider text-[#0286DC] transition hover:text-[#5CCBFF] hover:drop-shadow-[0_0_6px_rgba(2,134,220,0.55)]"
                        >
                          VIEW ANALYTICS
                        </Link>
                      </>
                    ) : (
                      <Link
                        href="/pro"
                        className="hidden font-sans text-[10px] font-medium uppercase tracking-wider text-[#0286DC] transition hover:text-[#5CCBFF] hover:drop-shadow-[0_0_6px_rgba(2,134,220,0.55)] md:inline-block"
                      >
                        UPGRADE TO PRO
                      </Link>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-white/50">
                    {user.email}
                  </p>

                  {!isPro && (
                    <Link
                      href="/pro"
                      className="mt-2 block font-sans text-[10px] font-medium uppercase tracking-wider text-[#0286DC] transition hover:text-[#5CCBFF] hover:drop-shadow-[0_0_6px_rgba(2,134,220,0.55)] md:hidden"
                    >
                      UPGRADE TO PRO
                    </Link>
                  )}
                  <Link
                    href={`/artists/${artist?.id}/edit`}
                    className="mt-2 block font-sans text-[10px] font-medium uppercase tracking-wider text-[#0286DC] transition hover:text-[#5CCBFF] hover:drop-shadow-[0_0_6px_rgba(2,134,220,0.55)] md:hidden"
                  >
                    EDIT ARTIST PROFILE
                  </Link>
                </div>

                <div className="ml-3 h-32 w-32 shrink-0 translate-x-4 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                  {artistImageUrl ? (
                    <img
                      src={artistImageUrl}
                      alt={`Artist image for ${
                        artist?.artist_name ?? "Artist"
                      }`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl text-white/20">
                      ♪
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div id="profile-player" className="min-w-0 scroll-mt-6">
              {selectedTrack ? (
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px] md:items-start">
                  <TrackPlayer
                    key={selectedTrack.trackId}
                    trackId={selectedTrack.trackId}
                    title={selectedTrack.title}
                    artist={selectedTrack.artist}
                    genre={selectedTrack.genre}
                    description={selectedTrack.description}
                    audioUrl=""
                    durationSeconds={
                      selectedTrack.durationSeconds
                    }
                    coverUrl={selectedTrack.coverUrl}
                    hideCover
                    compact
                    ratingInsidePlayer
                  />

                  <div className="aspect-square w-full max-w-[180px] justify-self-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 md:w-full md:max-w-none">
                    {selectedTrack.coverUrl ? (
                      <img
                        src={selectedTrack.coverUrl}
                        alt={`Cover de ${selectedTrack.title}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-4xl text-white/20">
                        ♪
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-white/30">
                  Select a song to play
                </div>
              )}
            </div>
          </div>

          <div className="relative z-10 mt-5 grid min-w-0 items-stretch gap-4 md:grid-cols-2">
            <div className="w-full flex min-h-[300px] flex-col rounded-2xl border border-white/15 bg-[#071016]/75 p-5.5 shadow-[0_0_10px_rgba(0,0,0,0.18)]">
              <h3 className="mb-3 text-xl font-semibold tracking-tight text-[#E8F8FF]">
                My Saved Songs
              </h3>

              <SavedSongsClient
                tracks={savedTracks}
                selectedTrackId={
                  selectedTrack?.trackId ?? null
                }
                onSelectTrack={async (track) => {
                  let coverUrl: string | undefined;

                  const savedTrack = savedTracks.find(
                    (item) => item.id === track.id
                  );

                  if (savedTrack?.cover_url) {
                    const { data: coverData } =
                      await supabase.storage
                        .from("covers")
                        .createSignedUrl(
                          savedTrack.cover_url,
                          3600
                        );

                    coverUrl =
                      coverData?.signedUrl ?? undefined;
                  }

                  setSelectedTrack({
                    trackId: track.id,
                    title: track.title,
                    artist: track.artist_name,
                    genre:
                      track.genre ??
                      "Unknown Genre",
                    description:
                      track.description ?? "",
                    durationSeconds:
                      track.duration_seconds,
                    coverUrl,
                  });
                }}
              />
            </div>

            <div className="w-full min-w-0 flex min-h-[300px] flex-col rounded-2xl border border-white/15 bg-[#071016]/75 p-5.5 shadow-[0_0_10px_rgba(0,0,0,0.18)]">
              <h3 className="mb-3 text-xl font-semibold tracking-tight text-[#E8F8FF]">
                My Ratings
              </h3>

              <MyRatingsClient
                ratings={ratingTracks}
                selectedTrackId={
                  selectedTrack?.trackId ?? null
                }
                onSelectTrack={async (rating) => {
                  let coverUrl: string | undefined;

                  const ratingTrack =
                    ratingTracks.find(
                      (item) => item.id === rating.id
                    );

                  if (ratingTrack?.cover_url) {
                    const { data: coverData } =
                      await supabase.storage
                        .from("covers")
                        .createSignedUrl(
                          ratingTrack.cover_url,
                          3600
                        );

                    coverUrl =
                      coverData?.signedUrl ?? undefined;
                  }

                  setSelectedTrack({
                    trackId: rating.track_id,
                    title: rating.title,
                    artist: rating.artist_name,
                    genre:
                      rating.genre ??
                      "Unknown Genre",
                    description:
                      rating.description ?? "",
                    durationSeconds:
                      rating.duration_seconds,
                    coverUrl,
                  });
                }}
              />
            </div>
          </div>
        </section>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-account-title"
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-red-500/35 bg-[#0b0909]/95 shadow-[0_0_45px_rgba(220,38,38,0.16)]"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/80 to-transparent" />
              <div className="p-6 sm:p-7">
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-red-500/45 bg-red-500/10 text-red-400 shadow-[0_0_18px_rgba(239,68,68,0.16)]">
                    <span className="text-lg font-semibold">!</span>
                  </div>
                  <div>
                    <p className="font-sans text-[10px] font-medium uppercase tracking-[0.22em] text-red-400/75">
                      Danger Zone
                    </p>
                    <h2
                      id="delete-account-title"
                      className="mt-1 text-lg font-semibold tracking-wide text-white"
                    >
                      Leave CAVERNIUM?
                    </h2>
                  </div>
                </div>

                <div className="rounded-xl border border-red-500/15 bg-red-500/[0.035] p-4">
                  <p className="text-sm leading-6 text-white/70">
                    Your account and all associated data will be permanently deleted.
                  </p>
                  <p className="mt-2 text-xs leading-5 text-red-300/65">
                    This action cannot be undone.
                  </p>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={deletingAccount}
                    onClick={() => setShowDeleteModal(false)}
                    className="rounded-lg border border-white/10 px-4 py-2.5 font-sans text-xs font-medium uppercase tracking-wider text-white/55 transition hover:border-white/20 hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deletingAccount}
                    onClick={async () => {
                      setDeletingAccount(true);

                      const { error } = await supabase.functions.invoke(
                        "delete-account"
                      );

                      if (error) {
                        setDeletingAccount(false);
                        setShowDeleteModal(false);
                        window.alert(
                          "We couldn't delete your account. Please try again or contact privacy@cavernium.com."
                        );
                        return;
                      }

                      await supabase.auth.signOut({
                        scope: "local",
                      });

                      window.location.href = "/";
                    }}
                    className="rounded-lg border border-red-500/55 bg-red-500/10 px-4 py-2.5 font-sans text-xs font-semibold uppercase tracking-wider text-red-300 transition hover:border-red-400/80 hover:bg-red-500/15 hover:text-red-200 hover:shadow-[0_0_18px_rgba(239,68,68,0.12)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {deletingAccount ? "Deleting Account..." : "Delete Account"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
