"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import DiscoverClient from "@/app/components/DiscoverClient";
import RisingSection from "@/app/components/RisingSection";
import NewSection from "@/app/components/NewSection";
import HiddenGemsSection from "@/app/components/HiddenGemsSection";
import TrackPlayer from "@/app/components/TrackPlayer";
// import InTheMakingSection from "./InTheMakingSection";

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
  // inTheMakingTracks: HomeTrack[];
};

export default function HomeClient({
  tracks,
  featuredTracks,
  risingTracks,
  newTracks,
  hiddenGemTracks,
  // inTheMakingTracks = [],
}: HomeClientProps) {
  const [selectedTrack, setSelectedTrack] =
    useState<HomeTrack | null>(tracks[0] ?? null);

  const [playerSlot, setPlayerSlot] =
    useState<HTMLElement | null>(null);

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