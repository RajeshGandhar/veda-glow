import { BuyNowButton } from "./BuyNowButton";

type OfferBannerProps = {
  onAddToCart?: (quantity?: number) => void;
};

export function OfferBanner({ onAddToCart }: OfferBannerProps) {
  return (
    <section
      id="offer"
      aria-label="Limited offer"
      className="relative overflow-hidden px-4 py-12 sm:px-8 sm:py-16"
    >
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-emerald-900/25 bg-[linear-gradient(128deg,#083a2d_0%,#0b4a39_42%,#0f5f49_100%)] p-6 text-white shadow-[0_34px_90px_-40px_rgba(9,30,25,0.72)] sm:p-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 -top-16 h-52 w-52 rounded-full bg-white/12 blur-3xl" />
          <div className="absolute -bottom-20 right-10 h-56 w-56 rounded-full bg-[#f8d889]/22 blur-3xl" />
        </div>

        <div className="relative grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          <div>
            <p className="inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#f7e8c4]">
              Limited Launch Window
            </p>
            <h2 className="mt-4 font-serif text-[2rem] leading-[1.03] tracking-[-0.03em] text-white sm:text-[2.6rem]">
              Claim the 28-day starter kit
              <span className="block text-[#f8d889]">before this batch closes.</span>
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/85 sm:text-base sm:leading-8">
              You get priority dispatch, secure payment, and our satisfaction
              promise. Once this offer ends, price returns to the regular slab.
            </p>
            <div className="mt-5 inline-flex items-center gap-3 rounded-full border border-[#f8d889]/30 bg-[#f8d889]/16 px-4 py-2 text-sm font-semibold text-[#fef0cd]">
              <span className="text-base">Live now:</span>
              <span>Only 43 kits left at this price</span>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/20 bg-white/8 p-5 backdrop-blur-md sm:p-6">
            <div className="flex items-baseline justify-between gap-4 border-b border-white/18 pb-4">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-white/75">
                Starter Price
              </p>
              <p className="font-serif text-[1.9rem] leading-none text-white sm:text-[2.25rem]">Rs 299</p>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/20 bg-black/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/85">
              <span>Bundle Deal</span>
              <span className="text-[#f8d889]">2 Kits - Rs 499</span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-white/85">
              <li>- 3 focused formulas for acne, oil, and dullness</li>
              <li>- Fast delivery and secure checkout flow</li>
              <li>- 7-day satisfaction assurance</li>
            </ul>
            <div className="mt-5 grid gap-3">
              <BuyNowButton
                onClick={() => onAddToCart?.(1)}
                variant="onDark"
                className="w-full max-w-none sm:min-w-0"
              >
                Claim 1 Kit - Rs 299
              </BuyNowButton>
              <button
                type="button"
                onClick={() => onAddToCart?.(2)}
                className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full border border-white/45 bg-[#f8d889] px-6 py-3 text-sm font-semibold text-[#173229] transition-colors hover:bg-[#f4ce6a]"
              >
                Upgrade to 2 Kits - Rs 499
              </button>
            </div>
            <p className="mt-3 text-center text-xs text-white/70">
              Encrypted payments - COD available - Priority support
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
