import heroAvif from "../assets/hero-premium.avif";
import heroAvifSm from "../assets/hero-premium-sm.avif";
import heroWebp from "../assets/hero-premium.webp";
import heroWebpSm from "../assets/hero-premium-sm.webp";
import { BuyNowButton } from "./BuyNowButton";

type HeroProps = {
  onAddToCart?: () => void;
};

export function Hero({ onAddToCart }: HeroProps) {
  const trustPills = [
    "Derm-tested herbal care",
    "Cash on delivery available",
    "7-day satisfaction promise",
  ] as const;

  return (
    <section
      id="hero"
      aria-label="VedaGlow 28-Day Skin Reset Kit — natural Ayurvedic skincare for acne and glowing skin"
      className="relative overflow-hidden border-b border-[#e3ece6] bg-[radial-gradient(circle_at_12%_18%,rgba(5,150,105,0.08),transparent_40%),radial-gradient(circle_at_84%_8%,rgba(251,191,36,0.18),transparent_28%),linear-gradient(180deg,#f8fbf8_0%,#fefcf7_52%,#ffffff_100%)] px-4 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-14"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-24 h-52 w-52 rounded-full bg-emerald-200/35 blur-3xl" />
        <div className="absolute right-[-4rem] top-16 h-72 w-72 rounded-full bg-veda-gold/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-center gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14">
          <div className="order-2 text-center lg:order-1 lg:text-left">
            <p className="inline-flex items-center rounded-full border border-emerald-700/20 bg-white/70 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-veda-green shadow-[0_14px_36px_-30px_rgba(6,95,70,0.6)] backdrop-blur-md sm:text-[0.76rem]">
              Ayurveda-backed starter ritual
            </p>
            <h1 className="mt-5 font-serif text-[2.1rem] leading-[1.02] tracking-[-0.04em] text-[#093228] sm:text-[3.15rem] lg:text-[3.9rem]">
              28-Day Skin Reset Kit
            </h1>
            <p className="mt-3 font-serif text-[1.5rem] leading-tight text-emerald-700 sm:text-[2rem]">
              Clear Skin Naturally
            </p>
            <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-neutral-700 sm:text-lg lg:mx-0">
              Three Ayurvedic formulas. One focused routine. Built for acne, oil
              control, and natural glow.
            </p>

            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <BuyNowButton
                onClick={() => onAddToCart?.()}
                className="sm:min-w-[17.5rem]"
              >
                Start Your Skin Reset — Rs 499
              </BuyNowButton>
              <a
                href="#how"
                className="inline-flex min-h-[56px] items-center justify-center rounded-full border border-emerald-700/20 bg-white/80 px-7 py-3 text-sm font-semibold text-veda-green shadow-[0_14px_28px_-24px_rgba(6,95,70,0.7)] transition-colors hover:bg-emerald-50"
              >
                See 3-Step Routine
              </a>
            </div>

            <div className="mt-7 flex flex-col items-center gap-4 lg:items-start">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#e8dcc4] bg-[#fffaf1] px-4 py-2 text-sm text-neutral-700 shadow-[0_14px_28px_-24px_rgba(146,116,64,0.45)]">
                <span
                  className="flex items-center gap-1 text-amber-500"
                  aria-hidden
                >
                  {[0, 1, 2, 3, 4].map((star) => (
                    <svg
                      key={star}
                      viewBox="0 0 20 20"
                      className="h-4 w-4 fill-current"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M10 2.2l2.19 4.43 4.89.71-3.54 3.45.84 4.87L10 13.7 5.62 16l.84-4.87L2.92 7.34l4.89-.71L10 2.2z" />
                    </svg>
                  ))}
                </span>
                <span className="font-semibold text-veda-green">4.8/5</span>
                <span>from 7,200+ verified reviews</span>
              </div>
              <ul className="grid w-full gap-2 sm:grid-cols-3">
                {trustPills.map((pill) => (
                  <li
                    key={pill}
                    className="rounded-xl border border-[#e7ecdf] bg-white/80 px-3 py-2 text-xs font-medium text-neutral-700 shadow-[0_12px_24px_-24px_rgba(15,23,42,0.5)]"
                  >
                    {pill}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="hero-media-shell group relative overflow-hidden rounded-[2rem] border border-white/80 bg-[#faf5eb] shadow-[0_28px_88px_-42px_rgba(6,95,70,0.38)]">
              <div className="hero-image-shine" />
              <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_18%_16%,rgba(255,255,255,0.46),transparent_44%),radial-gradient(circle_at_82%_82%,rgba(251,191,36,0.22),transparent_40%)]" />
              <div className="h-[240px] w-full sm:h-[360px] lg:h-[470px]">
                <picture>
                  {/* AVIF: best compression, supported by all modern browsers */}
                  <source
                    srcSet={`${heroAvifSm} 512w, ${heroAvif} 1024w`}
                    sizes="(max-width: 640px) 512px, 1024px"
                    type="image/avif"
                  />
                  {/* WebP: fallback for browsers without AVIF (Safari < 16) */}
                  <source
                    srcSet={`${heroWebpSm} 512w, ${heroWebp} 1024w`}
                    sizes="(max-width: 640px) 512px, 1024px"
                    type="image/webp"
                  />
                  <img
                    src={heroWebp}
                    alt="VedaGlow 28-day Ayurvedic skin reset kit with Daily Clean herbal face wash, Glow Repair brightening serum, and Deep Detox weekly mask for acne-prone oily skin"
                    className="hero-image-premium h-full w-full object-contain object-center p-2 sm:p-3"
                    width={1024}
                    height={1024}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                  />
                </picture>
              </div>
              <div className="absolute bottom-4 left-4 z-10 rounded-xl border border-white/70 bg-white/78 px-4 py-3 backdrop-blur-md sm:bottom-6 sm:left-6">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-neutral-600">
                  Starter Offer
                </p>
                <p className="mt-1 font-serif text-2xl leading-none text-[#0b4738]">
                  Rs 499
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
