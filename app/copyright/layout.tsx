import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Copyright & Intellectual Property — CAVERNIUM",
  description:
    "CAVERNIUM Copyright & Intellectual Property Policy.",
  alternates: {
    canonical: "https://cavernium.com/copyright",
  },
};

export default function CopyrightLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}