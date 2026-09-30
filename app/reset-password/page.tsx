"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUpdatePassword(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Password updated successfully.");

    setTimeout(() => {
      router.push("/login");
    }, 1500);
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
            Create a new password
          </h2>

          <p className="mt-2 text-sm text-white/50">
            Enter your new password below.
          </p>

          <form
            onSubmit={handleUpdatePassword}
            className="mt-8 space-y-5"
          >
            <div>
              <label className="mb-2 block text-sm text-white/60">
                New password
              </label>

              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-[#5CCBFF]/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/60">
                Confirm new password
              </label>

              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-[#5CCBFF]/50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#5CCBFF] px-4 py-3 font-semibold text-black shadow-[0_0_14px_rgba(92,203,255,0.25)] transition hover:bg-[#8DDCFF] disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>

          {message && (
            <p className="mt-5 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/70">
              {message}
            </p>
          )}

        </div>

      </div>
    </main>
  );
}