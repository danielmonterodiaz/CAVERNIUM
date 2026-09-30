import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";

type TrackStats = {
  track_id: string;
  average_rating: number | null;
  rating_count: number;
  listen_count: number;
  average_retention: number | null;
};

type ListenStats = {
  track_id: string;
  recent_count: number;
  previous_count: number;
  retention_total: number;
  recency_total: number;
};

type ListenLocationStats = {
  track_id: string;
  country_code: string;
  listen_count: number;
  listener_count: number;
};

type TrackView = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  ratingCount: number;
  avgRating: number | null;
  listenCount: number;
  avgRetention: number | null;
  recentListens: number;
  previousListens: number;
  saveCount: number;
};

const actionLinkClass =
  "font-sans text-xs font-medium uppercase tracking-wider text-[#0286DC] transition hover:text-[#5CCBFF] hover:drop-shadow-[0_0_6px_rgba(2,134,220,0.55)]";

const panelClass =
  "relative overflow-hidden rounded-2xl border border-[#5CCBFF]/15 bg-[#061016]/80 shadow-[0_0_28px_rgba(0,0,0,0.35)] backdrop-blur-sm";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function Sparkline({ values }: { values: number[] }) {
  const safe = values.length ? values : [0, 0];
  const max = Math.max(...safe, 1);
  const min = Math.min(...safe, 0);
  const range = Math.max(max - min, 1);
  const width = 180;
  const height = 44;
  const points = safe
    .map((value, index) => {
      const x = safe.length === 1 ? width / 2 : (index / (safe.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-11 w-full overflow-visible">
      <defs>
        <linearGradient id="caverniumSpark" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#0286DC" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#5CCBFF" stopOpacity="1" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke="url(#caverniumSpark)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {safe.map((value, index) => {
        const x = safe.length === 1 ? width / 2 : (index / (safe.length - 1)) * width;
        const y = height - ((value - min) / range) * (height - 6) - 3;
        return (
          <circle
            key={`${index}-${value}`}
            cx={x}
            cy={y}
            r="2.5"
            fill="#071016"
            stroke="#5CCBFF"
            strokeWidth="1.5"
          />
        );
      })}
    </svg>
  );
}

function MiniBars({ values }: { values: number[] }) {
  const safe = values.length ? values : [0];
  const max = Math.max(...safe, 1);

  return (
    <div className="flex h-14 items-end gap-1.5">
      {safe.map((value, index) => {
        const height = Math.max(10, (value / max) * 100);
        return (
          <div
            key={`${index}-${value}`}
            className="min-w-0 flex-1 rounded-t-sm bg-gradient-to-t from-[#0286DC]/20 via-[#0286DC]/55 to-[#5CCBFF]"
            style={{ height: `${height}%` }}
          />
        );
      })}
    </div>
  );
}

