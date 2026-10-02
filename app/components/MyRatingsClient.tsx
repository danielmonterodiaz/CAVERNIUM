"use client";

type RatingTrack = {
  id: string;
  track_id: string;
  title: string;
  artist_id: string;
  genre: string | null;
  description: string | null;
  duration_seconds: number;
  artist_name: string;
  score: number;
  is_revaluation: boolean;
};

type MyRatingsClientProps = {
  ratings: RatingTrack[];
  selectedTrackId: string | null;
  onSelectTrack: (track: RatingTrack) => void;
};

export default function MyRatingsClient({
  ratings,
  selectedTrackId,
  onSelectTrack,
}: MyRatingsClientProps) {
  if (ratings.length === 0) {
    return (
      <p className="mt-3 text-sm text-white/50">
        You haven&apos;t rated any songs yet.
      </p>
    );
  }

  return (
    <div className="mt-4 w-full min-w-0 space-y-4">
      {ratings.map((rating) => (
        <div
          key={rating.id}
          className="w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.025] p-3 transition hover:border-[#0286DC]/40 sm:p-4"
        >
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {rating.title}
              </p>

              <p className="mt-1 truncate text-xs tracking-wide text-white/50">
                {rating.artist_name}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="text-right">
                <p className="whitespace-nowrap text-lg font-semibold text-[#5CCBFF]">
                  ★ {rating.score}/10
                </p>

                <p className="mt-1 text-[10px] text-white/45">
                  {rating.is_revaluation
                    ? "Updated rating"
                    : "Rating"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onSelectTrack(rating);
                }}
                className="shrink-0 rounded-lg border border-[#0286DC] px-2.5 py-2 text-xs font-semibold text-[#5CCBFF] transition hover:bg-[#0286DC]/15 sm:px-3 sm:text-sm"
              >
                {selectedTrackId === rating.track_id
                  ? "Playing"
                  : "Play"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}