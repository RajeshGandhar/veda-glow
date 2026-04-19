import dailyCleanImg from "../assets/products-source/daily-clean.webp";
import glowRepairImg from "../assets/products-source/glow-repair.webp";
import deepDetoxImg from "../assets/products-source/deep-detox.webp";
import { BuyNowButton } from "./BuyNowButton";

const products = [
  {
    name: "Daily Clean",
    benefit: "Gentle herbal cleanser for fresh, balanced skin",
    image: dailyCleanImg,
    accent: "#d8eadf",
    step: "Step 1",
  },
  {
    name: "Glow Repair",
    benefit: "Targeted brightening and barrier support",
    image: glowRepairImg,
    accent: "#eadfc8",
    step: "Step 2",
  },
  {
    name: "Deep Detox",
    benefit: "Weekly reset to lift buildup and dullness",
    image: deepDetoxImg,
    accent: "#e2d3c3",
    step: "Step 3",
  },
] as const;

type SolutionProps = {
  onAddToCart?: () => void;
};

export function Solution({ onAddToCart }: SolutionProps) {
  return (
    <section
      id="solution"
      className="relative overflow-hidden bg-[linear-gradient(180deg,#f8f4ea_0%,#fefcf7_46%,#ffffff_100%)] px-4 py-14 sm:px-8 sm:py-20 md:py-24"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-14 top-16 h-64 w-64 rounded-full bg-emerald-100/55 blur-3xl" />
        <div className="absolute right-[-3rem] top-0 h-72 w-72 rounded-full bg-[#ead8af]/45 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center relative">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#5d4b2d]">
            28-day product system
          </p>
          <h2 className="mt-4 font-serif text-4xl leading-[1.03] tracking-[-0.04em] text-[#14281f] sm:text-5xl">
            Three formulas. One clear routine.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-neutral-700 sm:text-lg">
            Every product has one focused job, so your skin gets steady results
            without a complicated shelf.
          </p>

          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-xl border border-[#e8dcc8] bg-[#fffaf0] px-3 py-2 text-xs font-semibold text-[#4a3b22] sm:text-sm">
            <span>3 targeted formulas</span>
            <span className="text-[#b89c6a]">•</span>
            <span>28-day guided rhythm</span>
            <span className="text-[#b89c6a]">•</span>
            <span>Starter price Rs 299</span>
          </div>
        </div>

        <ul className="mt-10 grid gap-5 md:grid-cols-3 md:gap-6">
          {products.map((product) => (
            <li
              key={product.name}
              className="group relative overflow-hidden rounded-[1.8rem] border border-[#e6dbc6] bg-[linear-gradient(180deg,#fffefb_0%,#f7f0e5_100%)] p-5 shadow-[0_30px_72px_-48px_rgba(15,23,42,0.4)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_38px_80px_-42px_rgba(15,23,42,0.42)] sm:p-6"
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(circle at 20% 15%, rgba(255,255,255,0.88), transparent 38%), radial-gradient(circle at 82% 86%, rgba(201,169,110,0.2), transparent 44%)",
                }}
              />

              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-[#6f5a37]">
                  {`VedaGlow ${product.name}`}
                </p>
                <p className="rounded-full border border-[#d8c6a0] bg-[#f8f1e3] px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.17em] text-[#5f4a2b]">
                  {product.step}
                </p>
              </div>

              <div
                className="premium-product-frame relative isolate aspect-square overflow-hidden rounded-3xl border border-white/60 bg-[linear-gradient(150deg,#fffdf8,#f4ede1)] shadow-[0_2px_0_rgba(255,255,255,0.9)_inset,0_32px_56px_-32px_rgba(15,23,42,0.38)]"
                style={{ boxShadow: `0 2px 0 rgba(255,255,255,0.9) inset, 0 32px 56px -32px rgba(15,23,42,0.38), 0 0 0 1.5px ${product.accent}` }}
              >
                <div className="premium-product-shine" />
                  <img
                    src={product.image}
                    alt={`VedaGlow ${product.name}`}
                    width={720}
                    height={720}
                    loading="lazy"
                    decoding="async"
                    className="premium-product-image h-full w-full object-cover object-center transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                  />
              </div>

              <div className="pt-5">
                <h3 className="font-serif text-[1.75rem] leading-snug tracking-[-0.02em] text-[#1A1A1A]">
                  {product.name}
                </h3>
                <p className="mt-3 text-sm leading-7 text-neutral-700">
                  {product.benefit}
                </p>

                <p className="mt-4 inline-flex rounded-full border border-[#e6dcc8] bg-white/75 px-3 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-[#4e4e4e]">
                  Included in the Rs 299 starter kit
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-10 rounded-[1.8rem] border border-[#e4d8c1] bg-[linear-gradient(160deg,#fffef9_0%,#f6f0e2_100%)] p-5 shadow-[0_24px_60px_-42px_rgba(20,35,29,0.38)] sm:p-7">
          <div className="flex flex-col gap-5 sm:items-start lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#6b5532]">
                Starter Offer
              </p>
              <p className="mt-2 font-serif text-2xl leading-tight text-[#173229] sm:text-3xl">
                Add the full 28-day trio for Rs 299
              </p>
              <p className="mt-2 text-sm text-neutral-600">
                Delivery in 3-5 days, COD available, and secure checkout.
              </p>
            </div>

            <div className="w-full max-w-md lg:max-w-none lg:w-auto">
              <BuyNowButton
                onClick={() => onAddToCart?.()}
                className="w-full max-w-none bg-[#20483b]! text-base font-bold text-white shadow-[0_24px_46px_-28px_rgba(23,50,41,0.66)] hover:bg-[#173a2f]!"
              >
                Add to Cart - Rs 299
              </BuyNowButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
