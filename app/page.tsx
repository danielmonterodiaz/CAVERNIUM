import type { Metadata } from "next";
import HomeClient from "@/app/components/HomeClient";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import LogoutButton from "@/app/components/LogoutButton";
import UploadGateButton from "@/app/components/UploadGateButton";
import MobileNav from "@/app/components/MobileNav";

export const metadata: Metadata = {
  title: "CAVERNIUM — AI Music Discovery",
  description:
    "Discover music created or transformed with AI. Explore emerging artists, new releases and hidden gems on CAVERNIUM.",
  alternates: {
    canonical: "https://cavernium.com",
  },
  openGraph: {
    title: "CAVERNIUM — AI Music Discovery",
    description:
      "Discover music created or transformed with AI. Explore emerging artists, new releases and hidden gems on CAVERNIUM.",
    url: "https://cavernium.com",
    siteName: "CAVERNIUM",
    type: "website",
  },
};

export default async function Home() {
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

  const { data: tracks, error: tracksError } = await supabase
    .from("tracks")
    .select(`
      *,
      artists (
        artist_name
      )
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  if (tracksError || !tracks?.length) {
    return (
      <main className="min-h-screen bg-black p-10 text-white">
        <h1 className="text-4xl font-bold">CAVERNIUM</h1>
        <p className="mt-6 text-red-400">
          No se pudo cargar el track.
        </p>
        <p className="mt-2 text-white/50">
          {tracksError?.message ?? "No hay tracks disponibles."}
        </p>
      </main>
    );
  }

  const coverPaths = [
    ...new Set(
      tracks
        .map((track) => track.cover_url)
        .filter((path): path is string => Boolean(path))
    ),
  ];

  const { data: signedCoverData } = coverPaths.length
    ? await supabase.storage.from("covers").createSignedUrls(coverPaths, 3600)
    : { data: [] };

  const signedCoverUrlByPath = new Map(
    (signedCoverData ?? []).map((item) => [item.path, item.signedUrl])
  );

  const tracksWithCovers = tracks.map((item) => ({
    ...item,
    coverSignedUrl: item.cover_url
      ? signedCoverUrlByPath.get(item.cover_url) ?? null
      : null,
  }));

  const [
    { data: discoveryStats, error: discoveryStatsError },
    { data: publicRisingStats, error: publicRisingStatsError },
  ] = await Promise.all([
    supabase.rpc("get_track_discovery_stats"),
    supabase.rpc("get_rising_listen_stats"),
  ]);

  if (discoveryStatsError) {
    return (
      <main className="min-h-screen bg-black p-10 text-white">
        <h1 className="text-4xl font-bold">CAVERNIUM</h1>
        <p className="mt-6 text-red-400">
          No se pudieron cargar las estadísticas.
        </p>
        <p className="mt-2 text-white/50">
          {discoveryStatsError.message}
        </p>
      </main>
    );
  }

  if (publicRisingStatsError) {
    return (
      <main className="min-h-screen bg-black p-10 text-white">
        <h1 className="text-4xl font-bold">CAVERNIUM</h1>
        <p className="mt-6 text-red-400">
          No se pudieron cargar las estadísticas de Rising.
        </p>
        <p className="mt-2 text-white/50">
          {publicRisingStatsError.message}
        </p>
      </main>
    );
  }

  const averageRatingByTrack = new Map<string, number>();
  const ratingCountByTrack = new Map<string, number>();
  const listenCountByTrack = new Map<string, number>();
  const averageRetentionByTrack = new Map<string, number>();

  for (const stats of discoveryStats ?? []) {
    averageRatingByTrack.set(
      stats.track_id,
      Number(stats.average_rating)
    );

    ratingCountByTrack.set(
      stats.track_id,
      Number(stats.rating_count)
    );

    listenCountByTrack.set(
      stats.track_id,
      Number(stats.listen_count)
    );

    averageRetentionByTrack.set(
      stats.track_id,
      Number(stats.average_retention)
    );
  }

  const recentListenScoreByTrack = new Map<string, number>();

  /*
   * RISING
   *
   * Rising detects songs that are showing recent activity.
   * A song with recent momentum takes priority over Hidden Gems,
   * so the same track does not appear in both sections.
   */

  for (const stats of publicRisingStats ?? []) {
    const recentCount = Number(stats.recent_count);
    const previousCount = Number(stats.previous_count);
    const totalCount = recentCount + previousCount;

    const recentRate =
      recentCount / 3;

    const previousRate =
      previousCount / 11;

    if (recentCount <= 0) continue;

    if (
      previousCount > 0 &&
      recentRate <= previousRate
    ) continue;

    const recentRateShare =
      recentRate /
      Math.max(0.0001, recentRate + previousRate);

    const evidenceConfidence =
      totalCount / (totalCount + 5);

    const growthScore =
      recentRateShare * evidenceConfidence;

    const emergingBonus =
      1 /
      Math.sqrt(
        Math.max(1, totalCount / 3)
      );

    const averageRecency =
      Number(stats.recency_total) / totalCount;

    const averageRetention =
      Number(stats.retention_total) / totalCount;

    const score =
      growthScore * 0.55 +
      averageRecency * 0.20 +
      averageRetention * 0.15 +
      emergingBonus * 0.10;

    recentListenScoreByTrack.set(
      stats.track_id,
      score
    );
  }

  const risingTracks = tracksWithCovers
    .filter((track) =>
      recentListenScoreByTrack.has(track.id)
    )
    .sort((a, b) => {
      const aScore =
        recentListenScoreByTrack.get(a.id) ?? 0;

      const bScore =
        recentListenScoreByTrack.get(b.id) ?? 0;

      return bScore - aScore;
    })
    .slice(0, 4);

  const deservesScoreByTrack =
    new Map<string, number>();

  const maxRisingScore = Math.max(
    ...Array.from(
      recentListenScoreByTrack.values()
    ),
    1
  );

  for (const track of tracksWithCovers) {
    const rating =
      averageRatingByTrack.get(track.id) ?? 0;

    const ratingScore =
      rating / 10;

    const retentionScore =
      (averageRetentionByTrack.get(track.id) ?? 0) /
      100;

    const risingScore =
      (recentListenScoreByTrack.get(track.id) ?? 0) /
      maxRisingScore;

    const listenEvidence =
      Math.min(
        1,
        Math.sqrt(
          (listenCountByTrack.get(track.id) ?? 0) /
          10
        )
      );

    const ratingEvidence =
      Math.min(
        1,
        Math.sqrt(
          (ratingCountByTrack.get(track.id) ?? 0) /
          5
        )
      );

    const evidenceScore =
      listenEvidence * 0.6 +
      ratingEvidence * 0.4;

    const score =
      ratingScore * 0.70 +
      evidenceScore * 0.15 +
      retentionScore * 0.10 +
      risingScore * 0.05;

    deservesScoreByTrack.set(
      track.id,
      score
    );
  }

  const deservesPrimaryTracks =
    tracksWithCovers
      .filter((track) => {
        const rating =
          averageRatingByTrack.get(track.id);

        return (
          rating !== undefined &&
          rating >= 7
        );
      })
      .sort((a, b) => {
        const aScore =
          deservesScoreByTrack.get(a.id) ?? 0;

        const bScore =
          deservesScoreByTrack.get(b.id) ?? 0;

        return bScore - aScore;
      });

  const featuredTracks =
    deservesPrimaryTracks.slice(0, 5);

  const featuredTrackIds = new Set(
    featuredTracks.map((track) => track.id)
  );

  const risingTrackIds = new Set(
    risingTracks.map((track) => track.id)
  );

  const hiddenGemEligibleTrackIds = new Set(
    tracksWithCovers
      .filter((track) => {
        const rating =
          averageRatingByTrack.get(track.id);

        return (
          rating !== undefined &&
          rating >= 7 &&
          (listenCountByTrack.get(track.id) ?? 0) <= 5 &&
          !recentListenScoreByTrack.has(track.id) &&
          !featuredTrackIds.has(track.id)
        );
      })
      .map((track) => track.id)
  );

  const hiddenGemCandidates = tracksWithCovers
    .filter((track) =>
      hiddenGemEligibleTrackIds.has(track.id)
    )
    .sort((a, b) => {
      const aRating =
        averageRatingByTrack.get(a.id) ?? 0;

      const bRating =
        averageRatingByTrack.get(b.id) ?? 0;

      if (bRating !== aRating) {
        return bRating - aRating;
      }

      const aListens =
        listenCountByTrack.get(a.id) ?? 0;

      const bListens =
        listenCountByTrack.get(b.id) ?? 0;

      return aListens - bListens;
    });

  const hiddenGemFallbackCandidates =
    tracksWithCovers
      .filter((track) => {
        const rating =
          averageRatingByTrack.get(track.id);

        const listenCount =
          listenCountByTrack.get(track.id) ?? 0;

        const ratingCount =
          ratingCountByTrack.get(track.id) ?? 0;

        return (
          (ratingCount === 0 || (rating !== undefined && rating >= 7)) &&
          listenCount >= 1 &&
          listenCount <= 5 &&
          !featuredTrackIds.has(track.id) &&
          !risingTrackIds.has(track.id)
        );
      })
      .sort((a, b) => {
        const aRating =
          averageRatingByTrack.get(a.id) ?? 0;

        const bRating =
          averageRatingByTrack.get(b.id) ?? 0;

        if (bRating !== aRating) {
          return bRating - aRating;
        }

        const aListens =
          listenCountByTrack.get(a.id) ?? 0;

        const bListens =
          listenCountByTrack.get(b.id) ?? 0;

        return aListens - bListens;
      });

  const hiddenGemTracks: typeof tracksWithCovers = [];
  const hiddenGemKeys = new Set<string>();

  for (const track of [
    ...hiddenGemCandidates,
    ...hiddenGemFallbackCandidates,
  ]) {
    const key = `${track.title}::${track.artists?.artist_name ?? ""}`;

    if (hiddenGemKeys.has(key)) continue;

    hiddenGemKeys.add(key);
    hiddenGemTracks.push(track);

    if (hiddenGemTracks.length === 4) break;
  }

  const newTracks = tracksWithCovers
    .filter((track) => {
      const ageDays =
        (Date.now() - new Date(track.created_at).getTime()) /
        (1000 * 60 * 60 * 24);

      return (
        ageDays <= 30 &&
        track.coverSignedUrl &&
        !featuredTrackIds.has(track.id) &&
        !risingTrackIds.has(track.id) &&
        !hiddenGemTracks.some((item) => item.id === track.id)
      );
    })
    .slice(0, 16);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <img
          src="/backgrounds/cavernium-pro-bg.png"
          alt=""
          aria-hidden="true"
          className="h-full w-full scale-[1.16] object-cover object-center opacity-[0.36]"
        />
        <div className="absolute inset-0 bg-black/44" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(2,134,220,0.08),transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-0">
        <div className="relative z-50 bg-gradient-to-b from-black/70 via-black/25 to-transparent">
          <header className="relative mb-4 flex items-center border-b border-white/5 bg-transparent pb-0 backdrop-blur-[2px]">
            <div className="flex shrink-0 items-start">
              <img
                src="/icons/LOGO%20CAVERNIUM.png"
                alt="CAVERNIUM"
                className="w-36 h-auto md:w-56"
              />
              <div className="mx-0 h-12 w-px bg-white/20" />
            </div>

            <div className="flex min-w-0 lg:-translate-x-12 flex-col">
              <nav className="hidden items-center gap-7 whitespace-nowrap text-sm text-white/60 md:flex">
                <span className="text-white">
                  Home
                </span>

                <Link
                  href="/discover"
                  className="transition hover:text-white"
                >
                  Discover
                </Link>

                <Link
                  href="/rankings"
                  className="transition hover:text-white"
                >
                  Rankings
                </Link>

                <Link
                  href="/artists"
                  className="transition hover:text-white"
                >
                  Artists
                </Link>

                <UploadGateButton isLoggedIn={!!user} />

                {user ? (
                  <>
                    <span className="-ml-6 translate-x-2 rounded-lg border border-white/10 bg-white/[0.025] px-3 py-1.5 text-xs text-white/50 backdrop-blur-sm">
                      LOGGED AS {loggedArtistName ?? "USER"}
                    </span>

                    <div className="-mr-4 flex items-center gap-6">
                      <Link href="/profile" className="hover:text-white">
                        My Profile
                      </Link>

                      <LogoutButton />
                    </div>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="hover:text-white">
                      Log in
                    </Link>

                    <Link href="/signup" className="hover:text-white">
                      Sign up
                    </Link>
                  </>
                )}
              </nav>

              <p className="mt-2 text-xs tracking-widest text-white/40">
                LISTEN · RATE · DISCOVER
              </p>
            </div>

            <MobileNav
              isLoggedIn={!!user}
              loggedArtistName={loggedArtistName}
            />

            <div
              id="player-slot"
              className="absolute left-0 top-full z-0 w-full lg:left-auto lg:right-0 lg:top-0 lg:w-[380px] lg:translate-x-14"
            />
          </header>

          <div className="h-[320px] md:hidden" />

          <style>{`
            @keyframes caverniumSectionGlow {
              0%, 76%, 100% {
                text-shadow: 0 0 0 rgba(92, 203, 255, 0);
              }

              84%, 92% {
                text-shadow:
                  0 0 5px rgba(92, 203, 255, 0.65),
                  0 0 12px rgba(92, 203, 255, 0.35);
              }
            }

            .cavernium-section-glow {
              animation: caverniumSectionGlow 4.8s ease-in-out infinite;
            }
          `}</style>

          <div className="mb-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pb-5 text-sm tracking-[0.18em] text-white/40 lg:-translate-x-20">
            <span className="text-white/70">EXPLORE</span>

            <a
              href="#what-deserves"
              className="cavernium-section-glow transition hover:text-white"
              style={{ animationDelay: "0s" }}
            >
              WHAT DESERVES TO BE HEARD
            </a>

            <a
              href="#rising"
              className="cavernium-section-glow transition hover:text-white"
              style={{ animationDelay: "1.2s" }}
            >
              RISING
            </a>

            <a
              href="#hidden-gems"
              className="cavernium-section-glow transition hover:text-white"
              style={{ animationDelay: "2.4s" }}
            >
              HIDDEN GEMS
            </a>

            <a
              href="#new"
              className="cavernium-section-glow transition hover:text-white"
              style={{ animationDelay: "3.6s" }}
            >
              NEW
            </a>
          </div>
        </div>

        <HomeClient
          tracks={tracksWithCovers}
          featuredTracks={featuredTracks}
          risingTracks={risingTracks}
          newTracks={newTracks}
          hiddenGemTracks={hiddenGemTracks}
        />
      </div>
    </main>
  );
}