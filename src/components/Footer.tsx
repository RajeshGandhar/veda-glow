export function Footer() {
  const exploreLinks = [
    { href: "#hero", label: "Home" },
    { href: "#solution", label: "28-Day Kit" },
    { href: "#how", label: "3-Step Routine" },
    { href: "#offer", label: "Limited Offer" },
  ] as const;

  const followLinks = [
    {
      href: "https://www.instagram.com/vedaglows/",
      label: "Instagram",
      external: true,
    },
    {
      href: "https://wa.me/919058964964",
      label: "WhatsApp",
      external: true,
    },
    { href: "#testimonials", label: "Customer Reviews", external: false },
  ] as const;

  return (
    <footer className="relative overflow-hidden bg-[linear-gradient(180deg,#f5f2e9_0%,#fbf9f2_48%,#ffffff_100%)] px-5 pb-8 pt-10 sm:px-8 sm:pb-12 sm:pt-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-14 top-0 h-56 w-56 rounded-full bg-emerald-100/55 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 translate-x-1/3 translate-y-1/3 rounded-full bg-[#e6d0a2]/35 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="rounded-[2.1rem] border border-[#e6dbc6] bg-[linear-gradient(180deg,#fffefb_0%,#f7f0e3_100%)] p-5 shadow-[0_34px_82px_-54px_rgba(15,23,42,0.48)] sm:p-8 md:p-10">
          <div className="grid gap-6 grid-cols-2 md:gap-9 md:grid-cols-[1.35fr_0.8fr_0.95fr_0.85fr]">
            <div className="col-span-2 md:col-span-1">
              <p className="font-serif text-[2.45rem] tracking-[-0.04em] text-[#10382d]">
                VedaGlow
              </p>
              <p className="mt-3 text-[0.72rem] font-semibold uppercase tracking-[0.27em] text-[#645133]">
                Ayurvedic Skincare Ritual
              </p>
              <p className="mt-5 max-w-sm text-sm leading-7 text-neutral-600">
                Premium herbal skincare designed for calm, balanced routines and
                healthy long-term skin confidence.
              </p>
              <p className="mt-6 inline-flex rounded-full border border-[#dccba6] bg-[#f8f0df] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#5d4a2d]">
                Since 2024 - Made for Indian skin
              </p>
            </div>

            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#645133]">
                Explore
              </p>
              <ul className="mt-5 space-y-3 text-sm text-neutral-600">
                {exploreLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="inline-flex items-center gap-2 transition-colors hover:text-[#1A1A1A]"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#d6be8f]" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#645133]">
                Contact
              </p>
              <div className="mt-5 space-y-3 text-sm text-neutral-600">
                <a
                  href="tel:+919058964964"
                  className="block rounded-xl border border-[#eadfcb] bg-white/70 px-3 py-2 transition-colors hover:text-[#1A1A1A]"
                >
                  +91 90589 64964
                </a>
                <a
                  href="mailto:vedaglows@gmail.com"
                  className="block break-all rounded-xl border border-[#eadfcb] bg-white/70 px-3 py-2 transition-colors hover:text-[#1A1A1A]"
                >
                  vedaglows@gmail.com
                </a>
                <p className="rounded-xl border border-[#eadfcb] bg-white/70 px-3 py-2">
                  Mon-Sat, 9:00 AM - 6:00 PM IST
                </p>
              </div>
            </div>

            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#645133]">
                Follow
              </p>
              <ul className="mt-5 space-y-3 text-sm text-neutral-600">
                {followLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="inline-flex items-center gap-2 transition-colors hover:text-[#1A1A1A]"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#d6be8f]" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-[#e6dbc8] bg-white/75 px-4 py-3 text-sm text-neutral-600">
            <p className="text-center md:text-left">
              Secure checkout and encrypted payments.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-[#e7ddca] pt-5 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} VedaGlow. All rights reserved.</p>
            <div className="flex flex-wrap gap-4 text-[0.72rem]">
              <a href="/privacy-policy" className="transition-colors hover:text-[#1A1A1A]">
                Privacy Policy
              </a>
              <a href="/cookie-policy" className="transition-colors hover:text-[#1A1A1A]">
                Cookie Policy
              </a>
              <a href="/terms-and-conditions" className="transition-colors hover:text-[#1A1A1A]">
                Terms & Conditions
              </a>
              <a href="/return-and-refund-policy" className="transition-colors hover:text-[#1A1A1A]">
                Return & Refund
              </a>
              <a href="/shipping-policy" className="transition-colors hover:text-[#1A1A1A]">
                Shipping Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
