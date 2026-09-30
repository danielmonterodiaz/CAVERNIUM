"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function UploadTrack() {
  const supabase = createClient();

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

  function compressCoverImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);

        const canvas = document.createElement("canvas");
        const size = 1200;

        canvas.width = size;
        canvas.height = size;

        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Could not process cover image."));
          return;
        }

        context.drawImage(image, 0, 0, size, size);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Could not compress cover image."));
              return;
            }

            const compressedFile = new File(
              [blob],
              "cover.jpg",
              {
                type: "image/jpeg",
                lastModified: Date.now(),
              }
            );

            resolve(compressedFile);
          },
          "image/jpeg",
          0.8
        );
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Could not read cover image."));
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

    const artistImageInput = form.elements.namedItem(
      "artistImage"
    ) as HTMLInputElement;

    const artistImageFile = artistImageInput.files?.[0];

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
      setMessage(
        "Only MP3, WAV, and FLAC files are allowed."
      );
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

    try {
      durationSeconds = await new Promise<number>(
        (resolve, reject) => {
          const audio = document.createElement("audio");
          const objectUrl =
            URL.createObjectURL(audioFile);

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
      setMessage(
        `Artist error: ${artistError.message}`
      );
      setLoading(false);
      return;
    }

    if (!artist) {
      setMessage("Artist profile not found.");
      setLoading(false);
      return;
    }

    if (artistImageFile) {
      const isSquare = await validateCoverImage(
        artistImageFile
      );

      if (!isSquare) {
        setMessage(
          "Artist image must be square (1:1)."
        );
        setLoading(false);
        return;
      }
    }

    const fileExtension =
      audioFile.name
        .split(".")
        .pop()
        ?.toLowerCase() || "";

    const filePath = `test/${user.id}/${crypto.randomUUID()}.${fileExtension}`;

    const audioUrl = filePath;

    const { error } = await supabase.storage
      .from("tracks")
      .upload(filePath, audioFile);

    if (error) {
      setMessage(`Upload error: ${error.message}`);
      setLoading(false);
      return;
    }

    setUploadProgress(50);

    let coverUrl: string | null = null;

    if (coverFile) {
      const isSquare = await validateCoverImage(
        coverFile
      );

      if (!isSquare) {
        setMessage(
          "Cover image must be square (1:1)."
        );
        setLoading(false);
        return;
      }

      let compressedCover: File;

      try {
        compressedCover =
          await compressCoverImage(coverFile);
      } catch (error) {
        setMessage(
          "Could not process cover image."
        );
        setLoading(false);
        return;
      }

      const coverPath = `test/${user.id}/${crypto.randomUUID()}.jpg`;

      const { error: coverError } =
        await supabase.storage
          .from("covers")
          .upload(
            coverPath,
            compressedCover,
            {
              contentType: "image/jpeg",
            }
          );

      if (coverError) {
        setMessage(
          `Cover upload error: ${coverError.message}`
        );
        setLoading(false);
        return;
      }

      setUploadProgress(75);

      coverUrl = coverPath;
    }

    const formData = new FormData(form);

    const title = formData.get("title") as string;
    const description =
      formData.get("description") as string;
    const musicalGenre =
      formData.get("musicalGenre") as string;
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
          genre: musicalGenre || null,
          language: language || null,
          duration_seconds: durationSeconds,
          ai_creation_type: creationCredits,
          human_involvement: humanInvolvement,
          status: "new",
          explicit: false,
        });

    if (trackError) {
      setMessage(
        `Track error: ${trackError.message}`
      );
      setLoading(false);
      return;
    }

    setUploadProgress(100);
    setLoading(false);
    setMessage(
      "Track uploaded successfully."
    );
  }

  const [message, setMessage] = useState("");
  const [genre, setGenre] = useState("");
  const [language, setLanguage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] =
    useState(0);

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="mx-auto max-w-3xl">

        <h1 className="text-3xl font-bold mb-2">
          Upload Track
        </h1>

        <p className="text-white/50 mb-8">
          Share your AI-assisted music with CAVERNIUM.
        </p>

        <form
          onSubmit={handleAudioUpload}
          className="space-y-6"
        >

          <div>
            <label className="block text-sm mb-2">
              Artist Name
            </label>

            <input
              type="text"
              name="artistName"
              required
              className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">
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
              className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3"
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
              <option value="Country">
                Country
              </option>
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
              <option value="Bachata">
                Bachata
              </option>
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
                <label className="block text-sm mb-2">
                  Specify Genre
                </label>

                <input
                  type="text"
                  name="customGenre"
                  required
                  className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3"
                  placeholder="Enter the genre"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm mb-2">
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
              className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3"
            >
              <option value="">
                Select language...
              </option>

              <option value="Spanish">
                Spanish
              </option>
              <option value="English">
                English
              </option>
              <option value="Portuguese">
                Portuguese
              </option>
              <option value="French">
                French
              </option>
              <option value="Italian">
                Italian
              </option>
              <option value="German">
                German
              </option>
              <option value="Japanese">
                Japanese
              </option>
              <option value="Korean">
                Korean
              </option>
              <option value="Chinese">
                Chinese
              </option>
              <option value="Arabic">
                Arabic
              </option>
              <option value="Hindi">Hindi</option>
              <option value="Turkish">
                Turkish
              </option>
              <option value="Dutch">Dutch</option>
              <option value="Swedish">
                Swedish
              </option>
              <option value="Russian">
                Russian
              </option>
              <option value="Polish">
                Polish
              </option>
              <option value="Other">Other</option>
              <option value="Instrumental">
                Instrumental
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2">
              Audio File
            </label>

            <input
              type="file"
              name="audioFile"
              accept="audio/*"
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">
              Artist Image (1:1)
            </label>

            <p className="mb-2 text-xs text-white/40">
              Square image only. This image represents
              the artist.
            </p>

            <input
              type="file"
              name="artistImage"
              accept="image/*"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">
              Cover Image (1:1)
            </label>

            <p className="mb-2 text-xs text-white/40">
              Square image only.
            </p>

            <input
              type="file"
              name="coverImage"
              accept="image/*"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">
              Description
            </label>

            <textarea
              name="description"
              rows={4}
              className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">
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
              className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3"
            >
              <option value="">
                Select...
              </option>

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

          <div>
            <label className="block text-sm mb-2">
              Additional Credits
            </label>

            <textarea
              name="additionalCredits"
              rows={3}
              className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-white text-black px-6 py-3 font-semibold"
          >
            Upload Track
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
            <p className="mt-4 text-sm text-white/70">
              {message}
            </p>
          )}

        </form>
      </div>
    </main>
  );
}