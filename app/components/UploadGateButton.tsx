"use client";

import { useState } from "react";
import Link from "next/link";

type UploadGateButtonProps = {
  isLoggedIn: boolean;
  className?: string;
};

export default function UploadGateButton({
  isLoggedIn,
  className="cursor-pointer transition hover:text-white",
}: UploadGateButtonProps) {
  const [showModal, setShowModal] = useState(false);

  function handleUploadClick() {
    if (isLoggedIn) {
      window.location.href = "/upload";
      return;
    }

    setShowModal(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleUploadClick}
        className={className}
      >
        Upload
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="w-full max-w-md -translate-x-8 rounded-2xl border border-white/10 bg-[#111111] p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-white">
              Log in required
            </h2>

            <p className="mt-3 text-sm leading-6 text-white/60">
              You need to be logged in to upload music to CAVERNIUM.
            </p>

            <div className="mt-6 flex gap-3">
              <Link
                href="/login"
                className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                Log in
              </Link>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Continue as guest
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}