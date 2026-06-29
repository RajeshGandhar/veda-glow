import { BuyNowButton } from "./BuyNowButton";
import { useUrgencyMetrics } from "../hooks/useUrgencyMetrics";

type CTAProps = {
  onAddToCart?: () => void;
};

export function CTA({ onAddToCart }: CTAProps) {
  const handleAddToCart = () => {
    onAddToCart?.();
  };

  const { stock, viewers, formattedTime, isUrgent } = useUrgencyMetrics();

  return (
    <section
      id="cta"
      className="relative overflow-hidden bg-[linear-gradient(180deg,#f7f4ec_0%,#fbf9f3_48%,#ffffff_100%)] px-4 py-16 sm:px-8 sm:py-20 md:py-24"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full bg-[#d8c08a]/22 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-emerald-100/55 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-[#e7dcc8] bg-white/92 p-6 shadow-[0_34px_86px_-52px_rgba(30,35,32,0.42)] backdrop-blur-sm sm:p-10">
        <div className="grid items-center gap-9 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#dccaa4] bg-[#faf2de] px-5 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.15em] text-[#6b5532]">
              28-day complete ayurvedic kit
            </div>

            <h2 className="mb-4 font-serif text-3xl leading-tight text-[#172f24] sm:text-4xl md:text-[3.05rem]">
              Start your skin reset today.
            </h2>

            <p className="max-w-2xl text-base leading-8 text-neutral-700 sm:text-lg">
              Three formulas. Weekly progress. Built for acne, oil control, and
              natural radiance.
            </p>

            <div
              className={`mt-6 inline-flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold sm:text-sm ${
                isUrgent
                  ? "border-amber-300 bg-amber-50 text-amber-900"
                  : "border-[#e8dcc8] bg-[#fffaf0] text-[#4a3b22]"
              }`}
            >
              <span>Only {stock} kits left</span>
              <span className="text-[#b89c6a]">•</span>
              <span>{viewers} viewing now</span>
              <span className="text-[#b89c6a]">•</span>
              <span>Offer closes in {formattedTime}</span>
            </div>

            <div className="mt-6 space-y-2 text-sm text-neutral-700">
              <p>Inside the kit: Daily Clean + Glow Repair + Deep Detox</p>
              <p>28-day plan: clear day-wise routine with 3 focused steps</p>
              <p>Support promise: 7-day satisfaction + quick WhatsApp help</p>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-[#e4d8c1] bg-[linear-gradient(160deg,#fffef9_0%,#f6f0e2_100%)] p-5 shadow-[0_24px_60px_-42px_rgba(20,35,29,0.38)] sm:p-6">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#6b5532]">
              Starter Price
            </p>
            <p className="mt-2 font-serif text-[2.2rem] leading-none text-[#173229] sm:text-[2.8rem]">
              ₹499
            </p>

            <div className="mt-4 rounded-xl border border-[#e4d8c1] bg-white/75 px-4 py-3 text-sm text-neutral-700">
              Payments & delivery: COD available, secure checkout, dispatch in
              3-5 days
            </div>

            <div className="mt-5">
              <BuyNowButton
                onClick={handleAddToCart}
                className="w-full min-h-[62px]! max-w-none bg-[#20483b]! text-base font-bold text-white shadow-[0_24px_46px_-28px_rgba(23,50,41,0.66)] hover:bg-[#173a2f]!"
              >
                Add to Cart - Rs 499
              </BuyNowButton>
              <p className="mt-3 text-center text-xs font-medium text-neutral-600">
                Secure checkout with encrypted payment gateway.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
