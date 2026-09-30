import TrackCard from "@/app/components/TrackCard";

type RisingTrack = {
  id: string;
  title: string;
  genre: string | null;
  language: string | null;
  coverSignedUrl: string | null;
  artists?: {
    artist_name: string;
  } | null;
};

type RisingSectionProps = {
  tracks: RisingTrack[];
  selectedTrackId?: string;
  onSelect?: (track: RisingTrack) => void;
};

export default function RisingSection({
  tracks,
  selectedTrackId,
  onSelect,
}: RisingSectionProps) {
  if (tracks.length === 0) {
    return null;
  }

  return (
    <section className="mt-16">
      <h2 className="mb-6 text-lg font-semibold uppercase tracking-wide">
        Rising
      </h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {tracks.slice(0, 4).map((item) => (
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
            isSelected={selectedTrackId === item.id}
            onSelect={() => onSelect?.(item)}
          />
        ))}
      </div>
    </section>
  );
}