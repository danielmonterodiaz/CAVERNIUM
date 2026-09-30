"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function TrackSaveButton() {
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (saving) return;

    setSaving(true);

    const form = document.getElementById(
      "edit-track-form"
    ) as HTMLFormElement | null;

    const audioInput = document.getElementById(
      "audioFile"
    ) as HTMLInputElement | null;

    const coverInput = document.getElementById(
      "coverImage"
    ) as HTMLInputElement | null;

    const newAudioPathInput = form?.elements.namedItem(
      "newAudioPath"
    ) as HTMLInputElement | null;

    const newCoverPathInput = form?.elements.namedItem(
      "newCoverPath"
    ) as HTMLInputElement | null;

    if (!form || !audioInput || !coverInput) {
      setSaving(false);
      return;
    }

    const audioFile = audioInput.files?.[0] ?? null;
    const coverFile = coverInput.files?.[0] ?? null;

    if (!audioFile && !coverFile) {
      form.requestSubmit();
      return;
    }

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in.");
      setSaving(false);
      return;
    }

    let newAudioPath: string | null = null;
    let newCoverPath: string | null = null;

    try {
      if (coverFile) {
        if (coverFile.size > 500 * 1024) {
          alert("Cover image must be 500 KB or smaller.");
          setSaving(false);
          return;
        }

        newCoverPath = `artists/${user.id}/${crypto.randomUUID()}-${coverFile.name}`;

        const { error } = await supabase.storage
          .from("covers")
          .upload(newCoverPath, coverFile);

        if (error) {
          throw new Error(
            `Cover upload error: ${error.message}`
          );
        }
      }

      if (audioFile) {
        const fileName = audioFile.name.toLowerCase();

        if (
          !fileName.endsWith(".mp3") &&
          !fileName.endsWith(".wav") &&
          !fileName.endsWith(".flac")
        ) {
          throw new Error(
            "Only MP3, WAV, and FLAC files are allowed."
          );
        }

        const maxSize =
          fileName.endsWith(".mp3")
            ? 15
            : 50;

        if (audioFile.size > maxSize * 1024 * 1024) {
          throw new Error(
            `${
              fileName.endsWith(".mp3")
                ? "MP3"
                : fileName.endsWith(".wav")
                  ? "WAV"
                  : "FLAC"
            } files must be ${maxSize} MB or smaller.`
          );
        }

        newAudioPath = `test/${user.id}/${crypto.randomUUID()}-${audioFile.name}`;

        const { error } = await supabase.storage
          .from("tracks")
          .upload(newAudioPath, audioFile);

        if (error) {
          throw new Error(
            `Audio upload error: ${error.message}`
          );
        }
      }

      if (newAudioPathInput) {
        newAudioPathInput.value = newAudioPath ?? "";
      }

      if (newCoverPathInput) {
        newCoverPathInput.value = newCoverPath ?? "";
      }

      form.requestSubmit();
    } catch (error) {
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

      alert(
        error instanceof Error
          ? error.message
          : "Unable to upload the selected files."
      );

      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={saving}
      className="rounded-xl bg-[#0286DC] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_18px_rgba(2,134,220,0.22)] transition hover:bg-[#1698EE] hover:shadow-[0_0_22px_rgba(2,134,220,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {saving ? "Saving..." : "Save Changes"}
    </button>
  );
}