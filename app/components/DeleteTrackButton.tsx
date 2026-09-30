"use client";

import { useState } from "react";

type DeleteTrackButtonProps = {
  trackTitle: string;
  action: () => void;
};

export default function DeleteTrackButton({
  trackTitle,
  action,
}: DeleteTrackButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (showConfirm) {
    return (
      <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
        <p className="text-sm text-white">
          You are about to permanently delete{" "}
          <strong>“{trackTitle}”</strong> of CAVERNIUM.
        </p>

        <p className="mt-2 text-xs text-white/50">
          This action cannot be undone.
        </p>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => setShowConfirm(false)}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={action}
            className="rounded-lg border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-300 transition hover:border-red-400 hover:bg-red-500/10 hover:text-red-200"
          >
            Delete Track
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShowConfirm(true)}
      className="rounded-lg border border-red-500/40 px-6 py-3 font-semibold text-red-300 transition hover:border-red-400 hover:bg-red-500/10 hover:text-red-200"
    >
      Delete Track
    </button>
  );
}