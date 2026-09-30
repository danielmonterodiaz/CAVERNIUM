"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
const supabase = createClient();
import Link from "next/link";
import MobileNav from "@/app/components/MobileNav";

const caverniumButtonClass =
  "inline-flex cursor-pointer items-center justify-center rounded-lg border border-[#0286DC]/60 bg-black/40 px-4 py-2 font-sans text-xs font-medium uppercase tracking-wider text-[#5CCBFF] transition hover:border-[#5CCBFF] hover:bg-[#0286DC]/15 hover:text-white hover:drop-shadow-[0_0_6px_rgba(2,134,220,0.55)] disabled:cursor-not-allowed disabled:opacity-40";

export default function UploadTrack() {
  function validateCoverImage(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);

        const isSquare = image.width === image.height;

        resolve(isSquare);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(false);
      };

      image.src = objectUrl;
    });
  }

  async function handleAudioUpload(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setLoading(true);
    setUploadProgress(0);

    const form = event.currentTarget;
    const audioInput = form.elements.namedItem(
      "audioFile"
    ) as HTMLInputElement;
    const audioFile = audioInput.files?.[0];

    const coverInput = form.elements.namedItem(
      "coverImage"
    ) as HTMLInputElement;
    const coverFile = coverInput.files?.[0];

    if (!audioFile) {
      setMessage("Please select an audio file.");
      setLoading(false);
      return;
    }

    const fileName = audioFile.name.toLowerCase();
    const fileSizeMB = audioFile.size / (1024 * 1024);

    let maxSizeMB = 0;

    if (fileName.endsWith(".mp3")) {
      maxSizeMB = 15;
    } else if (
      fileName.endsWith(".wav") ||
      fileName.endsWith(".flac")
    ) {
      maxSizeMB = 50;
    } else {
      setMessage("Only MP3, WAV, and FLAC files are allowed.");
      setLoading(false);
      return;
    }

    if (fileSizeMB > maxSizeMB) {
      setMessage(
        `${
          fileName.endsWith(".mp3")
            ? "MP3"
            : fileName.endsWith(".wav")
            ? "WAV"
            : "FLAC"
        } files must be ${maxSizeMB} MB or smaller.`
      );
      setLoading(false);
      return;
    }

    let durationSeconds: number;
    let uploadedAudioPath: string | null = null;
    let uploadedCoverPath: string | null = null;

    const cleanupUploadedFiles = async () => {
      const removals: Promise<unknown>[] = [];

      if (uploadedAudioPath) {
        removals.push(
          supabase.storage
            .from("tracks")
            .remove([uploadedAudioPath])
        );
      }

      if (uploadedCoverPath) {
        removals.push(
          supabase.storage
            .from("covers")
            .remove([uploadedCoverPath])
        );
      }

      await Promise.all(removals);
    };

    try {
      durationSeconds = await new Promise<number>(
        (resolve, reject) => {
          const audio = document.createElement("audio");
          const objectUrl = URL.createObjectURL(audioFile);

          audio.preload = "metadata";

          audio.onloadedmetadata = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(Math.round(audio.duration));
          };

          audio.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(
              new Error("Could not read audio duration.")
            );
          };

          audio.src = objectUrl;
        }
      );
    } catch (error) {
      setMessage("Could not read audio duration.");
      setLoading(false);
      return;
    }

    if (durationSeconds < 60) {
      setMessage("Tracks must be at least 60 seconds long.");
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You must be logged in.");
      setLoading(false);
      return;
    }

    const { data: artist, error: artistError } =
      await supabase
        .from("artists")
        .select("id, artist_name")
        .eq("id", user.id)
        .maybeSingle();

    if (artistError) {
      setMessage(`Artist error: ${artistError.message}`);
      setLoading(false);
      return;
    }

    if (!artist) {
      setMessage("Artist profile not found.");
      setLoading(false);
      return;
    }

    const title = (
      form.elements.namedItem("title") as HTMLInputElement
    ).value.trim();

    const {
      data: existingTracks,
      error: duplicateCheckError,
    } = await supabase
      .from("tracks")
      .select("id, title")
      .eq("artist_id", artist.id);

    if (duplicateCheckError) {
      setMessage(
        `Could not check track title: ${duplicateCheckError.message}`
      );
      setLoading(false);
      return;
    }

    const duplicateTrack = (existingTracks ?? []).find(
      (track) =>
        track.title.trim().toLowerCase() ===
        title.toLowerCase()
    );

    if (duplicateTrack) {
     setMessage(
  `You already have a track called "${title}".`
);
      setLoading(false);
      return;
    }

    const fileExtension =
      audioFile.name.split(".").pop()?.toLowerCase() || "";

    const filePath = `artists/${user.id}/${crypto.randomUUID()}.${fileExtension}`;
    const audioUrl = filePath;

    const { error } = await supabase.storage
      .from("tracks")
      .upload(filePath, audioFile);

    if (error) {
      setMessage(`Upload error: ${error.message}`);
      setLoading(false);
      return;
    }

    uploadedAudioPath = filePath;

    setUploadProgress(50);

    let coverUrl: string | null = null;

    if (coverFile) {
      const isSquare =
        await validateCoverImage(coverFile);

      if (!isSquare) {
        await cleanupUploadedFiles();
        setMessage("Cover image must be square (1:1).");
        setLoading(false);
        return;
      }

      const coverPath = `artists/${user.id}/${crypto.randomUUID()}-${coverFile.name}`;

      const { error: coverError } =
        await supabase.storage
          .from("covers")
          .upload(coverPath, coverFile);

      if (coverError) {
        await cleanupUploadedFiles();
        setMessage(
          `Cover upload error: ${coverError.message}`
        );
        setLoading(false);
        return;
      }

      uploadedCoverPath = coverPath;

      setUploadProgress(75);

      coverUrl = coverPath;
    }

    const formData = new FormData(form);

    const description =
      formData.get("description") as string;

    const musicalGenre =
      formData.get("musicalGenre") as string;

    const customGenre =
      formData.get("customGenre") as string;

    const finalGenre =
      musicalGenre === "Other"
        ? customGenre
        : musicalGenre;

    const language =
      formData.get("language") as string;

    const creationCredits =
      formData.get("creationCredits") as string;

    let humanInvolvement = "AI-assisted";

    if (
      creationCredits ===
      "music_ai_lyrics_ai_vocals_ai"
    ) {
      humanInvolvement = "AI-generated";
    }

    const { error: trackError } =
      await supabase
        .from("tracks")
        .insert({
          artist_id: artist.id,
          title,
          description: description || null,
          audio_url: audioUrl,
          cover_url: coverUrl,
          genre: finalGenre || null,
          language: language || null,
          duration_seconds: durationSeconds,
          ai_creation_type: creationCredits,
          human_involvement: humanInvolvement,
          status: "new",
          explicit: false,
        });

    if (trackError) {
      await cleanupUploadedFiles();
      setMessage(`Track error: ${trackError.message}`);
      setLoading(false);
      return;
    }

    setUploadProgress(100);
    setLoading(false);
    setMessage("Track uploaded successfully.");
  }

  const [message, setMessage] = useState("");
  const [genre, setGenre] = useState("");
  const [language, setLanguage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] =
    useState(0);
  const [checkingUser, setCheckingUser] =
    useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [loggedArtistName, setLoggedArtistName] =
    useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState("");
  const [coverFileName, setCoverFileName] = useState("");

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in to upload music.");
        window.location.href = "/login";
        return;
      }

      setUserId(user.id);

      const { data: artist } = await supabase
        .from("artists")
        .select("artist_name")
        .eq("id", user.id)
        .maybeSingle();

      setLoggedArtistName(artist?.artist_name ?? null);
      setCheckingUser(false);
    }

    checkUser();
  }, []);

  if (checkingUser) {
    return null;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-6 pt-0 pb-12 text-white">
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

      <div className="relative z-10 mx-auto max-w-7xl overflow-hidden">
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

              {userId && (
                <>
                  <Link
                    href={`/artists/${userId}`}
                    className="transition hover:text-white"
                  >
                    My Profile
                  </Link>

                  <span className="ml-1 rounded-lg border border-white/10 bg-white/[0.025] px-3 py-1.5 text-xs text-white/50 backdrop-blur-sm">
                    LOGGED AS {loggedArtistName ?? "USER"}
                  </span>
                </>
              )}
            </nav>

            <div className="ml-auto hidden text-xs tracking-widest text-white/40 md:block">
              LISTEN · RATE · DISCOVER
            </div>

            <MobileNav
              isLoggedIn={!!userId}
              loggedArtistName={loggedArtistName}
            />
          </div>
        </header>

        <img
          src="/icons/LOGO%20CAVERNIUM.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[130px] z-0 w-[620px] -translate-x-1/2 opacity-[0.055]"
        />

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-[400px] rounded-2xl border border-white/10 bg-white/[0.025] px-6 py-4 backdrop-blur-sm lg:ml-16">
            <h1 className="text-3xl font-semibold uppercase tracking-wide">
              Upload Track
            </h1>

            <p className="mt-1 text-xs text-white/50">
              Share your AI-assisted music with CAVERNIUM.
            </p>
          </div>

          <div className="max-w-2xl rounded-2xl border border-purple-300/20 bg-purple-300/[0.025] px-5 py-4 backdrop-blur-sm">
            <p className="text-xs leading-relaxed text-purple-200/75">
              <span className="font-semibold text-purple-200">
                ▲ WARNING
              </span>{" "}
              By uploading a track to CAVERNIUM, you acknowledge and agree that you own or have the necessary rights and permissions to share the content. CAVERNIUM is not responsible for any legal claims, disputes, or infringements arising from user-uploaded content.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleAudioUpload}
          className="grid grid-cols-1 gap-6 md:grid-cols-2"
        >
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/60">
              Track Title
            </label>

            <input
              type="text"
              name="title"
              required
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.025] backdrop-blur-sm px-4 py-0 text-sm transition focus:border-[#0286DC] focus:outline-none"
              placeholder="Enter track title"
            />
          </div>

          <div className="hidden">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/60">
              Additional Credits
            </label>

            <textarea
              name="additionalCredits"
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-white/[0.025] backdrop-blur-sm px-4 py-3 text-sm transition focus:border-[#0286DC] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/60">
              Musical Genre
            </label>

            <select
              name="musicalGenre"
              value={genre}
              onChange={(e) =>
                setGenre(e.target.value)
              }
              required
              style={{
                colorScheme: "dark",
                color: "white",
                backgroundColor: "#111111",
              }}
              className="w-full rounded-xl border border-white/10 bg-white/[0.025] backdrop-blur-sm px-4 py-3 text-sm transition focus:border-[#0286DC] focus:outline-none"
            >
              <option value="">
                Select genre...
              </option>

              <option value="Pop">Pop</option>
              <option value="Rock">Rock</option>
              <option value="Alternative">
                Alternative
              </option>
              <option value="Indie">Indie</option>
              <option value="Electronic">
                Electronic
              </option>
              <option value="House">House</option>
              <option value="Techno">Techno</option>
              <option value="Trance">Trance</option>
              <option value="Ambient">Ambient</option>
              <option value="Hip-Hop / Rap">
                Hip-Hop / Rap
              </option>
              <option value="R&B / Soul">
                R&B / Soul
              </option>
              <option value="Funk">Funk</option>
              <option value="Jazz">Jazz</option>
              <option value="Blues">Blues</option>
              <option value="Classical">
                Classical
              </option>
              <option value="Folk">Folk</option>
              <option value="Acoustic">
                Acoustic
              </option>
              <option value="Country">Country</option>
              <option value="Metal">Metal</option>
              <option value="Punk">Punk</option>
              <option value="Reggae">Reggae</option>
              <option value="Ska">Ska</option>
              <option value="Latin">Latin</option>
              <option value="Salsa">Salsa</option>
              <option value="Cumbia">Cumbia</option>
              <option value="Reggaeton">
                Reggaeton
              </option>
              <option value="Bachata">Bachata</option>
              <option value="Merengue">
                Merengue
              </option>
              <option value="Tango">Tango</option>
              <option value="Flamenco">
                Flamenco
              </option>
              <option value="Brazilian">
                Brazilian
              </option>
              <option value="Afrobeat">
                Afrobeat
              </option>
              <option value="World Music">
                World Music
              </option>
              <option value="Gospel">Gospel</option>
              <option value="Singer-Songwriter">
                Singer-Songwriter
              </option>
              <option value="Lo-fi">Lo-fi</option>
              <option value="Experimental">
                Experimental
              </option>
              <option value="Soundtrack / Cinematic">
                Soundtrack / Cinematic
              </option>
              <option value="Spoken Word">
                Spoken Word
              </option>
              <option value="Other">Other</option>
            </select>

            {genre === "Other" && (
              <div className="mt-4">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/60">
                  Specify Genre
                </label>

                <input
                  type="text"
                  name="customGenre"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/[0.025] backdrop-blur-sm px-4 py-3"
                  placeholder="Enter the genre"
                />
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/60">
              Language
            </label>

            <select
              name="language"
              value={language}
              onChange={(e) =>
                setLanguage(e.target.value)
              }
              required
              style={{
                colorScheme: "dark",
                color: "white",
                backgroundColor: "#111111",
              }}
              className="w-full rounded-xl border border-white/10 bg-white/[0.025] backdrop-blur-sm px-4 py-3 text-sm transition focus:border-[#0286DC] focus:outline-none"
            >
              <option value="">
                Select language...
              </option>

              <option value="Spanish">Spanish</option>
              <option value="English">English</option>
              <option value="Portuguese">
                Portuguese
              </option>
              <option value="French">French</option>
              <option value="Italian">Italian</option>
              <option value="German">German</option>
              <option value="Japanese">
                Japanese
              </option>
              <option value="Korean">Korean</option>
              <option value="Chinese">Chinese</option>
              <option value="Arabic">Arabic</option>
              <option value="Hindi">Hindi</option>
              <option value="Turkish">Turkish</option>
              <option value="Dutch">Dutch</option>
              <option value="Swedish">Swedish</option>
              <option value="Russian">Russian</option>
              <option value="Polish">Polish</option>
              <option value="Other">Other</option>
              <option value="Instrumental">
                Instrumental
              </option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/60">
              Audio File
            </label>

            <div className="flex h-12 w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] backdrop-blur-sm px-3">
              <input
                id="audioFile"
                type="file"
                name="audioFile"
                accept="audio/*"
                required
                onChange={(event) =>
                  setAudioFileName(
                    event.target.files?.[0]?.name ?? ""
                  )
                }
                className="sr-only"
              />

              <label
                htmlFor="audioFile"
                className={caverniumButtonClass}
              >
                Select file
              </label>

              <span className="truncate text-sm text-white/60">
                {audioFileName || "No file selected"}
              </span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/60">
              Cover Image (1:1)
            </label>

            <p className="mb-2 text-xs text-white/40">
              Square image only.
            </p>

            <div className="flex h-12 w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] backdrop-blur-sm px-3">
              <input
                id="coverImage"
                type="file"
                name="coverImage"
                accept="image/*"
                onChange={(event) =>
                  setCoverFileName(
                    event.target.files?.[0]?.name ?? ""
                  )
                }
                className="sr-only"
              />

              <label
                htmlFor="coverImage"
                className={caverniumButtonClass}
              >
                Select file
              </label>

              <span className="truncate text-sm text-white/60">
                {coverFileName || "No file selected"}
              </span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/60">
              Description
            </label>

            <textarea
              name="description"
              rows={4}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.025] backdrop-blur-sm px-4 py-3 text-sm transition focus:border-[#0286DC] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/60">
              Creation Credits
            </label>

            <select
              name="creationCredits"
              required
              style={{
                colorScheme: "dark",
                color: "white",
                backgroundColor: "#111111",
              }}
              className="w-full rounded-xl border border-white/10 bg-white/[0.025] backdrop-blur-sm px-4 py-3 text-sm transition focus:border-[#0286DC] focus:outline-none"
            >
              <option value="">Select...</option>

              <option value="music_ai_lyrics_human">
                Music AI + Lyrics by Human
              </option>

              <option value="music_human_lyrics_ai">
                Music by Human + Lyrics by AI
              </option>

              <option value="music_ai_lyrics_ai">
                Music AI + Lyrics by AI
              </option>

              <option value="music_ai_lyrics_human_vocals_human">
                Music AI + Lyrics by Human + Vocals by Human
              </option>

              <option value="music_ai_lyrics_ai_vocals_human">
                Music AI + Lyrics by AI + Vocals by Human
              </option>

              <option value="music_human_lyrics_human_vocals_ai">
                Music by Human + Lyrics by Human + Vocals by AI
              </option>

              <option value="music_ai_lyrics_human_vocals_ai">
                Music AI + Lyrics by Human + Vocals by AI
              </option>

              <option value="music_ai_lyrics_ai_vocals_ai">
                Music AI + Lyrics by AI + Vocals by AI
              </option>

              <option value="human_ai_collaboration">
                Human–AI Collaboration
              </option>
            </select>
          </div>

          <div className="hidden">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/60">
              Additional Credits
            </label>

            <textarea
              name="additionalCredits"
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-white/[0.025] backdrop-blur-sm px-4 py-3"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`${caverniumButtonClass} md:col-span-2 justify-self-start px-6 py-3`}
          >
            {loading ? "Uploading..." : "Upload Track"}
          </button>

          {loading && (
            <div className="mt-6">
              <div className="mb-2 flex justify-between text-sm text-white/60">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{
                    width: `${uploadProgress}%`,
                  }}
                />
              </div>
            </div>
          )}

          {message && (
            <p
              className={`mt-4 text-sm ${
                message === "Cover image must be square (1:1)." ||
                message.startsWith('You already have a track called "') ||
                message.startsWith("Cover upload error:")
                  ? "text-yellow-300"
                  : "text-white/70"
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}