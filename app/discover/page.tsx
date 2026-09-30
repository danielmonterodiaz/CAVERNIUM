import DiscoverPageClient from "@/app/components/DiscoverPageClient";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import MobileNav from "@/app/components/MobileNav";
import LogoutButton from "@/app/components/LogoutButton";

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

  if (tracksError) {
    return (
      <main className="min-h-screen bg-black p-10 text-white">
        <h1 className="text-4xl font-bold">CAVERNIUM</h1>
        <p className="mt-6 text-red-400">
          No se pudo cargar Discover.
        </p>
        <p className="mt-2 text-white/50">
          {tracksError.message}
        </p>
      </main>
    );
  }

  const tracksWithCovers = await Promise.all(
    (tracks ?? []).map(async (item) => {
      let coverSignedUrl: string | null = null;

      if (item.cover_url) {
        const { data: coverData } = await supabase.storage
          .from("covers")
          .createSignedUrl(item.cover_url, 3600);

        coverSignedUrl = coverData?.signedUrl ?? null;
      }

      let audioSignedUrl: string | null = null;

      if (item.audio_url) {
        const { data: audioData } = await supabase.storage
          .from("tracks")
          .createSignedUrl(item.audio_url, 3600);

        audioSignedUrl = audioData?.signedUrl ?? null;
      }

      return {
        ...item,
        coverSignedUrl,
        audioSignedUrl,
      };
    })
  );

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

      <div className="relative z-10 mx-auto max-w-7xl overflow-visible px-6 pt-0 pb-12">
        <img
          src="/images/cavernium-discover-placeholder.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 z-0 w-[280px] -translate-x-1/2 opacity-[0.30] md:left-auto md:right-[180px] md:top-[-20px] md:w-[350px] md:translate-x-0"
        />

        <div className="relative z-10">
          <header className="mb-4 border-b border-white/10 pb-1">
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
              <Link
                href="/"
                className="transition hover:text-white"
              >
                Home
              </Link>

              <Link
                href="/discover"
                className="text-white transition hover:text-white"
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

              {user && (
                <>
                  <Link
                    href="/profile"
                    className="transition hover:text-white"
                  >
                    My Profile
                  </Link>

                  <span className="-ml-6 rounded-lg border border-white/10 bg-white/[0.025] px-3 py-1.5 text-xs text-white/50 backdrop-blur-sm">
  LOGGED AS {loggedArtistName ?? "USER"}
</span>
                  <LogoutButton />
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

          {tracksWithCovers.length > 0 && (
            <DiscoverPageClient tracks={tracksWithCovers} />
          )}
        </div>
      </div>
    </main>
  );
}
