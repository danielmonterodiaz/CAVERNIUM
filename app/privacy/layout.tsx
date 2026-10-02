import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — CAVERNIUM",
  description:
    "CAVERNIUM Privacy Policy covering personal information and data processing.",
  alternates: {
    canonical: "https://cavernium.com/privacy",
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}