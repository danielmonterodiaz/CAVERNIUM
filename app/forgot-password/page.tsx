"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      "If an account exists with this email, you will receive a password reset link."
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white flex items-center justify-center px-6">
      <img
        src="/icons/LOGO%20CAVERNIUM.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 w-[620px] -translate-x-1/2 -translate-y-1/2 opacity-[0.055]"
      />

      <div className="relative z-10 w-full max-w-md">

        <div className="mb-10 text-center">
          <p className="text-lg font-semibold uppercase tracking-wide text-[#5CCBFF]">
            WHAT DESERVES TO BE HEARD
          </p>
        </div>

        <div className="rounded-2xl border border-[#5CCBFF]/20 bg-[#071016]/55 p-8 shadow-[0_0_30px_rgba(2,134,220,0.08)]">

          <h2 className="text-2xl font-bold">
            Reset your password
          </h2>

          <p className="mt-2 text-sm text-white/50">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>

          <form onSubmit={handleReset} className="mt-8 space-y-5">

            <div>
              <label className="mb-2 block text-sm text-white/60">
                Email
              </label>

              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
                placeholder="tu@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#5CCBFF] px-4 py-3 font-semibold text-black shadow-[0_0_14px_rgba(92,203,255,0.25)] transition hover:bg-[#8DDCFF] disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>

          </form>

          {message && (
            <p className="mt-5 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/70">
              {message}
            </p>
          )}

          <p className="mt-6 text-center text-sm text-white/50">
            <Link
              href="/login"
              className="text-white hover:underline"
            >
              ← Back to login
            </Link>
          </p>

        </div>

      </div>
    </main>
  );
}