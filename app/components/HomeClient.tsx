
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import DiscoverClient from "@/app/components/DiscoverClient";
import RisingSection from "@/app/components/RisingSection";
import NewSection from "@/app/components/NewSection";
import HiddenGemsSection from "@/app/components/HiddenGemsSection";
import TrackPlayer from "@/app/components/TrackPlayer";

type HomeTrack = {
  id: string;
  title: string;
  genre: string | null;
  language: string | null;
  description: string | null;
  audio_url: string;
  audioSignedUrl: string | null;
  duration_seconds: number;
  coverSignedUrl: string | null;
  artists?: {
    artist_name: string;
  } | null;
};

type HomeClientProps = {
  tracks: HomeTrack[];
  featuredTracks: HomeTrack[];
  risingTracks: HomeTrack[];
  newTracks: HomeTrack[];
  hiddenGemTracks: HomeTrack[];
};

const PIONEER_POPUP_KEY = "cavernium-pioneer-popup-dismissed";

export default function HomeClient({
  tracks,
  featuredTracks,
  risingTracks,
  newTracks,
  hiddenGemTracks,
}: HomeClientProps) {
  const [selectedTrack, setSelectedTrack] =
    useState<HomeTrack | null>(tracks[0] ?? null);

  const [playerSlot, setPlayerSlot] =
    useState<HTMLElement | null>(null);

  const [showPioneerPopup, setShowPioneerPopup] =
    useState(false);

  useEffect(() => {
    const updatePlayerSlot = () => {
      const slot = document.getElementById("player-slot");

      if (slot) {
        setPlayerSlot(slot);
      }
    };

    updatePlayerSlot();

    const timer = window.setTimeout(updatePlayerSlot, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem(PIONEER_POPUP_KEY)) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowPioneerPopup(true);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, []);

  const closePioneerPopup = () => {
    sessionStorage.setItem(PIONEER_POPUP_KEY, "true");
    setShowPioneerPopup(false);
  };

  const handleSelect = (track: { id: string }) => {
    const fullTrack = tracks.find(
      (item) => item.id === track.id
    );

    if (fullTrack) {
      setSelectedTrack(fullTrack);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const player = selectedTrack ? (
    <div className="relative rounded-2xl border border-purple-500/20 bg-black p-3 shadow-2xl">
      <img
        src="/icons/LOGO%20CAVERNIUM.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-contain opacity-[0.18]"
      />

      <div className="relative z-10">
        <p className="mb-3 px-1 text-[10px] font-semibold tracking-[0.25em] text-white/35">
          NOW PLAYING
        </p>

        <TrackPlayer
          trackId={selectedTrack.id}
          title={selectedTrack.title}
          artist={
            selectedTrack.artists?.artist_name ??
            "Unknown Artist"
          }
          genre={selectedTrack.genre ?? "Unknown Genre"}
          description={selectedTrack.description ?? ""}
          audioUrl={selectedTrack.audioSignedUrl ?? ""}
          durationSeconds={selectedTrack.duration_seconds}
          coverUrl={
            selectedTrack.coverSignedUrl ?? undefined
          }
          compact
        />
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-8">
      {showPioneerPopup && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 px-4 py-6 backdrop-blur-md"
          onClick={closePioneerPopup}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="pioneer-popup-title"
            className="relative my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-[#0286DC]/50 bg-[#050A12] shadow-[0_0_45px_rgba(2,134,220,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closePioneerPopup}
              aria-label="Close"
              className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/50 text-xl text-white/70 transition hover:border-white/40 hover:text-white"
            >
              ×
            </button>

            <div className="pointer-events-none absolute inset-0">
              <img
                src="/backgrounds/cavernium-pro-bg.png"
                alt=""
                aria-hidden="true"
                className="h-full w-full object-cover opacity-25"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#061526]/40 via-[#050A12]/70 to-[#050A12]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(2,134,220,0.20),transparent_65%)]" />
            </div>

            <div className="relative z-10 px-6 pb-8 pt-12 text-center sm:px-10 sm:pb-10 sm:pt-14">
              <img
                src="/icons/LOGO%20CAVERNIUM.png"
                alt="CAVERNIUM"
                className="mx-auto mb-6 h-auto w-44"
              />

              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#5CCBFF]">
                EARLY ARTISTS · FREE TO JOIN
              </p>

              <h2
                id="pioneer-popup-title"
                className="text-3xl font-bold uppercase leading-tight tracking-wide text-white sm:text-4xl"
              >
                YOUR MUSIC
                <br />
                DESERVES TO BE HEARD.
              </h2>

              <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-white/65">
                Create AI music? Upload it for free and give
                your tracks a chance to be discovered worldwide.
              </p>

              <div className="my-7 border-y border-white/10 py-5">
                <p className="text-2xl font-bold uppercase tracking-[0.12em] text-[#D8B56A] sm:text-3xl">
                  BECOME A PIONEER.
                </p>

                <p className="mt-3 text-sm font-semibold uppercase tracking-wider text-white">
                  JOIN FROM THE BEGINNING
                </p>

                <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-white/55">
                  Get Pioneer recognition and become eligible
                  for future benefits.
                </p>
              </div>

              <Link
                href="/signup"
                onClick={closePioneerPopup}
                className="flex min-h-12 w-full items-center justify-center rounded-lg border border-[#42BFFF] bg-[#0286DC] px-5 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-[0_0_22px_rgba(2,134,220,0.25)] transition hover:bg-[#159BEF] hover:shadow-[0_0_30px_rgba(2,134,220,0.4)]"
              >
                JOIN CAVERNIUM — FREE
              </Link>

              <button
                type="button"
                onClick={closePioneerPopup}
                className="mt-5 text-xs text-white/40 transition hover:text-white/75"
              >
                Continue exploring
              </button>
            </div>
          </section>
        </div>
      )}

      {player && playerSlot
        ? createPortal(player, playerSlot)
        : null}

      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-10">
          <div id="what-deserves" className="scroll-mt-[320px]">
            <DiscoverClient
              tracks={featuredTracks}
              allTracks={tracks}
              title="What Deserves to Be Heard"
              compact
              selectedTrack={selectedTrack}
              onSelect={handleSelect}
            />
          </div>

          <div id="rising" className="scroll-mt-[320px]">
            <RisingSection
              tracks={risingTracks}
              selectedTrackId={selectedTrack?.id}
              onSelect={handleSelect}
            />
          </div>

          <div id="hidden-gems" className="scroll-mt-[320px]">
            <HiddenGemsSection
              tracks={hiddenGemTracks}
              selectedTrackId={selectedTrack?.id}
              onSelect={handleSelect}
            />
          </div>

          <div id="new" className="scroll-mt-[320px]">
            <NewSection
              tracks={newTracks}
              selectedTrackId={selectedTrack?.id}
              onSelect={handleSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
