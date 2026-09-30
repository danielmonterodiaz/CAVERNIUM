import TrackCard from "@/app/components/TrackCard";

type HiddenGemTrack = {
  id: string;
  title: string;
  genre: string | null;
  language: string | null;
  coverSignedUrl: string | null;
  artists?: {
    artist_name: string;
  } | null;
};

type HiddenGemsSectionProps = {
  tracks: HiddenGemTrack[];
  selectedTrackId?: string;
  onSelect?: (track: HiddenGemTrack) => void;
};

export default function HiddenGemsSection({
  tracks,
  selectedTrackId,
  onSelect,
}: HiddenGemsSectionProps) {
  if (tracks.length === 0) {
    return null;
  }

  return (
    <section className="relative mt-16 rounded-2xl">
      <img
        src="/icons/cavernium-hidden-gems.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 object-contain opacity-[0.10] blur-[0.5px]"
      />

      <div className="relative z-10">
        <h2 className="mb-6 text-lg font-semibold uppercase tracking-wide">
          Hidden Gems
        </h2>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {tracks.slice(0, 4).map((item) => (
            <div key={item.id} className="min-w-0">
              <TrackCard
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}