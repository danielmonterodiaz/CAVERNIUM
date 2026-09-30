"use client";

import { useEffect, useState } from "react";
import TrackPlayer from "@/app/components/TrackPlayer";

type RankingTrack = {
  id: string;
  title: string;
  genre: string | null;
  description: string | null;
  audioSignedUrl: string | null;
  duration_seconds: number;
  coverSignedUrl: string | null;
  artistName: string;
  average: number;
  ratingCount: number;
};

type RankingsClientProps = {
  tracks: RankingTrack[];
};

export default function RankingsClient({
  tracks = [],
}: RankingsClientProps) {
  const [selectedTrack, setSelectedTrack] =
    useState<RankingTrack | null>(null);

  useEffect(() => {
    if (!selectedTrack) return;

    const frame = window.requestAnimationFrame(() => {
      const player = document.getElementById("rankings-player");

      if (!player) return;

      const headerOffset = 150;
      const targetY =
        window.scrollY +
        player.getBoundingClientRect().top -
        headerOffset;

      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: "smooth",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedTrack?.id]);

  return (
    <>
      {selectedTrack?.audioSignedUrl && (
        <div
          id="rankings-player"
          className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2 scroll-mt-6"
        >
          <div>
            <TrackPlayer
              trackId={selectedTrack.id}
              title={selectedTrack.title}
              artist={selectedTrack.artistName}
              genre={selectedTrack.genre ?? "Unknown Genre"}
              description={selectedTrack.description ?? ""}
              audioUrl={selectedTrack.audioSignedUrl}
              durationSeconds={selectedTrack.duration_seconds}
              coverUrl={selectedTrack.coverSignedUrl ?? undefined}
              compact
            />
          </div>

          <div className="self-start rounded-2xl border border-white/10 bg-white/[0.025] p-4 backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
              Track details
            </p>

            <h3 className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-2xl font-semibold">
              <span>{selectedTrack.title}</span>
              <span className="text-white/30">|</span>
              <span className="text-sm font-normal text-white/50">
                {selectedTrack.artistName}
              </span>
            </h3>

            <div className="mt-3 grid grid-cols-2 gap-3 border-y border-white/10 py-3">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-white/40">
                  Duration
                </p>

                <p className="mt-1 text-sm text-white/70">
                  {Math.floor(
                    selectedTrack.duration_seconds / 60
                  )}
                  :
                  {String(
                    selectedTrack.duration_seconds % 60
                  ).padStart(2, "0")}
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wide text-white/40">
                  Rating
                </p>

                <p className="mt-1 text-sm text-white/70">
                  {selectedTrack.average.toFixed(1)} / 10
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 text-[24px] uppercase tracking-wide text-[#0286DC]">
              <span className="whitespace-nowrap">
                Ranking Position
              </span>

              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border-2 border-[#0286DC] bg-[#0286DC]/10 text-[24px] text-[#0286DC] shadow-[0_0_18px_rgba(2,134,220,0.45)] [text-shadow:0_0_8px_rgba(2,134,220,1)]">
                {tracks.findIndex(
                  (track) =>
                    track.id === selectedTrack.id
                ) + 1}
              </span>
            </div>

            <div className="mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
                Description
              </p>

              <p className="mt-1 break-words text-sm leading-relaxed text-white/70">
                {selectedTrack.description ||
                  "No description available."}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {tracks.map((track, index) => (
          <button
            key={track.id}
            type="button"
            onClick={() => setSelectedTrack(track)}
            className={`group flex min-w-0 w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
              selectedTrack?.id === track.id
                ? "border-[#5CCBFF]/60 bg-white/[0.045] shadow-[0_0_20px_rgba(92,203,255,0.08)]"
                : "border-white/10 bg-white/[0.025] hover:border-white/25"
            }`}
          >
            <div className="w-8 shrink-0 text-center text-lg font-semibold text-white/30">
              {String(index + 1).padStart(2, "0")}
            </div>

            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
              {track.coverSignedUrl ? (
                <img
                  src={track.coverSignedUrl}
                  alt={`Cover de ${track.title}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-lg text-white/20">
                  ♪
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold">
                {track.title}
              </h3>

              <p className="mt-1 truncate text-xs text-white/60">
                {track.artistName}
              </p>

              <p className="mt-1 truncate text-[11px] text-white/35">
                {track.genre ?? "Unknown Genre"}
              </p>
            </div>

            <div className="shrink-0 border-l border-white/10 pl-3 text-right">
              <div className="text-xl font-bold">
                {track.average.toFixed(1)}
              </div>

              <div className="text-[10px] text-white/40">
                {track.ratingCount}{" "}
                {track.ratingCount === 1
                  ? "rating"
                  : "ratings"}
              </div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
