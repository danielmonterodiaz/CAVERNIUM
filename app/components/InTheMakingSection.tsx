"use client";

import TrackCard from "./TrackCard";

type InTheMakingTrack = {
  id: string;
  title: string;
  genre?: string | null;
  language?: string | null;
  coverSignedUrl?: string | null;
  artists?: {
    artist_name: string;
  } | null;
};

type InTheMakingSectionProps = {
  tracks: InTheMakingTrack[];
  selectedTrackId?: string;
  onSelect?: (track: InTheMakingTrack) => void;
};

export default function InTheMakingSection({
  tracks,
  selectedTrackId,
  onSelect,
}: InTheMakingSectionProps) {
  if (tracks.length === 0) {
    return null;
  }

  return (
    <section className="mt-16">
      <h2 className="mb-2 text-2xl font-bold">
        In the Making
      </h2>

      <p className="mb-6 text-sm text-white/50">
        Still being discovered.
      </p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {tracks.map((item) => (
          <TrackCard
            key={item.id}
            title={item.title}
            artist={
              item.artists?.artist_name ??
              "Unknown Artist"
            }
            language={
              item.language ??
              "Unknown Language"
            }
            genre={item.genre ?? "Unknown Genre"}
            coverUrl={
              item.coverSignedUrl ?? undefined
            }
            isSelected={
              selectedTrackId === item.id
            }
            onSelect={() => onSelect?.(item)}
          />
        ))}
      </div>
    </section>
  );
}