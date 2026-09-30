"use client";

import { createClient } from "@/lib/supabase";

export default function LogoutButton() {
  async function handleLogout() {
    const confirmed = window.confirm(
      "Are you sure you want to log out?"
    );

    if (!confirmed) return;

    const supabase = createClient();

    await supabase.auth.signOut({ scope: "local" });
    window.location.href = "/";
  }

  return (
    <button
      onClick={handleLogout}
      style={{ color: "#C084FC" }}
      className="cursor-pointer font-sans text-sm font-normal text-violet-200 transition hover:text-violet-300"
    >
      Log out
    </button>
  );
}