import { useEffect, useMemo, useState } from "react";

const nav = [
  { href: "#hero", label: "Home" },
  { href: "#problem", label: "Why" },
  { href: "#solution", label: "Kit" },
  { href: "#how", label: "Routine" },
  { href: "#testimonials", label: "Reviews" },
  { href: "#offer", label: "Offer" },
];

type HeaderProps = {
  cartCount?: number;
  onCartClick?: () => void;
};

export function Header({
  cartCount = 0,
  onCartClick,
}: HeaderProps) {
  const sectionIds = useMemo(
    () => nav.map((item) => item.href.replace("#", "")),
    [],
  );
  const [activeId, setActiveId] = useState(sectionIds[0]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (!elements.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0),
          );

        if (!visible.length) return;
        const id = (visible[0].target as HTMLElement).id;
        setActiveId(id);
      },
      {
        threshold: [0.1, 0.2, 0.35],
        // Bias toward the top third for a snappier "active" highlight.
        rootMargin: "-20% 0px -65% 0px",
      },
    );

    for (const el of elements) io.observe(el);
    return () => io.disconnect();
  }, [sectionIds]);

  const handleNavClick = () => {
    setIsMenuOpen(false);
  };

  const navigateToAdmin = () => {
    setIsMenuOpen(false);
    window.history.pushState({}, "", "/login");
    window.dispatchEvent(new Event("app:navigate"));
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#dce7df] bg-white/70 shadow-[0_22px_44px_-42px_rgba(6,95,70,0.55)] backdrop-blur-xl transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-8 sm:py-4">
        <div className="flex items-center justify-between gap-2 md:gap-4">
          <div>
            <a
              href="#hero"
              className="min-w-0 shrink-0 font-serif text-[1.65rem] tracking-tight text-veda-green sm:text-[1.8rem]"
              onClick={handleNavClick}
            >
              VedaGlow
            </a>
          </div>

          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-4 text-sm font-medium text-neutral-700 md:flex lg:gap-7"
          >
            {nav.map((item) => {
              const id = item.href.replace("#", "");
              const isActive = activeId === id;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`relative pb-1 transition-colors duration-200 hover:text-veda-green ${
                    isActive ? "text-veda-green" : "text-neutral-700"
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute bottom-0 left-0 h-[2px] rounded-full bg-veda-green transition-all duration-200 ${
                      isActive ? "w-full opacity-100" : "w-0 opacity-0"
                    }`}
                  />
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={navigateToAdmin}
              className="hidden md:inline-flex min-h-10 items-center rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-veda-green shadow-[0_12px_24px_-20px_rgba(6,95,70,0.5)] transition-colors hover:bg-emerald-50"
            >
              Login
            </button>
            <button
              type="button"
              onClick={onCartClick}
              aria-label="Open cart"
              className="relative inline-flex min-h-10 items-center rounded-full bg-linear-to-r from-veda-green to-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_30px_-22px_rgba(6,95,70,0.65)] transition-all hover:from-emerald-700 hover:to-veda-green hover:shadow-[0_20px_32px_-20px_rgba(6,95,70,0.72)]"
            >
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-veda-gold px-1 text-xs font-bold text-[#173229] ring-2 ring-white">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              type="button"
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white/80 text-veda-green shadow-[0_14px_24px_-20px_rgba(6,95,70,0.45)] md:hidden"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                {isMenuOpen ? (
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                ) : (
                  <>
                    <path
                      d="M4 7h16"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M4 12h16"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M4 17h16"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        <div
          id="mobile-nav"
          className={`grid overflow-hidden transition-all duration-300 md:hidden ${
            isMenuOpen ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0">
            <nav
              aria-label="Mobile navigation"
              className="rounded-2xl border border-[#dbe6df] bg-white/90 p-4 shadow-[0_20px_40px_-34px_rgba(6,95,70,0.72)] backdrop-blur-md"
            >
              <div className="grid gap-2">
                {nav.map((item) => {
                  const id = item.href.replace("#", "");
                  const isActive = activeId === id;
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={handleNavClick}
                      className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-emerald-50 text-veda-green"
                          : "text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      {item.label}
                    </a>
                  );
                })}
                <button
                  type="button"
                  onClick={navigateToAdmin}
                  className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-left text-sm font-semibold text-veda-green transition-colors hover:bg-emerald-100"
                >
                  Login
                </button>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
