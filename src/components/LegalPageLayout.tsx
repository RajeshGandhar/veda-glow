import type { ReactNode } from "react";

type LegalPageLayoutProps = {
  title: string;
  lastUpdated: string;
  children: ReactNode;
};

const legalLinks = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/cookie-policy", label: "Cookie Policy" },
  { href: "/terms-and-conditions", label: "Terms & Conditions" },
  { href: "/return-and-refund-policy", label: "Return & Refund Policy" },
  { href: "/shipping-policy", label: "Shipping Policy" },
] as const;

export function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#f8f5ee_0%,#ffffff_100%)] px-4 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-4xl rounded-3xl border border-[#e7dcc6] bg-white p-6 shadow-[0_32px_80px_-56px_rgba(15,23,42,0.55)] sm:p-8 md:p-10">
        <header className="mb-8 border-b border-[#ece3d1] pb-6">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#655335]">
            VedaGlow Legal
          </p>
          <h1 className="mt-3 font-serif text-3xl leading-tight text-[#173229] sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-neutral-600">
            <strong>Last Updated:</strong> {lastUpdated}
          </p>
        </header>

        <article className="space-y-7 text-[15px] leading-7 text-neutral-700 sm:text-base sm:leading-8">
          {children}
        </article>

        <footer className="mt-10 border-t border-[#ece3d1] pt-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600">
            <a href="/" className="font-semibold text-veda-green hover:underline">
              Back to Home
            </a>
            {legalLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:underline">
                {link.label}
              </a>
            ))}
          </div>
        </footer>
      </div>
    </main>
  );
}

