"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import TrackPlayer from "@/app/components/TrackPlayer";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

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

type ArtistTracksClientProps = {
  tracks: ArtistTrack[];
  artistName: string;
  showEditLinks?: boolean;
  editPlayerLayout?: boolean;
};

const creationCreditsLabels: Record<string, string> = {
  music_ai_lyrics_human: "Music AI + Lyrics by Human",
  music_human_lyrics_ai: "Music by Human + Lyrics by AI",
  music_ai_lyrics_ai: "Music AI + Lyrics by AI",
  music_ai_lyrics_human_vocals_human:
    "Music AI + Lyrics by Human + Vocals by Human",
  music_ai_lyrics_ai_vocals_human:
    "Music AI + Lyrics by AI + Vocals by Human",
  music_human_lyrics_human_vocals_ai:
    "Music by Human + Lyrics by Human + Vocals by AI",
  music_ai_lyrics_human_vocals_ai:
    "Music AI + Lyrics by Human + Vocals by AI",
  music_ai_lyrics_ai_vocals_ai:
    "Music AI + Lyrics by AI + Vocals by AI",
  human_ai_collaboration: "Human–AI Collaboration",
};

export default function ArtistTracksClient({
  tracks,
  artistName,
  showEditLinks = false,
  editPlayerLayout = false,
}: ArtistTracksClientProps) {
  const supabase = createClient();

  const [selectedTrack, setSelectedTrack] =
    useState<ArtistTrack | null>(null);

  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      typeof window.gtag === "function"
    ) {
      window.gtag("event", "artist_view", {
        artist_name: artistName,
      });
    }
  }, [artistName]);

  useEffect(() => {
    if (!selectedTrack || !editPlayerLayout) return;

    const frame = window.requestAnimationFrame(() => {
      playerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedTrack, editPlayerLayout]);

  async function handleSelectTrack(track: ArtistTrack) {
    if (track.coverSignedUrl || !track.cover_url) {
      setSelectedTrack(track);
      return;
    }

    const { data: coverData } = await supabase.storage
      .from("covers")
      .createSignedUrl(track.cover_url, 3600);

    setSelectedTrack({
      ...track,
      coverSignedUrl: coverData?.signedUrl ?? null,
    });
  }

  return (
    <div className="mt-8">
      {selectedTrack && (
        <div ref={playerRef} className="mb-8 scroll-mt-70">
          {selectedTrack.audioSignedUrl ? (
            editPlayerLayout ? (
              <div className="grid max-w-[1120px] gap-5 md:grid-cols-[minmax(0,1fr)_220px_450px] md:items-start">
                <TrackPlayer
                  trackId={selectedTrack.id}
                  title={selectedTrack.title}
                  artist={artistName}
                  genre={selectedTrack.genre ?? "Unknown genre"}
                  description={selectedTrack.description ?? ""}
                  audioUrl={selectedTrack.audioSignedUrl}
                  durationSeconds={selectedTrack.duration_seconds ?? 0}
                  hideCover={true}
                  compact
                />

                <div className="mx-auto w-[220px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] backdrop-blur-sm md:mx-0 md:w-auto">
                  <div className="aspect-square bg-black/20">
                    {selectedTrack.coverSignedUrl ? (
                      <img
                        src={selectedTrack.coverSignedUrl}
                        alt={`Cover de ${selectedTrack.title}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl text-white/20">
                        ♪
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <h3 className="truncate text-sm font-semibold text-[#E8F8FF]">
                      {selectedTrack.title}
                    </h3>

                    <p className="mt-1 truncate text-[11px] text-white/40">
                      {selectedTrack.genre ?? "Unknown genre"}
                    </p>

                    <p className="mt-1 truncate text-[11px] text-white/40">
                      {selectedTrack.language ?? "Unknown language"}
                    </p>

                    <p className="mt-1 line-clamp-2 text-[10px] leading-tight text-white/35">
                      {creationCreditsLabels[selectedTrack.ai_creation_type ?? ""] ??
                        "Unknown creation credits"}
                    </p>
                  </div>
                </div>

                <div className="relative h-[320px] overflow-visible">
                  <img
                    src="/images/cavernium-artist-placeholder.png"
                    alt="CAVERNIUM artist"
                    className="absolute left-1/2 top-[-47px] h-[280px] w-[280px] -translate-x-1/2 object-contain opacity-80"
                  />
                </div>
              </div>
            ) : (
              <TrackPlayer
                trackId={selectedTrack.id}
                title={selectedTrack.title}
                artist={artistName}
                genre={selectedTrack.genre ?? "Unknown genre"}
                description={selectedTrack.description ?? ""}
                audioUrl={selectedTrack.audioSignedUrl}
                durationSeconds={selectedTrack.duration_seconds ?? 0}
                coverUrl={selectedTrack.coverSignedUrl ?? undefined}
              />
            )
          ) : (
            <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">
              Audio URL not available for this track.
            </div>
          )}
        </div>
      )}

      <div className="-mt-5 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {tracks.map((track) => (
          <div
            key={track.id}
            className={`overflow-hidden rounded-2xl border bg-white/[0.025] backdrop-blur-sm transition ${
              selectedTrack?.id === track.id
                ? "border-[#0286DC]/70 shadow-[0_0_14px_rgba(2,134,220,0.12)]"
                : "border-white/10 hover:border-[#0286DC]/40"
            }`}
          >
            <button
              type="button"
              onClick={() => handleSelectTrack(track)}
              className="w-full text-left"
            >
              <div className="aspect-square bg-black/20">
                {track.coverSignedUrl ? (
                  <img
                    src={track.coverSignedUrl}
                    alt={`Cover de ${track.title}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl">
                    ♪
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="truncate font-semibold">
                  {track.title}
                </h3>

                <p className="mt-1 text-[11px] uppercase tracking-wide text-white/40">
                  {track.genre ?? "Unknown genre"}
                </p>

                <p className="mt-1 text-[11px] uppercase tracking-wide text-white/40">
                  {track.language ?? "Unknown language"}
                </p>

                <p className="mt-1 text-[11px] uppercase tracking-wide text-white/40">
                  {creationCreditsLabels[track.ai_creation_type ?? ""] ??
                  "Unknown creation credits"}
                </p>
              </div>
            </button>

            {showEditLinks && (
              <div className="border-t border-white/10 bg-white/[0.015] px-4 py-3">
                <Link
                  href={`/tracks/${track.id}/edit`}
                  className="font-sans text-xs font-medium uppercase tracking-wider text-[#0286DC] transition hover:text-[#5CCBFF] hover:drop-shadow-[0_0_6px_rgba(2,134,220,0.55)]"
                >
                  Edit Track
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
