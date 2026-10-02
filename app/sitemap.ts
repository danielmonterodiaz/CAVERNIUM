import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: "https://cavernium.com",
    },
    {
      url: "https://cavernium.com/artists",
    },
    {
      url: "https://cavernium.com/discover",
    },
    {
      url: "https://cavernium.com/rankings",
    },
    {
      url: "https://cavernium.com/community",
    },
    {
      url: "https://cavernium.com/privacy",
    },
    {
      url: "https://cavernium.com/terms",
    },
    {
      url: "https://cavernium.com/copyright",
    },
  ];

  const { data: tracks } = await supabase
    .from("tracks")
    .select("artist_id")
    .not("artist_id", "is", null);

  const artistIds = Array.from(
    new Set((tracks ?? []).map((track) => track.artist_id))
  );

  const artistPages: MetadataRoute.Sitemap = artistIds.map((artistId) => ({
    url: `https://cavernium.com/artists/${artistId}`,
  }));

  return [...staticPages, ...artistPages];
}