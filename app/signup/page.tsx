"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function SignUp() {
  const supabase = createClient();

  const [artistName, setArtistName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSignupPopup, setShowSignupPopup] = useState(false);

  async function handleSignUp(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setMessage("");

    if (!acceptedTerms) {
      setMessage(
        "You must confirm that you are at least 16 years old and accept the Terms & Conditions and Privacy Policy."
      );
      return;
    }

    setLoading(true);

    const cleanArtistName = artistName.trim();

    const { data: existingArtist, error: artistCheckError } =
      await supabase
        .from("artists")
        .select("id")
        .eq("artist_name", cleanArtistName)
        .maybeSingle();

    if (artistCheckError) {
      setMessage("Unable to verify artist name.");
      setLoading(false);
      return;
    }

    if (existingArtist) {
      setMessage(
        "This artist name is already registered. Please choose another one."
      );
      setLoading(false);
      return;
    }

    const { data, error } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            artist_name: cleanArtistName,
            terms_accepted: true,
            terms_version: "1.0",
            privacy_version: "1.0",
          },
        },
      });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (
      data.user &&
      (!data.user.identities ||
        data.user.identities.length === 0)
    ) {
      setMessage(
        "This email is already registered. Please log in instead."
      );
      setLoading(false);
      return;
    }

    window.gtag?.("event", "sign_up", {
      method: "email",
      artist_name: cleanArtistName,
    });

    setMessage(
      "Account created. Check your email to confirm your account."
    );

    setShowSignupPopup(true);
    setLoading(false);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-6 py-4 text-white">
      <img
        src="/icons/LOGO%20CAVERNIUM.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 w-[620px] -translate-x-1/2 -translate-y-1/2 opacity-[0.055]"
      />

      <div className="mx-auto max-w-md">
        <Link
          href="/"
          className="text-sm text-white/50 hover:text-white"
        >
          ← Back to CAVERNIUM
        </Link>

        <div className="mt-8 rounded-2xl border border-[#5CCBFF]/20 bg-[#071016]/55 p-8 shadow-[0_0_30px_rgba(2,134,220,0.08)]">
          <h1 className="text-3xl font-bold">
            Create your account
          </h1>

          <p className="mt-2 text-sm text-white/50">
            Join CAVERNIUM and discover AI new music.
          </p>

          <form
            onSubmit={handleSignUp}
            className="mt-8 space-y-5"
          >
            <div>
              <label className="mb-2 block text-sm text-white/70">
                Artist Name
              </label>

              <input
                type="text"
                value={artistName}
                onChange={(e) =>
                  setArtistName(e.target.value)
                }
                required
                maxLength={15}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/30"
                placeholder="Enter your artist name"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
                minLength={6}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/30"
              />
            </div>

            <div className="flex items-start gap-3 pt-1">
              <input
                id="termsAccepted"
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) =>
                  setAcceptedTerms(e.target.checked)
                }
                required
                className="mt-1 h-4 w-4 shrink-0 accent-[#5CCBFF]"
              />

              <label
                htmlFor="termsAccepted"
                className="text-xs leading-5 text-white/50"
              >
                I confirm that I am at least 16 years old and agree to the{" "}
                <Link
                  href="/terms"
                  className="text-[#5CCBFF] hover:text-white hover:underline"
                >
                  CAVERNIUM Global Terms & Conditions
                </Link>{" "}
                and acknowledge the{" "}
                <Link
                  href="/privacy"
                  className="text-[#5CCBFF] hover:text-white hover:underline"
                >
                  Privacy Policy
                </Link>
                .
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#5CCBFF] px-4 py-3 font-medium text-black shadow-[0_0_14px_rgba(92,203,255,0.25)] transition hover:bg-[#8DDCFF] disabled:opacity-50"
            >
              {loading
                ? "Creating account..."
                : "Sign up"}
            </button>
          </form>

          {message && (
            <p className="mt-5 text-sm text-white/70">
              {message}
            </p>
          )}

          <p className="mt-8 text-center text-sm text-white/50">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-white hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>

      {showSignupPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#5CCBFF]/25 bg-[#071016]/95 px-8 py-10 text-center shadow-[0_0_45px_rgba(2,134,220,0.18)]">
            <p className="text-sm font-medium uppercase tracking-[0.35em] text-[#5CCBFF]">
              You Are
            </p>

            <div className="mx-auto my-7 h-48 w-48 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_25px_rgba(92,203,255,0.12)]">
              <img
                src="/images/cavernium-artist-placeholder.png"
                alt="CAVERNIUM artist"
                className="h-full w-full object-cover"
              />
            </div>

            <p className="text-sm font-medium uppercase tracking-[0.35em] text-[#5CCBFF]">
              Now
            </p>

            <p className="mt-6 text-sm leading-6 text-white/60">
              Account created. Please check your email and confirm your account before logging in.
            </p>

            <Link
              href="/login"
              className="mt-8 inline-block font-sans text-xs font-medium uppercase tracking-wider text-[#0286DC] transition hover:text-[#5CCBFF] hover:drop-shadow-[0_0_6px_rgba(2,134,220,0.55)]"
            >
              Continue to Login
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
