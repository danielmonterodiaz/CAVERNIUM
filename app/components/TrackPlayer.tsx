"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

let activeAudio: HTMLAudioElement | null = null;

type TrackPlayerProps = {
  trackId: string;
  title: string;
  artist: string;
  genre: string;
  description: string;
  audioUrl: string;
  durationSeconds: number;
  coverUrl?: string;
  compact?: boolean;
  hideCover?: boolean;
  ratingPortalTarget?: HTMLElement | null;
  ratingInsidePlayer?: boolean;
};

type ExistingRating = {
  id: string;
  score: number;
  listened_percent: number;
  is_revaluation: boolean | null;
  original_score: number | null;
};

export default function TrackPlayer({
  trackId,
  title,
  artist,
  genre,
  description,
  audioUrl,
  durationSeconds,
  coverUrl,
  compact = false,
  hideCover = false,
  ratingPortalTarget = null,
  ratingInsidePlayer = false,
}: TrackPlayerProps) {
  const supabase = createClient();

  const audioRef = useRef<HTMLAudioElement>(null);
  const listenIdRef = useRef<string | null>(null);
  const sessionStartedAtRef = useRef<string | null>(null);
  const listenCreatedRef = useRef(false);
  const lastListenUpdateRef = useRef(0);
  const playAnalyticsSentRef = useRef(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const [showRating, setShowRating] = useState(false);
  const [showSaveLogin, setShowSaveLogin] = useState(false);
  const [selectedScore, setSelectedScore] =
    useState<number | null>(null);

  const [existingRating, setExistingRating] =
    useState<ExistingRating | null>(null);

  const [revaluationStartTime, setRevaluationStartTime] =
    useState<number | null>(null);

  const [loadingRating, setLoadingRating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOwnTrack, setIsOwnTrack] = useState(false);
  const [language, setLanguage] = useState("Unknown Language");
  const [saving, setSaving] = useState(false);
  const [ratingSaved, setRatingSaved] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savingSave, setSavingSave] = useState(false);
  const [error, setError] = useState("");
  const resolvedAudioUrlRef = useRef("");

  /*
   * Cargar la valoración del usuario para el track actual.
   */
  useEffect(() => {
    async function loadExistingRating() {
      setLoadingRating(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      setIsAuthenticated(!!user);

      const { data: trackData, error: trackError } =
        await supabase
          .from("tracks")
          .select("artist_id")
          .eq("id", trackId)
          .single();

      if (trackError) {
        console.error(
          "Error loading track owner:",
          trackError
        );
        setIsOwnTrack(false);
      } else {
        setIsOwnTrack(
          !!user && user.id === trackData?.artist_id
        );
      }

      if (!user) {
        setExistingRating(null);
        setSelectedScore(null);
        setLoadingRating(false);
        return;
      }

      const { data, error } = await supabase
        .from("ratings")
        .select(
          "id, score, listened_percent, is_revaluation, original_score"
        )
        .eq("track_id", trackId)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(
          "Error loading rating:",
          error
        );
      }

      setExistingRating(data ?? null);
      setSelectedScore(data?.score ?? null);
      setLoadingRating(false);
    }

    loadExistingRating();
  }, [trackId]);

  useEffect(() => {
    async function loadExistingSave() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsSaved(false);
        return;
      }

      const { data, error } = await supabase
        .from("saves")
        .select("id")
        .eq("track_id", trackId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error(
          "Error loading save:",
          error
        );
        setIsSaved(false);
        return;
      }

      setIsSaved(!!data);
    }

    loadExistingSave();
  }, [trackId]);

  async function toggleSave() {
    if (savingSave) return;

    setSavingSave(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setShowSaveLogin(true);
      setSavingSave(false);
      return;
    }

    if (isSaved) {
      const { error: deleteError } = await supabase
        .from("saves")
        .delete()
        .eq("track_id", trackId)
        .eq("user_id", user.id);

      if (deleteError) {
        setError(deleteError.message);
        setSavingSave(false);
        return;
      }

      setIsSaved(false);
    } else {
      const { error: insertError } = await supabase
        .from("saves")
        .insert({
          track_id: trackId,
          user_id: user.id,
        });

      if (insertError) {
        setError(insertError.message);
        setSavingSave(false);
        return;
      }

            setIsSaved(true);

      window.gtag?.("event", "track_save", {
        track_id: trackId,
        track_title: title,
        artist_name: artist,
        genre,
      });
    }

    setSavingSave(false);
  }

  useEffect(() => {
    async function loadTrackLanguage() {
      const { data, error } = await supabase
        .from("tracks")
        .select("language")
        .eq("id", trackId)
        .single();

      if (error) {
        console.error(
          "Error loading track language:",
          error
        );
        setLanguage("Unknown Language");
        return;
      }

      setLanguage(
        data?.language ?? "Unknown Language"
      );
    }

    loadTrackLanguage();
  }, [trackId]);

  /*
   * Reiniciar la sesión de escucha cada vez que cambia
   * la canción seleccionada.
   */
  useEffect(() => {
    const audio = audioRef.current;

    listenIdRef.current = null;
    sessionStartedAtRef.current = null;
    listenCreatedRef.current = false;
    lastListenUpdateRef.current = 0;
    playAnalyticsSentRef.current = false;

    setCurrentTime(0);
    setIsPlaying(false);
    setShowRating(false);
    setRatingSaved(false);
    setIsSaved(false);
    setError("");
    setRevaluationStartTime(null);
    resolvedAudioUrlRef.current =
      audioUrl || "";

    if (audio) {
      if (activeAudio === audio) {
        activeAudio = null;
      }

      audio.pause();
      audio.currentTime = 0;
      audio.load();
    }
  }, [trackId, audioUrl]);

  const listenedPercent =
    durationSeconds > 0
      ? Math.min(
          100,
          Math.round(
            (currentTime / durationSeconds) * 100
          )
        )
      : 0;

  const newListeningPercent =
    existingRating &&
    revaluationStartTime !== null
      ? Math.max(
          0,
          Math.round(
            ((currentTime - revaluationStartTime) /
              durationSeconds) *
              100
          )
        )
      : 0;

  const canRate = existingRating
    ? newListeningPercent >= 10
    : listenedPercent >= 30;

  async function registerListenIfNeeded(
    time: number
  ) {
    if (listenCreatedRef.current) return;

    const threshold = Math.min(
      10,
      durationSeconds * 0.1
    );

    if (time < threshold) return;

    listenCreatedRef.current = true;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      listenCreatedRef.current = false;
      return;
    }

    const percent = Math.min(
      100,
      Math.round(
        (time / durationSeconds) * 100
      )
    );

    const { data: currentVersion } = await supabase
      .from("track_versions")
      .select("id")
      .eq("track_id", trackId)
      .eq("is_current", true)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } =
      await supabase
        .from("listens")
        .insert({
          track_id: trackId,
          track_version_id: currentVersion?.id ?? null,
          user_id: user.id,
          started_at:
            sessionStartedAtRef.current ??
            new Date().toISOString(),
          listened_seconds:
            Math.floor(time),
          listened_percent: percent,
          completed: false,
        })
        .select("id")
        .single();

    if (error) {
      console.error(
        "Error registering listen:",
        error
      );

      listenCreatedRef.current = false;
      return;
    }

    listenIdRef.current = data.id;
    listenCreatedRef.current = true;
  }

  /*
   * Eventos del reproductor.
   *
   * Importante:
   * este efecto depende de trackId para que las funciones
   * trabajen siempre con la canción actualmente seleccionada.
   */
  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    async function handleTimeUpdate() {
      const time =
        audioRef.current?.currentTime ?? 0;

      setCurrentTime(time);

      await registerListenIfNeeded(time);

      if (
        listenIdRef.current &&
        time -
          lastListenUpdateRef.current >=
          5
      ) {
        lastListenUpdateRef.current =
          time;

        const percent = Math.min(
          100,
          Math.round(
            (time / durationSeconds) * 100
          )
        );

        const { error } = await supabase
          .from("listens")
          .update({
            listened_seconds:
              Math.floor(time),
            listened_percent: percent,
          })
          .eq(
            "id",
            listenIdRef.current
          );

        if (error) {
          console.error(
            "Error updating listen:",
            error
          );
        }
      }
    }

    function handlePlay() {
      setIsPlaying(true);

      if (
        !playAnalyticsSentRef.current &&
        typeof window !== "undefined" &&
        typeof window.gtag === "function"
      ) {
        playAnalyticsSentRef.current = true;

        window.gtag(
          "event",
          "track_play",
          {
            track_id: trackId,
            track_title: title,
            artist_name: artist,
            genre,
          }
        );
      }
    }

    function handlePause() {
      setIsPlaying(false);
    }

    async function handleEnded() {
      setIsPlaying(false);

      if (!listenIdRef.current) return;

      const { error } = await supabase
        .from("listens")
        .update({
          listened_seconds:
            Math.floor(durationSeconds),
          listened_percent: 100,
          completed: true,
        })
        .eq(
          "id",
          listenIdRef.current
        );

      if (error) {
        console.error(
          "Error completing listen:",
          error
        );
      }

      listenIdRef.current = null;
      sessionStartedAtRef.current = null;
      listenCreatedRef.current = false;
      lastListenUpdateRef.current = 0;
    }

    audio.addEventListener(
      "timeupdate",
      handleTimeUpdate
    );

    audio.addEventListener(
      "play",
      handlePlay
    );

    audio.addEventListener(
      "pause",
      handlePause
    );

    audio.addEventListener(
      "ended",
      handleEnded
    );

    return () => {
      audio.removeEventListener(
        "timeupdate",
        handleTimeUpdate
      );

      audio.removeEventListener(
        "play",
        handlePlay
      );

      audio.removeEventListener(
        "pause",
        handlePause
      );

      audio.removeEventListener(
        "ended",
        handleEnded
      );
    };
  }, [trackId, durationSeconds, title, artist, genre]);

  async function togglePlay() {
    const audio = audioRef.current;

    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      return;
    }

    try {
      if (
        activeAudio &&
        activeAudio !== audio
      ) {
        activeAudio.pause();
      }

      activeAudio = audio;

      let url =
        resolvedAudioUrlRef.current;

      if (!url) {
        const {
          data: track,
          error: trackError,
        } = await supabase
          .from("tracks")
          .select("audio_url")
          .eq("id", trackId)
          .single();

        if (
          trackError ||
          !track?.audio_url
        ) {
          throw new Error(
            trackError?.message ??
              "Unable to load the audio file."
          );
        }

        const {
          data: signedData,
          error: signedError,
        } = await supabase.storage
          .from("tracks")
          .createSignedUrl(
            track.audio_url,
            3600
          );

        if (
          signedError ||
          !signedData?.signedUrl
        ) {
          throw new Error(
            signedError?.message ??
              "Unable to create the audio URL."
          );
        }

        url = signedData.signedUrl;
        resolvedAudioUrlRef.current =
          url;
      }

      if (audio.src !== url) {
        audio.src = url;
        audio.load();
      }

      await audio.play();
    } catch (playError) {
      if (
        playError instanceof DOMException &&
        playError.name === "AbortError"
      ) {
        return;
      }

      console.error(
        "Error playing track:",
        playError
      );

      setError(
        playError instanceof Error
          ? playError.message
          : "Unable to play this track."
      );
    }
  }

  async function publishRating() {
    if (selectedScore === null) return;

    setSaving(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError(
        "You need to sign in to rate a track."
      );
      setSaving(false);
      return;
    }

    if (existingRating) {
      const originalScore =
        existingRating.original_score ??
        existingRating.score;

      const {
        data,
        error: updateError,
      } = await supabase
        .from("ratings")
        .update({
          score: selectedScore,
          revaluation_listened_percent:
            newListeningPercent,
          is_revaluation: true,
          original_score: originalScore,
          revalued_at:
            new Date().toISOString(),
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          existingRating.id
        )
        .select(
          "id, score, listened_percent, revaluation_listened_percent, is_revaluation, original_score"
        )
        .single();

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }

      window.gtag?.("event", "track_rate", {
        track_id: trackId,
        track_title: title,
        artist_name: artist,
        genre,
        score: data.score,
        is_revaluation: true,
      });

      setExistingRating(data);
      setSelectedScore(data.score);
      setShowRating(false);
      setRatingSaved(true);
      setSaving(false);

      return;
    }

    const {
      data,
      error: insertError,
    } = await supabase
      .from("ratings")
      .insert({
        track_id: trackId,
        user_id: user.id,
        score: selectedScore,
        listened_percent: listenedPercent,
        is_revaluation: false,
      })
      .select(
        "id, score, listened_percent, is_revaluation, original_score"
      )
      .single();

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    window.gtag?.("event", "track_rate", {
      track_id: trackId,
      track_title: title,
      artist_name: artist,
      genre,
      score: data.score,
      is_revaluation: false,
    });

    setExistingRating(data);
    setRatingSaved(true);
    setShowRating(false);
    setSaving(false);
  }

  function formatTime(seconds: number) {
    const minutes = Math.floor(
      seconds / 60
    );

    const remainingSeconds =
      Math.floor(seconds % 60);

    return `${minutes}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }

  const compactExistingRatingCard =
    compact &&
    hideCover &&
    !loadingRating &&
    existingRating &&
    !showRating &&
    !isOwnTrack ? (
      <div className="w-full rounded-xl border border-white/10 bg-black/60 p-3">
        <p className="text-xs text-white/40">
          Your rating
        </p>

        <p className="mt-1 text-lg font-bold">
          ★ {existingRating.score}/10
        </p>

        {!existingRating.is_revaluation && (
          <button
            onClick={() => {
              setSelectedScore(existingRating.score);
              setRatingSaved(false);
              setError("");
              setRevaluationStartTime(currentTime);
              setShowRating(true);
            }}
            className="mt-2 w-full rounded-lg border border-white/20 px-1 py-1.5 text-[10px] font-semibold transition hover:border-[#0286DC] hover:bg-[#0286DC]/10 hover:text-white"
          >
            Change
          </button>
        )}

        <p className="mt-2 text-[9px] leading-tight text-white/40">
          {existingRating.is_revaluation
            ? "Rating updated"
            : "You already rated this track"}
        </p>
      </div>
    ) : null;

  return (
    <div
      className={`relative flex min-h-0 items-start overflow-hidden rounded-2xl border border-white/10 ${
        compact
          ? "bg-black/10"
          : "bg-black"
      } md:items-start ${
        compact
          ? ""
          : "md:min-h-[440px]"
      }`}
    >
      {!hideCover && (
        <div
          className={`${
            compact ? "w-14" : "w-16"
          } shrink-0 md:w-32`}
        >
          <div
            className={`${
              compact
                ? "h-14 md:h-32"
                : "h-16"
            }`}
          >
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={`Cover de ${title}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-4xl md:text-7xl">
                  🎵
                </span>
              </div>
            )}
          </div>

          {compact &&
            !loadingRating &&
            isAuthenticated &&
            !isOwnTrack &&
            !existingRating &&
            !canRate && (
              <p className="ml-2 mt-2 text-[11px] leading-tight text-purple-300/60">
                Listen{" "}
                {Math.max(
                  0,
                  30 - listenedPercent
                )}
                % more to rate
              </p>
            )}

          {compact &&
            !hideCover &&
            !loadingRating &&
            existingRating &&
            !showRating &&
            !isOwnTrack && (
              <div className="mx-0 mt-4 w-full rounded-xl border border-white/10 bg-black/60 p-2 md:p-3">
                <p className="text-[11px] text-white/40">
                  Your rating
                </p>

                <p className="mt-1 text-lg font-bold md:text-xl">
                  ★ {existingRating.score}/10
                </p>

                {!existingRating.is_revaluation && (
                  <button
                    onClick={() => {
                      setSelectedScore(existingRating.score);
                      setRatingSaved(false);
                      setError("");
                      setRevaluationStartTime(currentTime);
                      setShowRating(true);
                    }}
                    className="mt-2 box-border w-[calc(100%-4px)] rounded-lg border border-white/20 px-0 py-1.5 text-[9px] font-semibold transition hover:border-[#0286DC] hover:bg-[#0286DC]/10 hover:text-white"
                  >
                    Change
                  </button>
                )}

                <p className="mt-2 text-[9px] leading-tight text-white/40">
                  {existingRating.is_revaluation
                    ? "Rating updated"
                    : "You already rated this track"}
                </p>
              </div>
            )}
        </div>
      )}

      <div
        className={`min-w-0 flex-1 ${
          compact ? "p-3" : "p-3 md:p-5"
        }`}
      >
        <h1
          className={`mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-sans font-medium leading-tight ${
            compact
              ? "text-lg md:text-xl"
              : "text-xl md:mt-2 md:text-2xl"
          }`}
        >
          <span className="break-words">
            {title}
          </span>

          <span className="text-white/30">
            |
          </span>

          <span className="text-[10px] font-normal text-white/40 md:text-xs">
            {artist}
          </span>
        </h1>

        <p className="mt-1 font-sans text-xs font-normal text-white/50 md:mt-1">
          {genre} · {language}
        </p>

        <p
          className={`${
            compact
              ? "hidden"
              : "mt-2 hidden line-clamp-2 break-words overflow-hidden text-xs text-white/60 md:block md:text-sm"
          }`}
        >
          {description}
        </p>

        <audio
          ref={audioRef}
          src={undefined}
          preload="none"
        />

        <div
          className={`${
            compact
              ? "mt-2 md:mt-2"
              : "mt-4 md:mt-8"
          }`}
        >
          <button
            onClick={togglePlay}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#5CCBFF] text-lg text-black shadow-[0_0_12px_rgba(92,203,255,0.35)] transition hover:scale-105 md:h-12 md:w-12 md:text-xl"
          >
            {isPlaying ? "❚❚" : "▶"}
          </button>

          <div className="mt-2 md:mt-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full bg-white transition-all"
                style={{
                  width: `${
                    durationSeconds > 0
                      ? (currentTime /
                          durationSeconds) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>

            <div className="mt-1 flex justify-between text-[10px] text-white/40 md:text-xs">
              <span>
                {formatTime(currentTime)}
              </span>

              <span>
                {formatTime(durationSeconds)}
              </span>
            </div>
          </div>
        </div>

        {compact && isAuthenticated && !isOwnTrack && (
          <div className="mt-2 border-t border-white/10 pt-2">
            <div className="mb-0.5 flex items-center justify-between text-[10px] text-white/40">
              <span>LISTENED</span>
              <span>{listenedPercent}%</span>
            </div>

            <div className="h-1 w-[calc(100%_-_4px)] overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-white transition-all"
                style={{
                  width: `${listenedPercent}%`,
                }}
              />
            </div>
          </div>
        )}

        {ratingInsidePlayer &&
          compactExistingRatingCard &&
          !ratingPortalTarget && (
            <div className="mb-2 md:hidden">
              {compactExistingRatingCard}
            </div>
          )}

        <div
          className={`${
            compact
              ? "mt-2"
              : "mt-4"
          } flex gap-2 md:mt-3`}
        >
          <button
            onClick={toggleSave}
            disabled={savingSave}
            className="flex-1 rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold transition hover:border-[#0286DC] hover:bg-[#0286DC]/10 hover:text-white disabled:opacity-50"
          >
            {savingSave
              ? "Saving..."
              : isSaved
                ? "♥ Saved"
                : "♡ Save"}
          </button>
        </div>

        {!isOwnTrack && (
          <div className="mt-1 border-t border-white/10 pt-1 md:mt-2 md:pt-2">
            {!compact &&
              !loadingRating &&
              existingRating &&
              !showRating && (
                <div className="mt-4 rounded-xl border border-white/10 bg-black/60 p-3 md:p-4">
                  <p className="text-xs text-white/40">
                    Your rating
                  </p>

                  <p className="mt-1 text-xl font-bold md:text-2xl">
                    ★ {existingRating.score}/10
                  </p>

                  {!existingRating.is_revaluation && (
                    <button
                      onClick={() => {
                        setSelectedScore(
                          existingRating.score
                        );
                        setRatingSaved(false);
                        setError("");
                        setRevaluationStartTime(
                          currentTime
                        );
                        setShowRating(true);
                      }}
                      className="mt-2 w-full rounded-lg border border-white/20 px-2 py-1.5 text-[10px] font-semibold transition hover:border-[#0286DC] hover:bg-[#0286DC]/10 hover:text-white"
                    >
                      Change
                    </button>
                  )}

                  <p className="mt-2 text-[10px] leading-tight text-white/40">
                    {existingRating.is_revaluation
                      ? "Rating updated"
                      : "You already rated this track"}
                  </p>
                </div>
              )}

            {compactExistingRatingCard &&
              !ratingPortalTarget &&
              (ratingInsidePlayer ? (
                <div className="hidden md:block">
                  {compactExistingRatingCard}
                </div>
              ) : (
                compactExistingRatingCard
              ))}

            {!loadingRating &&
              !isAuthenticated && (
                <div
                  className={`${
                    compact
                      ? hideCover
                        ? "absolute right-3 top-1/2 z-10 w-32 -translate-y-1/2"
                        : "absolute left-0 top-[140px] z-10 w-32"
                      : "mt-4"
                  } rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white/50`}
                >
                  <span className="text-white/70">
                    Want to rate this track?
                  </span>{" "}
                  <Link
                    href="/login"
                    className="text-white underline hover:no-underline"
                  >
                    Sign in to participate.
                  </Link>
                </div>
              )}

            {!loadingRating &&
              !existingRating &&
              canRate &&
              !showRating &&
              !ratingSaved && (
                <button
                  onClick={() =>
                    setShowRating(true)
                  }
                  className="mt-4 w-full rounded-xl border border-[#5CCBFF]/70 bg-[#071016]/80 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-[#5CCBFF] shadow-[0_0_18px_rgba(2,134,220,0.20),inset_0_0_18px_rgba(92,203,255,0.05)] transition hover:border-[#5CCBFF] hover:bg-[#0286DC]/15 hover:text-white hover:shadow-[0_0_30px_rgba(92,203,255,0.38)]"
                >
                  ★ Rate track
                </button>
              )}
          </div>
        )}
      </div>

      {compactExistingRatingCard &&
        ratingPortalTarget &&
        createPortal(
          compactExistingRatingCard,
          ratingPortalTarget
        )}

      {showSaveLogin &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-sm rounded-2xl border border-[#5CCBFF]/30 bg-[#071016] p-6 shadow-[0_0_35px_rgba(92,203,255,0.12)]">
              <div className="mb-4 flex justify-center">
                <img
                  src="/icons/LOGO%20CAVERNIUM.png"
                  alt="CAVERNIUM"
                  className="h-auto w-28 opacity-70"
                />
              </div>

              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-wider text-[#5CCBFF]">
                  Sign In Required
                </p>

                <p className="mt-3 text-sm leading-relaxed text-white/60">
                  You need to sign in to save a track.
                </p>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setShowSaveLogin(false)
                  }
                  className="flex-1 rounded-lg border border-white/15 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white/60 transition hover:border-white/30 hover:text-white"
                >
                  Cancel
                </button>

                <Link
                  href="/login"
                  onClick={() =>
                    setShowSaveLogin(false)
                  }
                  className="flex-1 rounded-lg bg-[#5CCBFF] px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-black transition hover:bg-[#8DDCFF]"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>,
          document.body
        )}

      {showRating &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="relative max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-white/15 bg-neutral-950 p-5 shadow-2xl">
              <div className="mb-3 flex justify-center">
                <img
                  src="/icons/LOGO%20CAVERNIUM.png"
                  alt="CAVERNIUM"
                  className="h-auto w-36 opacity-60"
                />
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold">
                    {existingRating
                      ? "CHANGE RATING"
                      : "What did you think?"}
                  </p>

                  <p className="mt-1 text-sm text-white/50">
                    {title}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowRating(false);
                    setError("");
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                  ×
                </button>
              </div>

              <p className="mt-4 text-xs text-white/40">
                Choose a score from 1 to 10.
              </p>

              {existingRating &&
                revaluationStartTime !== null && (
                  <p className="mt-2 text-xs text-[#0286DC]">
                    New listening for re-rating:{" "}
                    {newListeningPercent}% / 10%
                  </p>
                )}

              <div className="mt-4 grid grid-cols-5 gap-2">
                {[
                  1,
                  2,
                  3,
                  4,
                  5,
                  6,
                  7,
                  8,
                  9,
                  10,
                ].map((score) => (
                  <button
                    key={score}
                    onClick={() =>
                      setSelectedScore(score)
                    }
                    className={`rounded-lg border px-2 py-2.5 text-sm font-semibold transition ${
                      selectedScore === score
                        ? "border-[#0286DC] bg-[#0286DC] text-white"
                        : "border-white/10 bg-black text-white hover:border-white/40"
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>

              {selectedScore !== null && (
                <div className="mt-4 rounded-xl border border-white/10 bg-black p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-white/40">
                        Your rating
                      </p>

                      <p className="mt-1 text-3xl font-bold">
                        ★ {selectedScore}/10
                      </p>
                    </div>

                    <button
                      onClick={publishRating}
                      disabled={
                        saving || !canRate
                      }
                      className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
                    >
                      {saving
                        ? "Saving..."
                        : existingRating
                          ? canRate
                            ? "Update"
                            : `Listen ${Math.max(
                                0,
                                10 -
                                  newListeningPercent
                              )}% more`
                          : "Submit"}
                    </button>
                  </div>

                  {error && (
                    <p className="mt-3 text-xs text-red-400">
                      {error}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}