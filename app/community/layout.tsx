import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Music Community — CAVERNIUM",
  description:
    "Explore the CAVERNIUM community for artists and listeners discovering music created or transformed with AI.",
  alternates: {
    canonical: "https://cavernium.com/community",
  },
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}