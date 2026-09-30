import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import GenreEditor from "@/app/components/GenreEditor";
import DeleteTrackButton from "@/app/components/DeleteTrackButton";
import TrackSaveButton from "@/app/components/TrackSaveButton";
import MobileNav from "@/app/components/MobileNav";
import LogoutButton from "@/app/components/LogoutButton";

type EditTrackPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function EditTrackPage({
  params,
  searchParams,
}: EditTrackPageProps) {
  const { id } = await params;
  const { error: queryError } = await searchParams;
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

  const { data: track, error: trackError } = await supabase
    .from("tracks")
    .select(`
      id,
      title,
      description,
      genre,
      language,
      ai_creation_type,
      human_involvement,
      cover_url,
      audio_url,
      artist_id
    `)
    .eq("id", id)
    .single();

  if (trackError || !track) {
    return (
      <main className="min-h-screen bg-black p-10 text-white">
        <h1 className="text-3xl font-bold">Edit Track</h1>

        <p className="mt-4 text-red-400">
          Unable to load track.
        </p>

        <p className="mt-2 text-white/50">
          {trackError?.message ?? "Track not found."}
        </p>
      </main>
    );
  }

  if (!user || user.id !== track.artist_id) {
    return (
      <main className="min-h-screen bg-black p-10 text-white">
        <h1 className="text-3xl font-bold">Edit Track</h1>

        <p className="mt-4 text-white/60">
          You are not authorized to edit this track.
        </p>

        <Link
          href={`/artists/${track.artist_id}/edit`}
          className="mt-6 inline-block font-sans text-xs font-medium uppercase tracking-wider text-[#0286DC] transition hover:text-[#5CCBFF] hover:drop-shadow-[0_0_6px_rgba(2,134,220,0.55)]"
        >
          ← Back to Edit Artist Profile
        </Link>
      </main>
    );
  }

  let coverSignedUrl: string | null = null;

  if (track.cover_url) {
    const { data: coverData } = await supabase.storage
      .from("covers")
      .createSignedUrl(track.cover_url, 3600);

    coverSignedUrl = coverData?.signedUrl ?? null;
  }

  const trackId = track.id;
  const artistId = track.artist_id;
  const oldCoverPath = track.cover_url;
  const oldAudioPath = track.audio_url;

  const { data: currentVersion } = await supabase
    .from("track_versions")
    .select("version_number")
    .eq("track_id", trackId)
    .eq("is_current", true)
    .single();

  async function handleSubmit(formData: FormData) {
    "use server";

    const title = String(formData.get("title") ?? "").trim();
    const newCoverPath =
      String(formData.get("newCoverPath") ?? "").trim() || null;
    const newAudioPath =
      String(formData.get("newAudioPath") ?? "").trim() || null;

    const selectedGenre = String(formData.get("genre") ?? "").trim();
    const customGenre = String(formData.get("customGenre") ?? "").trim();

    const genre =
      selectedGenre === "Other" ? customGenre : selectedGenre;

    if (!title) {
      throw new Error("Title cannot be empty.");
    }

    if (!genre) {
      throw new Error("Genre cannot be empty.");
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== artistId) {
      throw new Error("You are not authorized to edit this track.");
    }

    if (
      newCoverPath &&
      !newCoverPath.startsWith(`artists/${user.id}/`)
    ) {
      throw new Error("Invalid cover path.");
    }

    if (
      newAudioPath &&
      !newAudioPath.startsWith(`artists/${user.id}/`)
    ) {
      throw new Error("Invalid audio path.");
    }

    const { error: updateError } = await supabase
      .from("tracks")
      .update({
        title,
        genre,
        language: String(formData.get("language") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim(),
        ai_creation_type: String(
          formData.get("ai_creation_type") ?? ""
        ).trim(),
        ...(newCoverPath ? { cover_url: newCoverPath } : {}),
      })
      .eq("id", trackId)
      .eq("artist_id", user.id);

    if (updateError) {
      if (newAudioPath) {
        await supabase.storage
          .from("tracks")
          .remove([newAudioPath]);
      }

      if (newCoverPath) {
        await supabase.storage
          .from("covers")
          .remove([newCoverPath]);
      }

      throw new Error(
        `Unable to update track: ${updateError.message}`
      );
    }

    if (newAudioPath) {
      const { error: versionError } = await supabase.rpc(
        "replace_track_audio",
        {
          p_track_id: trackId,
          p_audio_url: newAudioPath,
        }
      );

      if (versionError) {
        await supabase
          .from("tracks")
          .update({
            audio_url: oldAudioPath,
            cover_url: oldCoverPath,
          })
          .eq("id", trackId)
          .eq("artist_id", user.id);

        await supabase.storage
          .from("tracks")
          .remove([newAudioPath]);

        if (newCoverPath) {
          await supabase.storage
            .from("covers")
            .remove([newCoverPath]);
        }

        throw new Error(
          `Unable to create new track version: ${versionError.message}`
        );
      }
    }

    if (newCoverPath && oldCoverPath) {
      await supabase.storage
        .from("covers")
        .remove([oldCoverPath]);
    }

    redirect(`/tracks/${trackId}/edit`);
  }

  async function handleDelete() {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== artistId) {
      throw new Error("You are not authorized to delete this track.");
    }

    const { error: deleteError } = await supabase
      .from("tracks")
      .delete()
      .eq("id", trackId)
      .eq("artist_id", user.id);

    if (deleteError) {
      throw new Error(
        `Unable to delete track: ${deleteError.message}`
      );
    }

    if (oldAudioPath) {
      await supabase.storage
        .from("tracks")
        .remove([oldAudioPath]);
    }

    if (oldCoverPath) {
      await supabase.storage
        .from("covers")
        .remove([oldCoverPath]);
    }

    redirect(`/artists/${artistId}`);
  }

  const errorMessage =
    queryError === "cover-too-large"
      ? "Cover image must be 500 KB or smaller."
      : null;

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
              <Link href="/" className="transition hover:text-white">
                Home
              </Link>
              <Link href="/discover" className="transition hover:text-white">
                Discover
              </Link>
              <Link href="/rankings" className="transition hover:text-white">
                Rankings
              </Link>
              <Link href="/artists" className="transition hover:text-white">
                Artists
              </Link>
              <Link href="/profile" className="transition hover:text-white">
                My Profile
              </Link>
              <span className="rounded-lg border border-white/10 bg-white/[0.025] px-3 py-1.5 text-xs text-white/50 backdrop-blur-sm">
                LOGGED AS {loggedArtistName ?? "USER"}
              </span>
            </nav>

            <div className="ml-auto hidden items-center gap-4 md:flex">
              <span className="text-xs tracking-widest text-white/35">
                LISTEN · RATE · DISCOVER
              </span>
              <LogoutButton />
            </div>

            <MobileNav
              isLoggedIn={!!user}
              loggedArtistName={loggedArtistName}
            />
          </div>
        </header>

        <div className="pb-12 pt-6">
          <div className="mt-2 flex items-center justify-between">
            <h1 className="text-lg font-semibold uppercase tracking-wide">
              Edit Track
            </h1>

            <Link
              href={`/artists/${track.artist_id}/edit`}
              className="font-sans text-xs font-medium uppercase tracking-wider text-[#0286DC] transition hover:text-[#5CCBFF] hover:drop-shadow-[0_0_6px_rgba(2,134,220,0.55)]"
            >
              ← Back to Edit Artist Profile
            </Link>
          </div>

          <p className="mt-2 text-sm text-white/45">
            Update your track information.
          </p>

          {errorMessage && (
            <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
              {errorMessage}
            </div>
          )}

          <section className="relative mt-8 overflow-hidden rounded-2xl border border-white/15 bg-[#071016]/45 p-6 shadow-[0_0_18px_rgba(0,0,0,0.22)]">
            <img
              src="/icons/LOGO%20CAVERNIUM.png"
              alt=""
              className="pointer-events-none absolute left-1/2 top-24 z-0 w-[520px] -translate-x-1/2 opacity-[0.10]"
            />

            <div className="border-b border-white/10 pb-5">
              <h2 className="text-xl font-semibold tracking-tight text-[#E8F8FF]">
                {track.title}
              </h2>

              <p className="mt-1 text-xs uppercase tracking-wider text-white/35">
                Track settings
              </p>
            </div>

            <div className="mt-7 grid items-stretch gap-8 md:grid-cols-[280px_minmax(0,1fr)]">
              <div className="flex min-h-full flex-col">
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/55">
                    Current Cover
                  </label>

                  <div className="aspect-square w-full max-w-[280px] overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_18px_rgba(0,0,0,0.25)]">
                    {coverSignedUrl ? (
                      <img
                        src={coverSignedUrl}
                        alt={`Cover for ${track.title}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-5xl text-white/25">
                        ♪
                      </div>
                    )}
                  </div>
                </div>

                <section className="mt-auto rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
                  <h2 className="text-lg font-semibold text-red-300">
                    Danger Zone
                  </h2>

                  <p className="mt-2 text-sm leading-relaxed text-white/45">
                    Deleting this track is permanent.
                  </p>

                  <div className="mt-4">
                    <DeleteTrackButton
                      trackTitle={track.title}
                      action={handleDelete}
                    />
                  </div>
                </section>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <form
                  id="edit-track-form"
                  action={handleSubmit}
                  className="contents"
                >
                  <input
                    type="hidden"
                    name="newAudioPath"
                  />

                  <input
                    type="hidden"
                    name="newCoverPath"
                  />

                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/55">
                      Title
                    </label>

                    <input
                      name="title"
                      defaultValue={track.title}
                      className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#0286DC] focus:ring-1 focus:ring-[#0286DC]/40"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/55">
                      Genre
                    </label>

                    <GenreEditor genre={track.genre} />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/55">
                      Language
                    </label>

                    <select
                      name="language"
                      defaultValue={track.language ?? ""}
                      className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-[#0286DC] focus:ring-1 focus:ring-[#0286DC]/40"
                    >
                      <option value="" className="bg-white text-black">
                        Select language...
                      </option>
                      <option value="Spanish" className="bg-white text-black">
                        Spanish
                      </option>
                      <option value="English" className="bg-white text-black">
                        English
                      </option>
                      <option value="Portuguese" className="bg-white text-black">
                        Portuguese
                      </option>
                      <option value="French" className="bg-white text-black">
                        French
                      </option>
                      <option value="Italian" className="bg-white text-black">
                        Italian
                      </option>
                      <option value="German" className="bg-white text-black">
                        German
                      </option>
                      <option value="Japanese" className="bg-white text-black">
                        Japanese
                      </option>
                      <option value="Korean" className="bg-white text-black">
                        Korean
                      </option>
                      <option value="Chinese" className="bg-white text-black">
                        Chinese
                      </option>
                      <option value="Arabic" className="bg-white text-black">
                        Arabic
                      </option>
                      <option value="Hindi" className="bg-white text-black">
                        Hindi
                      </option>
                      <option value="Turkish" className="bg-white text-black">
                        Turkish
                      </option>
                      <option value="Dutch" className="bg-white text-black">
                        Dutch
                      </option>
                      <option value="Swedish" className="bg-white text-black">
                        Swedish
                      </option>
                      <option value="Russian" className="bg-white text-black">
                        Russian
                      </option>
                      <option value="Polish" className="bg-white text-black">
                        Polish
                      </option>
                      <option value="Other" className="bg-white text-black">
                        Other
                      </option>
                      <option
                        value="Instrumental"
                        className="bg-white text-black"
                      >
                        Instrumental
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/55">
                      Description
                    </label>

                    <textarea
                      name="description"
                      defaultValue={track.description ?? ""}
                      rows={4}
                      maxLength={160}
                      className="w-full resize-y rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#0286DC] focus:ring-1 focus:ring-[#0286DC]/40"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/55">
                      Creation Credits
                    </label>

                    <select
                      name="ai_creation_type"
                      defaultValue={track.ai_creation_type ?? ""}
                      className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-[#0286DC] focus:ring-1 focus:ring-[#0286DC]/40"
                    >
                      <option value="" className="bg-white text-black">
                        Select...
                      </option>
                      <option
                        value="music_ai_lyrics_human"
                        className="bg-white text-black"
                      >
                        Music AI + Lyrics by Human
                      </option>
                      <option
                        value="music_human_lyrics_ai"
                        className="bg-white text-black"
                      >
                        Music by Human + Lyrics by AI
                      </option>
                      <option
                        value="music_ai_lyrics_ai"
                        className="bg-white text-black"
                      >
                        Music AI + Lyrics by AI
                      </option>
                      <option
                        value="music_ai_lyrics_human_vocals_human"
                        className="bg-white text-black"
                      >
                        Music AI + Lyrics by Human + Vocals by Human
                      </option>
                      <option
                        value="music_ai_lyrics_ai_vocals_human"
                        className="bg-white text-black"
                      >
                        Music AI + Lyrics by AI + Vocals by Human
                      </option>
                      <option
                        value="music_human_lyrics_human_vocals_ai"
                        className="bg-white text-black"
                      >
                        Music by Human + Lyrics by Human + Vocals by AI
                      </option>
                      <option
                        value="music_ai_lyrics_human_vocals_ai"
                        className="bg-white text-black"
                      >
                        Music AI + Lyrics by Human + Vocals by AI
                      </option>
                      <option
                        value="music_ai_lyrics_ai_vocals_ai"
                        className="bg-white text-black"
                      >
                        Music AI + Lyrics by AI + Vocals by AI
                      </option>
                      <option
                        value="human_ai_collaboration"
                        className="bg-white text-black"
                      >
                        Human–AI Collaboration
                      </option>
                    </select>
                  </div>
                </form>

                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/55">
                    Replace Audio File
                  </label>

                  <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                    <input
                      id="audioFile"
                      type="file"
                      accept=".mp3,.wav,.flac,audio/mpeg,audio/wav,audio/flac"
                      className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-[#0286DC] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white file:transition file:hover:bg-[#1698EE]"
                    />

                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <p className="text-xs font-medium text-[#A78BFA]">
                        Current version:{" "}
                        {currentVersion?.version_number ?? 1}
                      </p>

                      <span className="h-3 w-px bg-white/15" />

                      <p className="text-xs text-white/35">
                        Uploading a new audio file creates a new version.
                      </p>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-[#E3B341]/80">
                      Optional. Select a new audio file only when replacing
                      the current audio. Replacing the audio creates a new
                      version and resets its ratings and listening statistics
                      to zero. Leaving this empty keeps the current audio
                      unchanged.
                    </p>
                  </div>
                </div>

                <div className="md:col-start-2">
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/55">
                    New Cover Image (1:1)
                  </label>

                  <input
                    id="coverImage"
                    type="file"
                    accept="image/*"
                    className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-[#0286DC] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white file:transition file:hover:bg-[#1698EE]"
                  />

                  <p className="mt-2 text-xs text-white/35">
                    Square image only (1:1). Maximum size: 500 KB.
                  </p>
                </div>

                <div className="md:col-span-2 mt-2 flex items-center justify-end border-t border-white/10 pt-6">
                  <TrackSaveButton />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}