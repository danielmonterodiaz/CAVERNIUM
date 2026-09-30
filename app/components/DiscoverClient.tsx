"use client";

import { useState } from "react";
import TrackCard from "@/app/components/TrackCard";
import TrackPlayer from "@/app/components/TrackPlayer";

type DiscoverTrack = {
  id: string;
  title: string;
  genre: string | null;
  language: string | null;
  description: string | null;
  audio_url: string;
  audioSignedUrl: string | null;
  duration_seconds: number;
  ai_creation_type?: string | null;
  coverSignedUrl: string | null;
  artists?: {
    artist_name: string;
  } | null;
};

type DiscoverClientProps = {
  tracks: DiscoverTrack[];
  allTracks?: DiscoverTrack[];
  title?: string;
  compact?: boolean;
  selectedTrack: DiscoverTrack | null;
  onSelect: (track: DiscoverTrack) => void;
};

export default function DiscoverClient({
  tracks,
  allTracks = tracks,
  title = "Discover",
  compact = false,
  selectedTrack,
  onSelect,
}: DiscoverClientProps) {
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");

  const normalizedSearch = search.trim().toLowerCase();

  const filteredTracks = (
    normalizedSearch || selectedGenre || selectedLanguage
      ? allTracks
      : tracks
  ).filter((track) => {
    const title = track.title?.toLowerCase() ?? "";
    const artist =
      track.artists?.artist_name?.toLowerCase() ?? "";
    const genre = track.genre?.toLowerCase() ?? "";
    const language = track.language?.toLowerCase() ?? "";

    const matchesSearch =
      !normalizedSearch ||
      title.includes(normalizedSearch) ||
      artist.includes(normalizedSearch) ||
      genre.includes(normalizedSearch) ||
      language.includes(normalizedSearch);

    const matchesGenre =
      !selectedGenre ||
      track.genre === selectedGenre;

    const matchesLanguage =
      !selectedLanguage ||
      track.language === selectedLanguage;

    return (
      matchesSearch &&
      matchesGenre &&
      matchesLanguage
    );
  });

  const genres = Array.from(
    new Set(
      allTracks
        .map((track) => track.genre)
        .filter(
          (genre): genre is string => Boolean(genre)
        )
    )
  ).sort((a, b) => a.localeCompare(b));

  const languages = Array.from(
    new Set(
      allTracks
        .map((track) => track.language)
        .filter(
          (language): language is string =>
            Boolean(language)
        )
    )
  ).sort((a, b) => a.localeCompare(b));

  return (
    <div className="relative w-full overflow-hidden">
      <img
  src="/icons/LOGO%20CAVERNIUM.png"
  alt=""
  aria-hidden="true"
  className="pointer-events-none absolute left-1/2 top-[0px] z-0 w-[620px] -translate-x-1/2 opacity-[0.055]"
/>
      {selectedTrack?.audioSignedUrl &&
        filteredTracks.some(
          (track) => track.id === selectedTrack.id
        ) && (
          <div id="discover-player" className="scroll-mt-50 mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <TrackPlayer
                trackId={selectedTrack.id}
                title={selectedTrack.title}
                artist={
                  selectedTrack.artists?.artist_name ??
                  "Unknown Artist"
                }
                genre={
                  selectedTrack.genre ??
                  "Unknown Genre"
                }
                description={selectedTrack.description ?? ""}
                audioUrl={selectedTrack.audioSignedUrl}
                durationSeconds={
                  selectedTrack.duration_seconds ?? 0
                }
                coverUrl={
                  selectedTrack.coverSignedUrl ??
                  undefined
                }
                compact
              />

              <p className="mt-3 text-justify text-[9px] leading-relaxed text-purple-300/60">
                ▲ WARNING — By uploading a track to CAVERNIUM, artists represent that they own or have the necessary rights and permissions to share the content. CAVERNIUM is not responsible for any legal claims, disputes, or infringements arising from user-uploaded content.
              </p>
            </div>

            <div className="relative self-start overflow-hidden rounded-2xl border border-white/10 bg-[#071016]/45 p-4">
        
              <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                Track details
              </p>

              <h3 className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-2xl font-semibold">
                <span>{selectedTrack.title}</span>
                <span className="text-white/30">|</span>
                <span className="text-sm font-normal text-white/50">
                  {selectedTrack.artists?.artist_name ??
                    "Unknown Artist"}
                </span>
              </h3>

              <div className="mt-3 grid grid-cols-2 gap-3 border-y border-white/10 py-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-white/35">
                    Genre
                  </p>
                  <p className="mt-1 text-sm text-white/80">
                    {selectedTrack.genre ??
                      "Unknown Genre"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wide text-white/35">
                    Language
                  </p>
                  <p className="mt-1 text-sm text-white/80">
                    {selectedTrack.language ??
                      "Unknown Language"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wide text-white/35">
                    Duration
                  </p>
                  <p className="mt-1 text-sm text-white/80">
                    {Math.floor(
                      selectedTrack.duration_seconds / 60
                    )}
                    :
                    {String(
                      selectedTrack.duration_seconds % 60
                    ).padStart(2, "0")}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wide text-white/35">
                    CREATION CREDITS
                  </p>
                  <p className="mt-1 break-words text-sm leading-relaxed text-white/80">
  {selectedTrack.ai_creation_type ??
    "Not specified"}
</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-[10px] uppercase tracking-wide text-white/35">
                  Description
                </p>
                <p className="mt-1 break-all text-sm leading-relaxed text-white/70">
                  {selectedTrack.description ||
                    "No description available."}
                </p>
              </div>
            </div>
          </div>
        )}

      <section className="mt-2">
        <div className="mb-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-start sm:gap-2">
          <h2 className="text-lg font-semibold uppercase tracking-wide">
            {title}
          </h2>

          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, artist, genre or language..."
              aria-label="Search tracks"
              className="h-11 w-full rounded-xl border border-white/15 bg-[#071016]/50 px-4 text-xs text-white outline-none placeholder:text-white/35 focus:border-[#0286DC]/50 sm:max-w-[260px]"
            />

            <select
              value={selectedLanguage}
              onChange={(e) =>
                setSelectedLanguage(e.target.value)
              }
              aria-label="Filter by language"
              className="h-11 w-full rounded-xl border border-white/15 bg-[#071016]/50 px-4 text-xs text-white outline-none focus:border-[#0286DC]/50 sm:w-44"
            >
              <option value="" className="bg-white text-black">
                All languages
              </option>

              {languages.map((language) => (
                <option
                  key={language}
                  value={language}
                  className="bg-white text-black"
                >
                  {language}
                </option>
              ))}
            </select>

            <select
              value={selectedGenre}
              onChange={(e) =>
                setSelectedGenre(e.target.value)
              }
              aria-label="Filter by genre"
              className="h-11 w-full rounded-xl border border-white/15 bg-[#071016]/50 px-4 text-xs text-white outline-none focus:border-[#0286DC]/50 sm:w-40"
            >
              <option value="" className="bg-white text-black">
                All genres
              </option>

              {genres.map((genre) => (
                <option
                  key={genre}
                  value={genre}
                  className="bg-white text-black"
                >
                  {genre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredTracks.length === 0 ? (
          <p className="py-10 text-center text-white/50">
            No tracks found.
          </p>
        ) : (
          <div
            className={
              compact
                ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
                : "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
            }
          >
            {filteredTracks.map((item) => (
              <TrackCard
                key={item.id}
                title={item.title}
                artist={
                  item.artists?.artist_name ??
                  "Unknown Artist"
                }
                language={
                  item.language ?? "Unknown Language"
                }
                genre={
                  item.genre ?? "Unknown Genre"
                }
                coverUrl={
                  item.coverSignedUrl ??
                  undefined
                }
                onSelect={() => {
  onSelect(item);
  setTimeout(() => {
    document
      .getElementById("discover-player")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 50);
}}
                isSelected={
                  selectedTrack?.id === item.id
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
