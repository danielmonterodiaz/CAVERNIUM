"use client";

type TrackCardProps = {
  title: string;
  artist: string;
  genre: string;
  language: string;
  coverUrl?: string;
  onSelect?: () => void;
  isSelected?: boolean;
};

export default function TrackCard({
  title,
  artist,
  genre,
  language,
  coverUrl,
  onSelect,
  isSelected,
}: TrackCardProps) {
  return (
    <article
      onClick={onSelect}
      className={`group relative overflow-hidden rounded-xl border transition ${
        onSelect ? "cursor-pointer" : "cursor-default"
      } ${
        isSelected
  ? "border-violet-300/70 bg-[var(--cavernium-surface-light)] shadow-[0_0_20px_rgba(181,140,255,0.18)]"
  : "border-[var(--cavernium-border)] bg-[#071016]/55"
      }`}
    >
      <div className="aspect-square bg-white/10">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={`Cover de ${title}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">
            🎵
          </div>
        )}
      </div>

      <div className="min-h-[96px] p-3">
        <div className="flex items-center gap-2">
          {isSelected && (
            <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[9px] font-bold text-black">
              NOW PLAYING
            </span>
          )}

          <h2
  className={`h-10 min-w-0 text-base font-semibold leading-tight ${
    isSelected ? "truncate" : "line-clamp-2"
  }`}
>
  {title}
</h2>
        </div>

        <p className="mt-1 text-sm text-white/70">
  {artist}
</p>

<p className="mt-2 text-xs text-[var(--cavernium-muted)]">
  {genre}
</p>

<p className="mt-1 text-xs text-[var(--cavernium-muted-dark)]">
  {language}
</p>
      </div>
    </article>
  );
}