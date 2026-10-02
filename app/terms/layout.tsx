import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Global Terms & Conditions — CAVERNIUM",
  description:
    "CAVERNIUM Global Terms & Conditions governing use of the platform.",
  alternates: {
    canonical: "https://cavernium.com/terms",
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}