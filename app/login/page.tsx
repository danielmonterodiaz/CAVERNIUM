"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      if (error.code === "email_not_confirmed") {
        setMessage(
          "Please confirm your email address before logging in. Check your inbox for the confirmation email."
        );
      } else {
        setMessage(error.message);
      }

      return;
    }

    window.location.href = "/";
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white flex items-center justify-center px-6">
      <img
        src="/icons/LOGO%20CAVERNIUM.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 w-[620px] -translate-x-1/2 -translate-y-1/2 opacity-[0.055]"
      />

      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <p className="text-lg font-semibold uppercase tracking-wide text-[#5CCBFF]">
            WHAT DESERVES TO BE HEARD
          </p>
        </div>

        <div className="rounded-2xl border border-[#5CCBFF]/20 bg-[#071016]/55 p-8 shadow-[0_0_30px_rgba(2,134,220,0.08)]">
          <h2 className="text-2xl font-bold">
            LOG IN TO CAVERNIUM
          </h2>

          <p className="mt-2 text-sm text-white/50">
            Log in to listen to music and join the community.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
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

            <div>
              <label className="mb-2 block text-sm text-white/60">
                Contraseña
              </label>

              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
                placeholder="••••••••"
              />

              <p className="mt-2 text-right text-sm text-white/50">
                <a
                  href="/forgot-password"
                  className="hover:text-white hover:underline"
                >
                  Forgot password?
                </a>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-white px-4 py-3 font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
            >
              {loading ? "Entrando..." : "LOG IN"}
            </button>
          </form>

          {message && (
            <p className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              {message}
            </p>
          )}

          <p className="mt-6 text-center text-sm text-white/50">
            Don't have an account?{" "}
            <a
              href="/signup"
              className="text-white hover:underline"
            >
              Sign up
            </a>
          </p>

          <p className="mt-4 text-center text-sm text-white/50">
            <a
              href="/"
              className="text-white hover:underline"
            >
              ← Back to CAVERNIUM
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}