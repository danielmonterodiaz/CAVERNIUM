import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Artist Profile — CAVERNIUM",
  robots: {
    index: false,
    follow: false,
  },
};

export default function EditArtistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}