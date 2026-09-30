"use client";

import { useState } from "react";
import DiscoverClient from "@/app/components/DiscoverClient";

type DiscoverTrack = {
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

type DiscoverPageClientProps = {
  tracks: DiscoverTrack[];
};

export default function DiscoverPageClient({
  tracks,
}: DiscoverPageClientProps) {
  const [selectedTrack, setSelectedTrack] =
    useState<DiscoverTrack | null>(null);

  return (
    <DiscoverClient
      tracks={tracks}
      title="Discover"
      compact={true}
      selectedTrack={selectedTrack}
      onSelect={setSelectedTrack}
    />
  );
}