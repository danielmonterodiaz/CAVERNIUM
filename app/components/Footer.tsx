import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-black/20">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <p className="font-sans text-xs text-white/40">
          © {new Date().getFullYear()} CAVERNIUM. All rights reserved.
        </p>

        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link
            href="/terms"
            className="font-sans text-xs font-medium uppercase tracking-wider text-[#0286DC] transition hover:text-[#5CCBFF] hover:drop-shadow-[0_0_6px_rgba(2,134,220,0.55)]"
          >
            Terms
          </Link>

          <Link
            href="/privacy"
            className="font-sans text-xs font-medium uppercase tracking-wider text-[#0286DC] transition hover:text-[#5CCBFF] hover:drop-shadow-[0_0_6px_rgba(2,134,220,0.55)]"
          >
            Privacy
          </Link>

          <Link
            href="/copyright"
            className="font-sans text-xs font-medium uppercase tracking-wider text-[#0286DC] transition hover:text-[#5CCBFF] hover:drop-shadow-[0_0_6px_rgba(2,134,220,0.55)]"
          >
            Copyright
          </Link>

          <Link
            href="/community"
            className="font-sans text-xs font-medium uppercase tracking-wider text-[#0286DC] transition hover:text-[#5CCBFF] hover:drop-shadow-[0_0_6px_rgba(2,134,220,0.55)]"
          >
            Community
          </Link>
        </nav>
      </div>
    </footer>
  );
}