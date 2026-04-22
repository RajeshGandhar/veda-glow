import { SectionCta } from "./BuyNowButton";

export function IconAcne({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="18" cy="20" r="1.5" fill="currentColor" />
      <circle cx="28" cy="22" r="1.5" fill="currentColor" />
      <circle cx="22" cy="28" r="1.5" fill="currentColor" />
      <path
        d="M16 32c2 2 5 3 8 3s6-1 8-3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconOil({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M24 8l-4 12h8l-4-12z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M14 28c0 5.5 4.5 10 10 10s10-4.5 10-10c0-3-2-6-4-8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="20" cy="22" r="1.2" fill="currentColor" opacity="0.5" />
      <circle cx="28" cy="24" r="1" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

function IconDull({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
      <path
        d="M24 12v4M24 32v4M12 24h4M32 24h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <circle cx="24" cy="24" r="6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function IconGlow({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <line x1="24" y1="8" x2="24" y2="14" />
        <line x1="24" y1="34" x2="24" y2="40" />
        <line x1="8" y1="24" x2="14" y2="24" />
        <line x1="34" y1="24" x2="40" y2="24" />
        <line x1="13" y1="13" x2="17" y2="17" />
        <line x1="31" y1="31" x2="35" y2="35" />
        <line x1="13" y1="35" x2="17" y2="31" />
        <line x1="31" y1="17" x2="35" y2="13" />
      </g>
      <circle cx="24" cy="24" r="8" fill="currentColor" opacity="0.2" />
      <circle cx="24" cy="24" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="24" cy="24" r="2" fill="currentColor" />
    </svg>
  );
}

const concerns = [
  {
    Icon: IconAcne,
    title: "Breakouts that keep coming back",
    text: "New acne appears even after switching products and routines.",
  },
  {
    Icon: IconOil,
    title: "Midday oil and clogged pores",
    text: "Skin feels shiny fast, then rough or uneven by evening.",
  },
  {
    Icon: IconDull,
    title: "Low glow and uneven tone",
    text: "Complexion looks tired even when your routine is consistent.",
  },
] as const;

const solutionPoints = [
  "Herbal cleanse to remove buildup without stripping",
  "Repair layer to support tone and texture",
  "Deep detox step for weekly reset and visible freshness",
] as const;

type ProblemProps = {
  onAddToCart?: () => void;
};

export function Problem({ onAddToCart }: ProblemProps) {
  return (
    <section
      id="problem"
      aria-label="Benefits of VedaGlow — natural acne treatment and oil control"
      className="bg-[linear-gradient(180deg,#f6f2ea_0%,#fdfbf8_55%,#ffffff_100%)] px-4 py-14 sm:px-8 sm:py-20 md:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-neutral-700">
            Why VedaGlow
          </p>
          <h2 className="mt-4 font-serif text-4xl tracking-[-0.04em] text-[#14281f] sm:text-5xl">
            Benefits of Natural Ayurvedic Skincare
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-neutral-700 sm:text-lg">
            VedaGlow replaces chaos with clarity. Three targeted steps. Zero guesswork.
          </p>
        </div>

        <ul className="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
          {concerns.map(({ Icon, title, text }) => (
            <li
              key={title}
              className="group rounded-[1.5rem] border border-[#e9dec8] bg-white p-5 shadow-[0_20px_56px_-40px_rgba(15,23,42,0.22)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_66px_-40px_rgba(15,23,42,0.24)]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f8f2e8] text-veda-green shadow-[0_16px_34px_-26px_rgba(15,23,42,0.25)]">
                <Icon className="h-8 w-8" />
              </div>
              <h3 className="mt-5 font-serif text-[1.45rem] leading-tight tracking-[-0.02em] text-[#1A1A1A]">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-neutral-700">{text}</p>
            </li>
          ))}
        </ul>

        <div className="mt-8 rounded-[1.6rem] border border-[#d7c29b] bg-[linear-gradient(145deg,#fffdf8,#f7efdf)] p-6 shadow-[0_26px_70px_-44px_rgba(15,23,42,0.3)] sm:p-8">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#6f5a37]">
            What changes with VedaGlow
          </p>
          <h3 className="mt-3 font-serif text-[1.8rem] leading-tight tracking-[-0.02em] text-[#173229] sm:text-[2rem]">
            One coordinated ritual replaces trial-and-error skincare.
          </h3>
          <ul className="mt-5 grid gap-3 text-sm leading-7 text-neutral-700 sm:grid-cols-3">
            {solutionPoints.map((point) => (
              <li
                key={point}
                className="rounded-xl border border-black/8 bg-white/75 px-4 py-3"
              >
                {point}
              </li>
            ))}
          </ul>
        </div>

        <SectionCta onAddToCart={onAddToCart} />
      </div>
    </section>
  );
}
