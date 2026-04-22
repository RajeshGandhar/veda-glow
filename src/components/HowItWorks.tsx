import { SectionCta } from "./BuyNowButton";

const steps = [
  {
    number: "01",
    title: "Cleanse",
    detail: "Use Daily Clean on 3 scheduled days each week to remove buildup and oil.",
    timing: "3 days per week",
  },
  {
    number: "02",
    title: "Repair",
    detail:
      "Apply Glow Repair on 2 scheduled days to support tone, smooth texture, and hydration.",
    timing: "2 days per week",
  },
  {
    number: "03",
    title: "Detox",
    detail: "Use Deep Detox once a week on an alternate day for a deeper reset and visible freshness.",
    timing: "1 day per week",
  },
] as const;

const weeklySchedule = [
  { day: "Mon", product: "Daily Clean" },
  { day: "Tue", product: "Glow Repair" },
  { day: "Wed", product: "Daily Clean" },
  { day: "Thu", product: "Deep Detox" },
  { day: "Fri", product: "Daily Clean" },
  { day: "Sat", product: "Glow Repair" },
  { day: "Sun", product: "Daily Clean" },
] as const;

type HowItWorksProps = {
  onAddToCart?: () => void;
};

export function HowItWorks({ onAddToCart }: HowItWorksProps) {
  return (
    <section
      id="how"
      aria-label="How VedaGlow works — 28-day Ayurvedic skincare routine"
      className="bg-[linear-gradient(180deg,#ffffff_0%,#f8f4ec_100%)] px-4 py-14 sm:px-8 sm:py-20 md:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-neutral-700">
            28-Day Skin Routine
          </p>
          <h2 className="mt-4 font-serif text-4xl leading-[1.03] tracking-[-0.04em] text-[#14281f] sm:text-5xl">
            How the 3-Step Routine Works
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-neutral-700 sm:text-lg">
            Clear steps. Simple timing. Built for consistency, not confusion.
          </p>
        </div>

        <ol className="relative mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
          <div className="pointer-events-none absolute left-[16.66%] right-[16.66%] top-[2.35rem] hidden h-px bg-[linear-gradient(90deg,rgba(47,93,80,0.15),rgba(47,93,80,0.4),rgba(47,93,80,0.15))] md:block" />

          {steps.map((step) => (
            <li
              key={step.number}
              className="relative rounded-[1.5rem] border border-[#e5d9c2] bg-white p-5 shadow-[0_22px_60px_-44px_rgba(15,23,42,0.24)]"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#d9c7a5] bg-[#f8f1e3] font-serif text-lg tracking-[-0.02em] text-[#173229]">
                  {step.number}
                </span>
                <div>
                  <p className="text-[0.64rem] font-semibold uppercase tracking-[0.22em] text-[#6f5a37]">
                    Ritual step
                  </p>
                  <h3 className="mt-1 font-serif text-[1.5rem] tracking-[-0.02em] text-[#1A1A1A]">
                    {step.title}
                  </h3>
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-neutral-700">{step.detail}</p>
              <p className="mt-4 inline-flex rounded-full bg-[#f8f2e8] px-3 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-neutral-700">
                {step.timing}
              </p>
            </li>
          ))}
        </ol>

        <div className="mx-auto mt-6 max-w-4xl rounded-[1.25rem] border border-[#e5d9c2] bg-white/95 p-4 shadow-[0_20px_45px_-40px_rgba(15,23,42,0.35)] sm:p-5">
          <p className="text-center text-[0.64rem] font-semibold uppercase tracking-[0.22em] text-[#6f5a37]">
            7 day complete plan
          </p>
          <div className="mt-3 overflow-hidden rounded-xl border border-[#eadfcd] bg-[#f8f4ec]">
            <div className="grid grid-cols-[4.25rem,1fr] border-b border-[#eadfcd] bg-[#f2ebdf] px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#6f5a37]">
              <p>Day</p>
              <p>Product</p>
            </div>
            {weeklySchedule.map((item) => (
              <div
                key={item.day}
                className="grid grid-cols-[4.25rem,1fr] items-center border-b border-[#eadfcd] px-3 py-2 last:border-b-0"
              >
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#2f5d50]">
                  {item.day}
                </p>
                <p className="font-serif text-[1.02rem] tracking-[-0.01em] text-[#173229]">
                  {item.product}
                </p>
              </div>
            ))}
          </div>
        </div>

        <SectionCta onAddToCart={onAddToCart} />
      </div>
    </section>
  );
}
