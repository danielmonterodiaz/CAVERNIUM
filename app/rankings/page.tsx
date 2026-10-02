import Link from "next/link";
import RankingsClient from "@/app/components/RankingsClient";
import { createClient } from "@/lib/supabase/server";
import MobileNav from "@/app/components/MobileNav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Music Rankings — CAVERNIUM",
  description:
    "Explore the highest rated music created or transformed with AI on CAVERNIUM.",
  alternates: {
    canonical: "https://cavernium.com/rankings",
  },
  openGraph: {
    title: "AI Music Rankings — CAVERNIUM",
    description:
      "Explore the highest rated music created or transformed with AI on CAVERNIUM.",
    url: "https://cavernium.com/rankings",
    siteName: "CAVERNIUM",
    type: "website",
  },
};

export default async function Rankings() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let loggedArtistName: string | null = null;

  if (user) {
    const { data: loggedArtist } = await supabase
      .from("artists")
      .select("artist_name")
      .eq("id", user.id)
      .maybeSingle();

    loggedArtistName = loggedArtist?.artist_name ?? null;
  }

  const { data: tracks, error } = await supabase
    .from("tracks")
    .select(`
      id,
      title,
      description,
      genre,
      duration_seconds,
      cover_url,
      audio_url,
      artist_id
    `)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return (
      <main className="min-h-screen bg-black p-10 text-white">
        <h1 className="text-3xl font-semibold">Rankings</h1>
        <p className="mt-4 text-red-400">Supabase error: {error.message}</p>
      </main>
    );
  }

  const artistIds = Array.from(
    new Set((tracks ?? []).map((track) => track.artist_id).filter(Boolean))
  );

  const { data: artists, error: artistsError } = await supabase
    .from("artists")
    .select("id, artist_name")
    .in("id", artistIds);

  if (artistsError) {
    return (
      <main className="min-h-screen bg-black p-10 text-white">
        <h1 className="text-3xl font-semibold">Rankings</h1>
        <p className="mt-4 text-red-400">
          Artists query error: {artistsError.message}
        </p>
      </main>
    );
  }

  const artistNameById = new Map(
    (artists ?? []).map((artist) => [artist.id, artist.artist_name])
  );

  const { data: ratings, error: ratingsError } = await supabase
    .from("ratings")
    .select("track_id, score")
    .limit(1000);

  if (ratingsError) {
    return (
      <main className="min-h-screen bg-black p-10 text-white">
        <h1 className="text-3xl font-semibold">Rankings</h1>
        <p className="mt-4 text-red-400">
          Ratings query error: {ratingsError.message}
        </p>
      </main>
    );
  }

  const ratingStats = new Map<string, { total: number; count: number }>();

  for (const rating of ratings ?? []) {
    const current = ratingStats.get(rating.track_id) ?? {
      total: 0,
      count: 0,
    };

    current.total += Number(rating.score);
    current.count += 1;

    ratingStats.set(rating.track_id, current);
  }

  const rankedTracks = (tracks ?? [])
    .filter((track) => ratingStats.has(track.id))
    .sort((a, b) => {
      const aStats = ratingStats.get(a.id)!;
      const bStats = ratingStats.get(b.id)!;

      const aAverage = aStats.total / aStats.count;
      const bAverage = bStats.total / bStats.count;

      if (bAverage !== aAverage) {
        return bAverage - aAverage;
      }

      return bStats.count - aStats.count;
    });


  const coverPaths = [
    ...new Set(
      rankedTracks
        .map((track) => track.cover_url)
        .filter((path): path is string => Boolean(path))
    ),
  ];

  const { data: signedCoverData } = coverPaths.length
    ? await supabase.storage
        .from("covers")
        .createSignedUrls(coverPaths, 3600)
    : { data: [] };

  const signedCoverUrlByPath = new Map(
    (signedCoverData ?? []).map((item) => [item.path, item.signedUrl])
  );

  const audioPaths = [
    ...new Set(
      rankedTracks
        .map((track) => track.audio_url)
        .filter((path): path is string => Boolean(path))
    ),
  ];

  const { data: signedAudioData } = audioPaths.length
    ? await supabase.storage
        .from("tracks")
        .createSignedUrls(audioPaths, 3600)
    : { data: [] };

  const signedAudioUrlByPath = new Map(
    (signedAudioData ?? []).map((item) => [item.path, item.signedUrl])
  );

  const rankingTracks = rankedTracks.map((track) => {
    const stats = ratingStats.get(track.id)!;

    return {
      id: track.id,
      title: track.title,
      description: track.description,
      genre: track.genre,
      audioSignedUrl: track.audio_url
        ? signedAudioUrlByPath.get(track.audio_url) ?? null
        : null,
      duration_seconds: track.duration_seconds,
      coverSignedUrl: track.cover_url
        ? signedCoverUrlByPath.get(track.cover_url) ?? null
        : null,
      artistName: artistNameById.get(track.artist_id) ?? "Unknown artist",
      average: stats.total / stats.count,
      ratingCount: stats.count,
    };
  });

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <img
          src="/backgrounds/cavernium-pro-bg.png"
          alt=""
          aria-hidden="true"
          className="h-full w-full scale-[1.16] object-cover object-center opacity-[0.30]"
        />
        <div className="absolute inset-0 bg-black/48" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(2,134,220,0.08),transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-0">
        <header className="mb-8 border-b border-white/10 pb-2">
          <div className="flex items-center">
            <Link href="/" className="shrink-0">
              <img
                src="/icons/LOGO%20CAVERNIUM.png"
                alt="CAVERNIUM"
                className="h-auto w-36"
              />
            </Link>

            <div className="mx-0 h-10 w-px bg-white/20" />

            <nav className="ml-5 hidden items-center gap-7 text-sm text-white/60 md:flex">
              <Link href="/" className="transition hover:text-white">
                Home
              </Link>
              <Link href="/discover" className="transition hover:text-white">
                Discover
              </Link>
              <Link
                href="/rankings"
                className="text-white transition hover:text-white"
              >
                Rankings
              </Link>
              <Link href="/artists" className="transition hover:text-white">
                Artists
              </Link>

              {user && (
                <span className="ml-1 rounded-lg border border-white/10 bg-white/[0.025] px-3 py-1.5 text-xs text-white/50 backdrop-blur-sm">
                  LOGGED AS {loggedArtistName ?? "USER"}
                </span>
              )}
            </nav>
            <MobileNav
  isLoggedIn={!!user}
  loggedArtistName={loggedArtistName}
/>

            <div className="ml-auto hidden text-xs tracking-widest text-white/40 md:block">
              LISTEN · RATE · DISCOVER
            </div>
          </div>
        </header>

        <section className="relative pt-3">
          <img
            src="/images/cavernium-rankings-placeholder.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[-120px] z-0 w-[900px] -translate-x-1/2 opacity-[0.30]"
          />

          <div className="relative z-10 text-center">
            <h1 className="text-2xl font-bold uppercase tracking-tight text-white">
  Rankings
</h1>

            <p className="mt-2 text-sm text-white/50">
  The highest rated music created or transformed with AI on CAVERNIUM.
</p>
          </div>

          <div className="mt-6">
            <RankingsClient tracks={rankingTracks} />
          </div>
        </section>
      </div>
    </main>
  );
}
