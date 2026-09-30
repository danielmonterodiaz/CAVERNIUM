"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import UploadGateButton from "@/app/components/UploadGateButton";

type MobileNavProps = {
  isLoggedIn: boolean;
  loggedArtistName: string | null;
};

export default function MobileNav({
  isLoggedIn,
  loggedArtistName,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);

  const supabase = createClient();

  const linkClass =
    "block border-b border-white/[0.06] py-2 font-sans text-xs font-medium uppercase tracking-[0.16em] text-white/65 transition hover:border-[#0286DC]/30 hover:text-[#5CCBFF] hover:drop-shadow-[0_0_6px_rgba(2,134,220,0.35)]";

  async function handleLogout() {
    const confirmed = window.confirm(
      "Are you sure you want to log out?"
    );

    if (!confirmed) return;

    await supabase.auth.signOut({ scope: "local" });
    window.location.href = "/";
  }

  return (
    <div className="relative z-[9999] ml-auto md:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Toggle menu"
        aria-expanded={open}
        className={`rounded-lg border px-4 py-2 font-sans text-[11px] font-medium uppercase tracking-[0.18em] transition ${
          open
            ? "border-[#0286DC]/50 bg-[#0286DC]/10 text-[#5CCBFF]"
            : "border-white/10 bg-black/80 text-white/70 hover:border-[#0286DC]/40 hover:text-[#5CCBFF]"
        }`}
      >
        {open ? "Close" : "Menu"}
      </button>

      {open && (
        <nav className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-xl border border-[#0286DC]/30 bg-[#03090D]/[0.98] shadow-[0_0_28px_rgba(2,134,220,0.12)]">
          <div className="h-px bg-gradient-to-r from-transparent via-[#0286DC]/70 to-transparent" />

          <div className="px-5 py-4">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-[10px] font-semibold tracking-[0.35em] text-white/80">
                C A V E R N I U M
              </span>
              <span className="h-px flex-1 bg-gradient-to-r from-[#0286DC]/40 to-transparent" />
            </div>

            <div className="flex flex-col">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className={linkClass}
              >
                Home
              </Link>

              <Link
                href="/discover"
                onClick={() => setOpen(false)}
                className={linkClass}
              >
                Discover
              </Link>

              <Link
                href="/rankings"
                onClick={() => setOpen(false)}
                className={linkClass}
              >
                Rankings
              </Link>

              <Link
                href="/artists"
                onClick={() => setOpen(false)}
                className={linkClass}
              >
                Artists
              </Link>

              <div className="border-b border-white/[0.06]">
                <UploadGateButton
                  isLoggedIn={isLoggedIn}
                  className={linkClass}
                />
              </div>

              {isLoggedIn ? (
                <>
                  <span className="py-3 text-[9px] font-medium uppercase tracking-[0.15em] text-[#5CCBFF]/50">
                    Logged as {loggedArtistName ?? "User"}
                  </span>

                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className={linkClass}
                  >
                    My Profile
                  </Link>

                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="cursor-pointer font-sans text-sm font-normal text-red-500 transition hover:text-red-400"
                    >
                      Log out
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className={linkClass}
                  >
                    Log in
                  </Link>

                  <Link
                    href="/signup"
                    onClick={() => setOpen(false)}
                    className={`${linkClass} border-b-0`}
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-[#6B35C8]/50 to-transparent" />
        </nav>
      )}
    </div>
  );
}