import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import MobileNav from "@/app/components/MobileNav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Artists — CAVERNIUM",
  description:
    "Discover independent artists creating or transforming music with AI on CAVERNIUM.",
  alternates: {
    canonical: "https://cavernium.com/artists",
  },
  openGraph: {
    title: "AI Artists — CAVERNIUM",
    description:
      "Discover independent artists creating or transforming music with AI on CAVERNIUM.",
    url: "https://cavernium.com/artists",
    siteName: "CAVERNIUM",
    type: "website",
  },
};

export default async function Artists() {
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
      id,
      title,
      cover_url,
      artist_id
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  if (tracksError) {
    return (
      <main className="min-h-screen bg-black p-10 text-white">
        <h1 className="text-4xl font-bold">CAVERNIUM</h1>
        <p className="mt-6 text-red-400">
          Unable to load artists.
        </p>
        <p className="mt-2 text-white/50">
          {tracksError.message}
        </p>
      </main>
    );
  }

  const artistIds = Array.from(
    new Set(
      (tracks ?? [])
        .map((track) => track.artist_id)
        .filter(Boolean)
    )
  );

  const { data: artistsData, error: artistsError } =
    artistIds.length > 0
      ? await supabase
          .from("artists")
          .select("id, artist_name, cover_url")
          .in("id", artistIds)
      : { data: [], error: null };

  if (artistsError) {
    return (
      <main className="min-h-screen bg-black p-10 text-white">
        <h1 className="text-4xl font-bold">CAVERNIUM</h1>
        <p className="mt-6 text-red-400">
          Unable to load artists.
        </p>
        <p className="mt-2 text-white/50">
          {artistsError.message}
        </p>
      </main>
    );
  }

  const artistById = new Map(
    (artistsData ?? []).map((artist) => [
      artist.id,
      artist,
    ])
  );

  const artistMap = new Map<
    string,
    {
      id: string;
      name: string;
      trackCount: number;
      coverUrl: string | null;
    }
  >();

  for (const track of tracks ?? []) {
    const artist = artistById.get(track.artist_id);
    const artistName =
      artist?.artist_name ?? "Unknown artist";

    const current = artistMap.get(track.artist_id);

    if (current) {
      current.trackCount += 1;
    } else {
      artistMap.set(track.artist_id, {
        id: track.artist_id,
        name: artistName,
        trackCount: 1,
        coverUrl: artist?.cover_url ?? null,
      });
    }
  }

  const artists = Array.from(artistMap.values()).sort(
    (a, b) => a.name.localeCompare(b.name)
  );

  const artistsWithCovers = await Promise.all(
    artists.map(async (artist) => {
      if (!artist.coverUrl) {
        return {
          ...artist,
          coverSignedUrl: null,
        };
      }

      const { data } = await supabase.storage
        .from("covers")
        .createSignedUrl(artist.coverUrl, 3600);

      return {
        ...artist,
        coverSignedUrl: data?.signedUrl ?? null,
      };
    })
  );

  return (
    <main className="relative min-h-screen overflow-visible bg-black text-white">
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

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-0 pb-12">
        <img
          src="/images/cavernium-artists-placeholder.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[40px] z-0 w-[600px] -translate-x-1/2 opacity-[0.50] md:left-auto md:right-[190px] md:translate-x-0"
        />

        <header className="relative z-10 mb-4 border-b border-white/10 pb-1">
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
                className="text-white transition hover:text-white"
              >
                Artists
              </Link>

              {user && (
                <>
                  <Link
                    href="/profile"
                    className="transition hover:text-white"
                  >
                    My Profile
                  </Link>

                  <span className="rounded-lg border border-white/10 bg-white/[0.025] px-3 py-1.5 text-xs text-white/50 backdrop-blur-sm">
                    LOGGED AS {loggedArtistName ?? "USER"}
                  </span>
                </>
              )}
            </nav>

            <div className="ml-auto hidden md:block">
              <p className="text-xs tracking-widest text-white/40">
                LISTEN <span className="text-[#5CCBFF]">·</span> RATE{" "}
                <span className="text-[#5CCBFF]">·</span> DISCOVER
              </p>
              <p className="mt-1 text-xs tracking-widest text-white/40">
                What deserves to be heard
              </p>
            </div>

            <MobileNav
              isLoggedIn={!!user}
              loggedArtistName={loggedArtistName}
            />
          </div>
        </header>

        <section className="relative">
          <div className="relative z-10 flex items-center justify-between gap-4">
            <h2 className="font-sans text-2xl font-semibold uppercase tracking-tight text-[#E8F8FF]">
              Artists
            </h2>

            {user && loggedArtistName && (
              <Link
                href={`/artists/${user.id}/edit`}
                className="hidden font-sans text-xs font-medium uppercase tracking-wider text-[#0286DC] transition hover:text-[#5CCBFF] hover:drop-shadow-[0_0_6px_rgba(2,134,220,0.55)] md:inline-block"
              >
                Edit My Artist Profile →
              </Link>
            )}
          </div>

          <p className="mt-2 text-sm text-white/50">
  Artists creating or transforming music with AI on CAVERNIUM.
</p>

          {artistsWithCovers.length === 0 ? (
            <p className="mt-10 text-white/50">
              No artists yet.
            </p>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {artistsWithCovers.map((artist) => (
                <Link
                  key={artist.id}
                  href={`/artists/${artist.id}`}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition duration-300 hover:scale-[1.02] hover:border-white/30"
                >
                  <div className="aspect-square bg-white/10">
                    {artist.coverSignedUrl ? (
                      <img
                        src={artist.coverSignedUrl}
                        alt={`Cover de ${artist.name}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl">
                        ♪
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="truncate font-semibold">
                      {artist.name}
                    </h3>

                    <p className="mt-1 text-xs text-white/40">
                      {artist.trackCount}{" "}
                      {artist.trackCount === 1
                        ? "track"
                        : "tracks"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}