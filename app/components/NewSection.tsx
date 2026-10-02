import TrackCard from "@/app/components/TrackCard";

type NewTrack = {
  id: string;
  title: string;
  genre: string | null;
  language: string | null;
  coverSignedUrl: string | null;
  artists?: {
    artist_name: string;
  } | null;
};

type NewSectionProps = {
  tracks: NewTrack[];
  selectedTrackId?: string;
  onSelect?: (track: NewTrack) => void;
};

export default function NewSection({
  tracks,
  selectedTrackId,
  onSelect,
}: NewSectionProps) {
  if (tracks.length === 0) {
    return null;
  }

  return (
    <section className="mt-16">
      <h2 className="mb-6 text-lg font-semibold uppercase tracking-wide">
        New
      </h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        {tracks.slice(0, 16).map((item) => (
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