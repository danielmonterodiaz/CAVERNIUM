
"use client";

type SavedTrack = {
  id: string;
  title: string;
  artist_id: string;
  genre: string | null;
  description: string | null;
  duration_seconds: number;
  artist_name: string;
};

type SavedSongsClientProps = {
  tracks: SavedTrack[];
  selectedTrackId: string | null;
  onSelectTrack: (track: SavedTrack) => void;
};

export default function SavedSongsClient({
  tracks,
  selectedTrackId,
  onSelectTrack,
}: SavedSongsClientProps) {
  if (tracks.length === 0) {
    return (
      <p className="mt-3 text-sm text-white/50">
        You haven&apos;t saved any songs yet.
      </p>
    );
  }

  return (
    <div className="mt-4 w-full min-w-0 space-y-4">
      {tracks.map((track) => (
        <div
          key={track.id}
          className="w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.025] p-3 transition hover:border-[#0286DC]/40 sm:p-4"
        >
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {track.title}
              </p>

              <p className="mt-1 truncate text-xs tracking-wide text-white/50">
                {track.artist_name}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
  const scrollPosition = window.scrollY;

  onSelectTrack({
    ...track,
    id: String(track.id),
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPosition);
    });
  });
}}
              className="shrink-0 rounded-lg border border-[#0286DC] px-2.5 py-2 text-xs font-semibold text-[#5CCBFF] transition hover:bg-[#0286DC]/15 sm:px-3 sm:text-sm"
            >
              {selectedTrackId === track.id ? "Playing" : "Play"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}