function CompareBars({
  value,
  average,
  suffix = "",
}: {
  value: number | null;
  average: number | null;
  suffix?: string;
}) {
  const current = value ?? 0;
  const base = Math.max(current, average ?? 0, 1);
  const currentWidth = Math.max(5, (current / base) * 100);
  const averageWidth = Math.max(5, ((average ?? 0) / base) * 100);

  return (
    <div className="mt-5 space-y-3">
      <div>
        <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-white/35">
          <span>This track</span>
          <span className="text-white/60">
            {value !== null ? `${Number(value).toFixed(suffix ? 0 : 1)}${suffix}` : "—"}
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/5">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-[#0286DC] to-[#5CCBFF] shadow-[0_0_10px_rgba(92,203,255,0.35)]"
            style={{ width: `${currentWidth}%` }}
          />
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-white/35">
          <span>Artist average</span>
          <span className="text-white/40">
            {average !== null ? `${Number(average).toFixed(suffix ? 0 : 1)}${suffix}` : "—"}
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/5">
          <div
            className="h-2 rounded-full bg-white/25"
            style={{ width: `${averageWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  meta,
  children,
}: {
  label: string;
  value: string;
  meta?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-5">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-[#E8F8FF]">
        {value}
      </p>
      {meta && <p className="mt-1 text-[10px] text-white/30">{meta}</p>}
      {children}
    </div>
  );
}

export default async function Page() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-black px-6 py-16 text-white">
        <div className="mx-auto max-w-5xl">
          <Link href="/login" className={actionLinkClass}>
            Log in
          </Link>
          <h1 className="mt-10 text-3xl font-semibold text-[#E8F8FF]">
            CAVERNIUM PRO
          </h1>
          <p className="mt-4 text-sm text-white/50">
            You need to be logged in to access CAVERNIUM PRO.
          </p>
        </div>
      </main>
    );
  }

  const { data: artist } = await supabase
    .from("artists")
    .select("artist_name")
    .eq("id", user.id)
    .maybeSingle();

  const loggedArtistName = artist?.artist_name ?? "USER";

  const { data: proStatus, error: proStatusError } =
    await supabase.rpc("get_my_pro_status");

  if (proStatusError) {
    return (
      <main className="min-h-screen bg-black px-6 py-16 text-white">
        <div className="mx-auto max-w-5xl">
          <Link href="/profile" className={actionLinkClass}>
            ← Back to Profile
          </Link>
          <p className="mt-10 text-sm text-red-400">
            Unable to verify CAVERNIUM PRO access.
          </p>
        </div>
      </main>
    );
  }

  const isPro = proStatus?.[0]?.is_pro === true;

  if (!isPro) {
    return (
      <main className="min-h-screen bg-black px-6 py-12 text-white">
        <div className="mx-auto max-w-5xl">
          <Link href="/profile" className={actionLinkClass}>
            ← Back to Profile
          </Link>
          <section className="relative mt-10 overflow-hidden rounded-2xl border border-white/15 bg-[#071016]/80 p-8 shadow-[0_0_30px_rgba(0,0,0,0.35)] sm:p-12">
            <img
              src="/icons/LOGO%20CAVERNIUM.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 w-[540px] -translate-x-1/2 -translate-y-1/2 opacity-[0.05]"
            />
            <div className="relative z-10 mx-auto max-w-2xl text-center">
              <p className="text-xs font-medium uppercase tracking-[0.32em] text-[#5CCBFF]">
                PRO ACCESS
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[#E8F8FF]">
                CAVERNIUM PRO
              </h1>
              <div className="mx-auto mt-5 h-px w-20 bg-[#0286DC]/50" />
              <p className="mt-5 text-sm leading-6 text-white/55 sm:text-base">
                Artist analytics are available to PRO artists.
              </p>
              <p className="mt-2 text-xs leading-5 text-white/30">
                Performance, evolution, comparison, audience and saves.
              </p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const { data: tracks, error: tracksError } = await supabase
    .from("tracks")
    .select("id, title, status, created_at")
    .eq("artist_id", user.id)
    .order("created_at", { ascending: false });

  if (tracksError) {
    return (
      <main className="min-h-screen bg-black px-6 py-16 text-white">
        <div className="mx-auto max-w-5xl">
          <Link href="/profile" className={actionLinkClass}>
            ← Back to Profile
          </Link>
          <p className="mt-10 text-sm text-red-400">
            Unable to load your tracks.
          </p>
        </div>
      </main>
    );
  }

  const [statsResult, listenStatsResult, locationStatsResult, saveStatsResult] =
    await Promise.all([
      supabase.rpc("get_track_discovery_stats"),
      supabase.rpc("get_rising_listen_stats"),
      supabase.rpc("get_track_listen_locations"),
      supabase.rpc("get_track_save_counts"),
    ]);

  const statsByTrack = new Map<string, TrackStats>(
    ((statsResult.data ?? []) as TrackStats[]).map((item) => [
      item.track_id,
      item,
    ])
  );

  const listenStatsByTrack = new Map<string, ListenStats>(
    ((listenStatsResult.data ?? []) as ListenStats[]).map((item) => [
      item.track_id,
      item,
    ])
  );

  const saveStatsByTrack = new Map<string, number>(
    (
      (saveStatsResult.data ?? []) as {
        track_id: string;
        save_count: number;
      }[]
    ).map((item) => [item.track_id, item.save_count])
  );

  const locationStatsByTrack = new Map<string, ListenLocationStats[]>(
    ((locationStatsResult.data ?? []) as ListenLocationStats[]).reduce(
      (map, item) => {
        const current = map.get(item.track_id) ?? [];
        current.push(item);
        map.set(item.track_id, current);
        return map;
      },
      new Map<string, ListenLocationStats[]>()
    )
  );

  const artistStats: TrackView[] = (tracks ?? []).map((track) => {
    const stat = statsByTrack.get(track.id);
    const listenStat = listenStatsByTrack.get(track.id);

    return {
      ...track,
      ratingCount: Number(stat?.rating_count ?? 0),
      avgRating:
        stat?.average_rating !== null && stat?.average_rating !== undefined
          ? Number(stat.average_rating)
          : null,
      listenCount: Number(stat?.listen_count ?? 0),
      avgRetention:
        stat?.average_retention !== null && stat?.average_retention !== undefined
          ? Number(stat.average_retention)
          : null,
      recentListens: Number(listenStat?.recent_count ?? 0),
      previousListens: Number(listenStat?.previous_count ?? 0),
      saveCount: Number(saveStatsByTrack.get(track.id) ?? 0),
    };
  });

  const publishedTracks = artistStats.filter((track) => track.status === "new");

  const totalListens = publishedTracks.reduce(
    (sum, track) => sum + track.listenCount,
    0
  );

  const totalRatings = publishedTracks.reduce(
    (sum, track) => sum + track.ratingCount,
    0
  );

  const totalSaves = publishedTracks.reduce(
    (sum, track) => sum + track.saveCount,
    0
  );

  const recentListens = publishedTracks.reduce(
    (sum, track) => sum + track.recentListens,
    0
  );

  const previousListens = publishedTracks.reduce(
    (sum, track) => sum + track.previousListens,
    0
  );

  const evolutionPercent =
    previousListens > 0
      ? ((recentListens - previousListens) / previousListens) * 100
      : null;

  const retentionValues = publishedTracks
    .map((track) => track.avgRetention)
    .filter((value): value is number => value !== null);

  const averageRetention =
    retentionValues.length > 0
      ? retentionValues.reduce((sum, value) => sum + value, 0) /
        retentionValues.length
      : null;

  const comparisonAverageListens =
    publishedTracks.length > 0
      ? totalListens / publishedTracks.length
      : null;

  const comparisonRatingValues = publishedTracks
    .map((track) => track.avgRating)
    .filter((value): value is number => value !== null);

  const comparisonAverageRating =
    comparisonRatingValues.length > 0
      ? comparisonRatingValues.reduce((sum, value) => sum + value, 0) /
        comparisonRatingValues.length
      : null;

  const comparisonRetentionValues = publishedTracks
    .map((track) => track.avgRetention)
    .filter((value): value is number => value !== null);

  const comparisonAverageRetention =
    comparisonRetentionValues.length > 0
      ? comparisonRetentionValues.reduce((sum, value) => sum + value, 0) /
        comparisonRetentionValues.length
      : null;

  const evolutionBars = publishedTracks
    .map((track) => track.recentListens)
    .filter((value) => value >= 0)
    .slice(0, 12);

  const strongestRecentTrack =
    [...publishedTracks].sort((a, b) => b.recentListens - a.recentListens)[0] ?? null;

  const strongestRatedTrack =
    [...publishedTracks]
      .filter((track) => track.avgRating !== null)
      .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))[0] ?? null;

  return (
    <main
      className="min-h-screen bg-black text-white"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.34), rgba(0,0,0,0.58)), url('/backgrounds/cavernium-pro-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-24 h-[680px] w-[680px] -translate-x-1/2 rounded-full bg-[#0286DC]/[0.06] blur-3xl" />
          <div className="absolute -left-44 top-[720px] h-[460px] w-[460px] rounded-full bg-[#5CCBFF]/[0.035] blur-3xl" />
          <div className="absolute -right-44 top-[1280px] h-[520px] w-[520px] rounded-full bg-violet-400/[0.025] blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/profile" className={actionLinkClass}>
              ← Back to Profile
            </Link>

            <span className="ml-1 rounded-lg border border-white/10 bg-white/[0.025] px-3 py-1.5 text-xs text-white/50 backdrop-blur-sm">
              LOGGED AS {loggedArtistName}
            </span>
          </div>

          <section className="relative mt-5 overflow-hidden rounded-[28px] border border-[#5CCBFF]/20 bg-[#061016]/90 shadow-[0_0_60px_rgba(0,0,0,0.5)]">
            <img
              src="/icons/LOGO%20CAVERNIUM.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-[52%] w-[780px] -translate-x-1/2 -translate-y-1/2 opacity-[0.07] sm:w-[980px]"
            />

            <div className="relative z-10 px-6 pb-10 pt-8 sm:px-10 sm:pb-12 sm:pt-10">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="max-w-3xl">
                  <p className="text-xs font-medium uppercase tracking-[0.34em] text-[#5CCBFF]">
                    ARTIST ANALYTICS
                  </p>
                  <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#E8F8FF] sm:text-5xl">
                    CAVERNIUM PRO
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
                    REAL LISTENERS · REAL FEEDBACK · REAL OPPORTUNITIES
                  </p>
                </div>

                <div className="rounded-full border border-[#5CCBFF]/20 bg-black/30 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.22em] text-[#5CCBFF]">
                  PRO ACTIVE
                </div>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <MetricCard label="Published Tracks" value={formatNumber(publishedTracks.length)} />
                <MetricCard label="Total Listens" value={formatNumber(totalListens)} />
                <MetricCard label="Ratings" value={formatNumber(totalRatings)} />
                <MetricCard
                  label="Avg. Retention"
                  value={averageRetention !== null ? `${Math.round(averageRetention)}%` : "—"}
                />
                <MetricCard label="Saves" value={formatNumber(totalSaves)} />
              </div>
            </div>
          </section>

          <section className={`${panelClass} mt-8`}>
            <img
              src="/icons/LOGO%20CAVERNIUM.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 w-[640px] -translate-x-1/2 -translate-y-1/2 opacity-[0.035]"
            />

            <div className="relative z-10 p-6 sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#5CCBFF]">
                    YOUR EVOLUTION
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#E8F8FF]">
                    Recent listening activity
                  </h2>
                </div>
                <p className="text-xs text-white/35">
                  Last 14 days vs. previous 14 days
                </p>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1.55fr_1.55fr_1fr]">
                <MetricCard
                  label="Recent Listens"
                  value={formatNumber(recentListens)}
                  meta="Last 14 days"
                >
                  <div className="mt-4">
                    <MiniBars values={evolutionBars.length ? evolutionBars : [0, 0, 0, 0, 0]} />
                  </div>
                </MetricCard>

                <MetricCard
                  label="Previous Period"
                  value={formatNumber(previousListens)}
                  meta="Previous 14 days"
                >
                  <div className="mt-4">
                    <MiniBars
                      values={
                        publishedTracks.length
                          ? publishedTracks
                              .map((track) => track.previousListens)
                              .slice(0, 12)
                          : [0, 0, 0, 0, 0]
                      }
                    />
                  </div>
                </MetricCard>

                <MetricCard
                  label="Change"
                  value={
                    evolutionPercent !== null
                      ? `${evolutionPercent >= 0 ? "+" : ""}${Math.round(evolutionPercent)}%`
                      : "—"
                  }
                  meta="Recent vs. previous"
                />
              </div>

              <div className="mt-8 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
                <div className="rounded-xl border border-white/10 bg-black/20 p-5">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
                        LISTEN ACTIVITY
                      </p>
                      <p className="mt-1 text-sm text-white/55">
                        Published tracks by recent listening volume.
                      </p>
                    </div>
                    {strongestRecentTrack && (
                      <p className="text-[10px] uppercase tracking-wider text-white/30">
                        Most recent activity: {strongestRecentTrack.title}
                      </p>
                    )}
                  </div>
                  <div className="mt-5">
                    <MiniBars values={evolutionBars.length ? evolutionBars : [0, 0, 0, 0, 0, 0]} />
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
                    MOMENTUM
                  </p>
                  <p className="mt-1 text-sm text-white/55">
                    Current listening movement across your catalog.
                  </p>
                  <div className="mt-4">
                    <Sparkline
                      values={[
                        previousListens,
                        Math.round((previousListens + recentListens) / 2),
                        recentListens,
                      ]}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-wider text-white/30">
                    <span>Previous</span>
                    <span>Recent</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-black/15">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] uppercase tracking-wider text-white/35">
                        <th className="px-4 py-3 font-medium">Track</th>
                        <th className="px-4 py-3 text-right font-medium">Recent</th>
                        <th className="px-4 py-3 text-right font-medium">Previous</th>
                        <th className="px-4 py-3 text-right font-medium">Change</th>
                        <th className="px-4 py-3 text-right font-medium">Rating</th>
                        <th className="px-4 py-3 text-right font-medium">Retention</th>
                      </tr>
                    </thead>
                    <tbody>
                      {publishedTracks.map((track) => {
                        const change =
                          track.previousListens > 0
                            ? ((track.recentListens - track.previousListens) /
                                track.previousListens) *
                              100
                            : null;

                        return (
                          <tr
                            key={`evolution-${track.id}`}
                            className="border-b border-white/5 last:border-b-0"
                          >
                            <td className="px-4 py-4 text-sm font-medium text-[#E8F8FF]">
                              {track.title}
                            </td>
                            <td className="px-4 py-4 text-right text-sm text-white/60">
                              {track.recentListens}
                            </td>
                            <td className="px-4 py-4 text-right text-sm text-white/45">
                              {track.previousListens}
                            </td>
                            <td className="px-4 py-4 text-right text-sm text-[#5CCBFF]">
                              {change !== null
                                ? `${change >= 0 ? "+" : ""}${Math.round(change)}%`
                                : "—"}
                            </td>
                            <td className="px-4 py-4 text-right text-sm text-white/60">
                              {track.avgRating !== null
                                ? `${track.avgRating.toFixed(1)}/10`
                                : "—"}
                            </td>
                            <td className="px-4 py-4 text-right text-sm text-white/60">
                              {track.avgRetention !== null
                                ? `${Math.round(track.avgRetention)}%`
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          <section className={`${panelClass} mt-8`}>
            <div className="relative z-10 p-6 sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#5CCBFF]">
                    YOUR TRACKS
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#E8F8FF]">
                    Published music
                  </h2>
                </div>
                <p className="text-xs text-white/35">Current aggregate data</p>
              </div>

              {publishedTracks.length === 0 ? (
                <p className="mt-8 text-sm text-white/45">
                  You do not have any published tracks yet.
                </p>
              ) : (
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full min-w-[920px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/35">
                        <th className="px-4 py-3 font-medium">Track</th>
                        <th className="px-4 py-3 text-right font-medium">Listens</th>
                        <th className="px-4 py-3 text-right font-medium">Ratings</th>
                        <th className="px-4 py-3 text-right font-medium">Avg. Rating</th>
                        <th className="px-4 py-3 text-right font-medium">Retention</th>
                        <th className="w-48 px-4 py-3 font-medium">Activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {publishedTracks.map((track) => (
                        <tr
                          key={`performance-${track.id}`}
                          className="border-b border-white/5 last:border-b-0"
                        >
                          <td className="px-4 py-4 text-sm font-medium text-[#E8F8FF]">
                            {track.title}
                          </td>
                          <td className="px-4 py-4 text-right text-sm text-white/60">
                            {formatNumber(track.listenCount)}
                          </td>
                          <td className="px-4 py-4 text-right text-sm text-white/60">
                            {formatNumber(track.ratingCount)}
                          </td>
                          <td className="px-4 py-4 text-right text-sm text-white/60">
                            {track.avgRating !== null ? `${track.avgRating.toFixed(1)}/10` : "—"}
                          </td>
                          <td className="px-4 py-4 text-right text-sm text-white/60">
                            {track.avgRetention !== null ? `${Math.round(track.avgRetention)}%` : "—"}
                          </td>
                          <td className="px-4 py-4">
                            <Sparkline values={[track.previousListens, track.recentListens]} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section className={`${panelClass} mt-8`}>
            <div className="relative z-10 p-6 sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#5CCBFF]">
                    TRACK VS. ARTIST AVERAGE
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#E8F8FF]">
                    Compare your catalog
                  </h2>
                </div>
                <p className="text-xs text-white/35">Published tracks only</p>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
                Compare each published track with the average values across your published catalog.
              </p>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-white/35">
                        PLAYS
                      </p>
                      <p className="mt-1 text-lg font-semibold text-[#E8F8FF]">
                        Catalog activity
                      </p>
                    </div>
                    <span className="rounded-full border border-[#5CCBFF]/20 px-2 py-1 text-[9px] uppercase tracking-wider text-[#5CCBFF]">
                      Live
                    </span>
                  </div>
                  <CompareBars
                    value={strongestRecentTrack?.recentListens ?? null}
                    average={
                      publishedTracks.length
                        ? publishedTracks.reduce((sum, track) => sum + track.recentListens, 0) /
                          publishedTracks.length
                        : null
                    }
                  />
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-white/35">
                        RATINGS
                      </p>
                      <p className="mt-1 text-lg font-semibold text-[#E8F8FF]">
                        Critical signal
                      </p>
                    </div>
                    <span className="rounded-full border border-[#5CCBFF]/20 px-2 py-1 text-[9px] uppercase tracking-wider text-[#5CCBFF]">
                      /10
                    </span>
                  </div>
                  <CompareBars
                    value={strongestRatedTrack?.avgRating ?? null}
                    average={comparisonAverageRating}
                    suffix="/10"
                  />
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-white/35">
                        RETENTION
                      </p>
                      <p className="mt-1 text-lg font-semibold text-[#E8F8FF]">
                        Listener hold
                      </p>
                    </div>
                    <span className="rounded-full border border-[#5CCBFF]/20 px-2 py-1 text-[9px] uppercase tracking-wider text-[#5CCBFF]">
                      %
                    </span>
                  </div>
                  <CompareBars
                    value={strongestRecentTrack?.avgRetention ?? null}
                    average={comparisonAverageRetention}
                    suffix="%"
                  />
                </div>
              </div>

              {publishedTracks.length > 0 && (
                <div className="mt-8 overflow-x-auto rounded-xl border border-white/10 bg-black/15">
                  <table className="w-full min-w-[840px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] uppercase tracking-wider text-white/35">
                        <th className="px-4 py-3 font-medium">Track</th>
                        <th className="px-4 py-3 text-right font-medium">Listens vs. avg.</th>
                        <th className="px-4 py-3 text-right font-medium">Rating vs. avg.</th>
                        <th className="px-4 py-3 text-right font-medium">Retention vs. avg.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {publishedTracks.map((track) => {
                        const listenDelta =
                          comparisonAverageListens !== null
                            ? track.listenCount - comparisonAverageListens
                            : null;
                        const ratingDelta =
                          comparisonAverageRating !== null && track.avgRating !== null
                            ? track.avgRating - comparisonAverageRating
                            : null;
                        const retentionDelta =
                          comparisonAverageRetention !== null && track.avgRetention !== null
                            ? track.avgRetention - comparisonAverageRetention
                            : null;

                        return (
                          <tr
                            key={`comparison-${track.id}`}
                            className="border-b border-white/5 last:border-b-0"
                          >
                            <td className="px-4 py-4 text-sm font-medium text-[#E8F8FF]">
                              {track.title}
                            </td>
                            <td className="px-4 py-4 text-right text-sm text-white/60">
                              {listenDelta !== null
                                ? `${listenDelta >= 0 ? "+" : ""}${listenDelta.toFixed(1)}`
                                : "—"}
                            </td>
                            <td className="px-4 py-4 text-right text-sm text-white/60">
                              {ratingDelta !== null
                                ? `${ratingDelta >= 0 ? "+" : ""}${ratingDelta.toFixed(1)}`
                                : "—"}
                            </td>
                            <td className="px-4 py-4 text-right text-sm text-white/60">
                              {retentionDelta !== null
                                ? `${retentionDelta >= 0 ? "+" : ""}${Math.round(retentionDelta)} pp`
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section className="mt-8 grid gap-8 lg:grid-cols-2">
            <div className={panelClass}>
              <div className="relative z-10 p-6 sm:p-8">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#5CCBFF]">
                      AUDIENCE
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-[#E8F8FF]">
                      Listening locations
                    </h2>
                  </div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30">
                    Country-level
                  </p>
                </div>

                <p className="mt-3 text-sm leading-6 text-white/45">
                  Countries are shown only when the track has listening activity from at least three unique listeners.
                </p>

                <div className="mt-6 space-y-3">
                  {publishedTracks.flatMap((track) =>
                    (locationStatsByTrack.get(track.id) ?? []).map((location) => (
                      <div
                        key={`location-${track.id}-${location.country_code}`}
                        className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#E8F8FF]">
                            {track.title}
                          </p>
                          <p className="mt-1 text-[10px] uppercase tracking-wider text-white/35">
                            {location.country_code}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-white/70">
                            {location.listener_count} listeners
                          </p>
                          <p className="mt-1 text-[10px] text-white/35">
                            {location.listen_count} listens
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {publishedTracks.every(
                  (track) => (locationStatsByTrack.get(track.id) ?? []).length === 0
                ) && (
                  <p className="mt-6 text-sm text-white/45">
                    Not enough listening data yet to display audience locations.
                  </p>
                )}
              </div>
            </div>

            <div className={panelClass}>
              <div className="relative z-10 p-6 sm:p-8">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#5CCBFF]">
                      SAVES
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-[#E8F8FF]">
                      Listener saves
                    </h2>
                  </div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30">
                    Other users
                  </p>
                </div>

                <p className="mt-3 text-sm leading-6 text-white/45">
                  Saves made by other users on your published tracks.
                </p>

                <div className="mt-6 space-y-3">
                  {publishedTracks.map((track) => (
                    <div
                      key={`save-${track.id}`}
                      className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#E8F8FF]">
                          {track.title}
                        </p>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#0286DC] to-[#5CCBFF]"
                            style={{
                              width: `${
                                totalSaves > 0
                                  ? Math.max(4, (track.saveCount / totalSaves) * 100)
                                  : 4
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                      <p className="shrink-0 text-2xl font-semibold text-[#E8F8FF]">
                        {track.saveCount}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <footer className="py-10 text-center text-[10px] uppercase tracking-[0.24em] text-white/20">
            CAVERNIUM · WHAT DESERVES TO BE HEARD
          </footer>
        </div>
      </div>
    </main>
  );
}
