import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ArtistTracksClient from "../../components/ArtistTracksClient";

type ArtistPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ArtistPage({
  params,
}: ArtistPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: artist, error: artistError } = await supabase
    .from("artists")
    .select("id, artist_name, cover_url, bio")
    .eq("id", id)
    .single();

  if (artistError || !artist) {
    return (
      <main className="min-h-screen bg-black p-10 text-white">
        <h1 className="text-4xl font-bold">CAVERNIUM</h1>
        <p className="mt-6 text-red-400">
          Unable to load artist.
        </p>
        <p className="mt-2 text-white/50">
          {artistError?.message ?? "Artist not found."}
        </p>
      </main>
    );
  }

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

  const isOwner = user?.id === artist.id;

  let artistCoverSignedUrl: string | null = null;

  if (artist.cover_url) {
    const { data: coverData } = await supabase.storage
      .from("covers")
      .createSignedUrl(artist.cover_url, 3600);

    artistCoverSignedUrl = coverData?.signedUrl ?? null;
  }

  const { data: tracks, error: tracksError } = await supabase
    .from("tracks")
    .select(`
      id,
      title,
      description,
      cover_url,
      audio_url,
      genre,
      duration_seconds,
      language,
      ai_creation_type
    `)
    .eq("artist_id", id)
    .order("created_at", { ascending: false });

  if (tracksError) {
    return (
      <main className="min-h-screen bg-black p-10 text-white">
        <h1 className="text-4xl font-bold">CAVERNIUM</h1>
        <p className="mt-6 text-red-400">
          Unable to load tracks.
        </p>
        <p className="mt-2 text-white/50">
          {tracksError.message}
        </p>
      </main>
    );
  }

  const trackList = tracks ?? [];

  const tracksWithCovers = await Promise.all(
    trackList.map(async (track) => {
      let coverSignedUrl: string | null = null;
      let audioSignedUrl: string | null = null;

      if (track.cover_url) {
        const { data: coverData, error: coverError } =
          await supabase.storage
            .from("covers")
            .createSignedUrl(track.cover_url, 3600);

        if (coverError) {
          console.error(
            "Error creating track cover URL:",
            track.id,
            coverError
          );
        } else {
          coverSignedUrl = coverData?.signedUrl ?? null;
        }
      }

      if (track.audio_url) {
        const { data: audioData, error: audioError } =
          await supabase.storage
            .from("tracks")
            .createSignedUrl(track.audio_url, 3600);

        if (audioError) {
          console.error(
            "Error creating track audio URL:",
            track.id,
            audioError
          );
        } else {
          audioSignedUrl = audioData?.signedUrl ?? null;
        }
      }

      return {
        ...track,
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

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-0">
        <header className="mb-6 flex items-center border-b border-white/10 pb-0">
          <div className="flex items-center">
            <Link href="/" className="shrink-0">
              <img
                src="/icons/LOGO%20CAVERNIUM.png"
                alt="CAVERNIUM"
                className="h-auto w-36"
              />
            </Link>

            <div className="mx-0 h-10 w-px bg-white/20" />
          </div>

          <nav className="ml-5 hidden items-center gap-7 text-sm text-white/60 md:flex">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <Link href="/discover" className="hover:text-white">
              Discover
            </Link>
            <Link href="/rankings" className="hover:text-white">
              Rankings
            </Link>
            <Link href="/artists" className="text-white">
              Artists
            </Link>

            {user && (
              <span className="ml-1 rounded-lg border border-white/10 bg-white/[0.025] px-3 py-1.5 text-xs text-white/50 backdrop-blur-sm">
  LOGGED AS {loggedArtistName ?? "USER"}
</span>
            )}
          </nav>
        </header>

        <div className="flex items-center gap-5">
          <Link
            href={isOwner ? "/" : "/artists"}
            className="font-sans text-xs font-medium uppercase tracking-wider text-[#0286DC] transition hover:text-[#5CCBFF] hover:drop-shadow-[0_0_6px_rgba(2,134,220,0.55)]"
          >
            {isOwner ? "← Back to Home" : "← Back to Artists"}
          </Link>

          {isOwner && (
            <Link
              href={`/artists/${artist.id}/edit`}
              className="font-sans text-xs font-medium uppercase tracking-wider text-[#0286DC] transition hover:text-[#5CCBFF] hover:drop-shadow-[0_0_6px_rgba(2,134,220,0.55)]"
            >
              Edit My Artist Profile →
            </Link>
          )}
        </div>

        <section className="relative mt-4 overflow-hidden">
          <img
            src="/icons/LOGO%20CAVERNIUM.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-80 z-0 w-[620px] -translate-x-1/2 -translate-y-1/2 opacity-[0.07]"
          />

          <div className="relative z-10">
            <div className="rounded-2xl border border-white/15 bg-[#071016]/45 p-5 shadow-[0_0_14px_rgba(0,0,0,0.22)]">
              <div className="grid gap-8 md:grid-cols-[1fr_1fr] md:gap-10">
                <div className="flex items-center gap-5">
                  <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/10">
                    {artistCoverSignedUrl ? (
                      <img
                        src={artistCoverSignedUrl}
                        alt={`Artist image for ${artist.artist_name}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl">
                        ♪
                      </div>
                    )}
                  </div>

                  <div>
                    <h1 className="text-2xl font-semibold uppercase tracking-wide">
                      {isOwner ? "My Profile" : artist.artist_name}
                    </h1>

                    <p className="mt-2 text-sm text-white/50">
                      {tracksWithCovers.length}{" "}
                      {tracksWithCovers.length === 1
                        ? "track"
                        : "tracks"}{" "}
                      on CAVERNIUM.
                    </p>
                  </div>
                </div>

                {artist.bio && (
                  <div className="border-t border-white/10 pt-4 md:border-t-0 md:border-l md:border-white/10 md:pl-8 md:pt-0">
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-white/60">
                      {artist.bio}
                    </p>

                  </div>
                )}
              </div>
            </div>

            {tracksWithCovers.length === 0 ? (
              <p className="mt-10 text-white/50">
                No tracks yet.
              </p>
            ) : (
              <>
                <h3 className="mt-8 mb-5 text-xl font-semibold tracking-tight text-[#E8F8FF]">
                  {isOwner ? "MY TRACKS" : "TRACKS"}
                </h3>

                <ArtistTracksClient
                  tracks={tracksWithCovers}
                  artistName={artist.artist_name}
                  showEditLinks={isOwner}
                  editPlayerLayout={true}
                />
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
