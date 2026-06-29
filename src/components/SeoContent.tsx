/**
 * SeoContent — visually minimal, semantically rich block rendered below the hero.
 * Provides Google-crawlable content: product overview, benefits, ingredients,
 * who it's for, expected results, and FAQ with FAQ schema JSON-LD.
 *
 * Design: clean white card, no images, no layout changes to the rest of the page.
 */

const faqs = [
  {
    question: "Is VedaGlow suitable for all skin types?",
    answer:
      "Yes. Formulated for acne-prone, oily, combination, and dull skin. Gentle enough for sensitive skin. 100% herbal, zero harsh chemicals.",
  },
  {
    question: "How long until I see results?",
    answer:
      "Most see visible change in 7–14 days: less oil, fewer breakouts, calmer skin. Full results by day 28 with consistent use.",
  },
  {
    question: "Is it chemical-free?",
    answer:
      "100% Ayurvedic. Free from parabens, sulphates, artificial fragrances, and synthetic dyes. Dermatologist-tested.",
  },
  {
    question: "How does the 3-step routine work?",
    answer:
      "Step 1 — Daily Clean (3×/week): removes buildup and oil. Step 2 — Glow Repair (2×/week): brightens and supports barrier. Step 3 — Deep Detox (1×/week): weekly reset mask.",
  },
  {
    question: "Safe for sensitive skin?",
    answer:
      "Yes. Dermatologist-tested and free from common irritants. Check ingredient list if you have known botanical allergies.",
  },
  {
    question: "Is COD available?",
    answer:
      "Yes. Cash on delivery across India. Also accepts UPI, card, and net banking via secure checkout.",
  },
] as const;

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
};

export function SeoContent() {
  return (
    <>
      {/* FAQ structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <section
        aria-label="About VedaGlow 28-Day Skin Reset Kit — Ayurvedic skincare for acne, oily skin, and natural glow"
        className="bg-white px-4 py-12 sm:px-8 sm:py-16"
      >
        <div className="mx-auto max-w-4xl space-y-12">
          {/* ── Product overview ── */}
          <div>
            <h2 className="font-serif text-2xl tracking-tight text-[#14281f] sm:text-3xl">
              About VedaGlow 28-Day Skin Reset Kit
            </h2>
            <p className="mt-4 text-sm leading-8 text-neutral-700 sm:text-base">
              <strong>VedaGlow 28-Day Skin Reset Kit</strong> is a complete
              Ayurvedic skincare system for India's most common skin concerns:{" "}
              <strong>persistent acne, excess oil, and dull tone</strong>.
            </p>
            <p className="mt-4 text-sm leading-8 text-neutral-700 sm:text-base">
              Three targeted herbal formulas. One clear weekly schedule. No
              overwhelm, just results.
            </p>
            <p className="mt-4 text-sm leading-8 text-neutral-700 sm:text-base">
              <strong>100% Ayurvedic.</strong> Free from parabens, sulphates,
              and synthetic fragrances. Starter kit at Rs 499 with COD across
              India.
            </p>
          </div>

          {/* ── Benefits ── */}
          <div>
            <h2 className="font-serif text-2xl tracking-tight text-[#14281f] sm:text-3xl">
              Key Benefits of the 28-Day Kit
            </h2>
            <ul className="mt-5 grid gap-3 text-sm leading-7 text-neutral-700 sm:grid-cols-2 sm:text-base">
              {[
                "Clears acne and prevents new breakouts",
                "Controls oil and minimizes pores",
                "Restores natural glow and even tone",
                "Strengthens skin barrier in 28 days",
                "Gentle for sensitive skin",
                "100% herbal, zero harsh chemicals",
              ].map((benefit) => (
                <li key={benefit} className="flex items-start gap-2">
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-600"
                    aria-hidden
                  />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* ── Ingredients ── */}
          <div>
            <h2 className="font-serif text-2xl tracking-tight text-[#14281f] sm:text-3xl">
              Ayurvedic Ingredients for Clear Skin
            </h2>
            <p className="mt-4 text-sm leading-8 text-neutral-700 sm:text-base">
              <strong>Time-tested Ayurvedic botanicals</strong> proven for skin
              clarity and nourishment:
            </p>
            <ul className="mt-4 grid gap-3 text-sm leading-7 text-neutral-700 sm:grid-cols-2 sm:text-base">
              {[
                {
                  name: "Neem",
                  benefit: "antibacterial, reduces acne-causing bacteria",
                },
                {
                  name: "Turmeric (Haldi)",
                  benefit: "anti-inflammatory, brightens skin tone",
                },
                {
                  name: "Tulsi (Holy Basil)",
                  benefit: "purifies pores, controls excess sebum",
                },
                {
                  name: "Multani Mitti",
                  benefit: "deep-cleanses and absorbs oil",
                },
                {
                  name: "Aloe Vera",
                  benefit: "soothes irritation, hydrates without grease",
                },
                {
                  name: "Sandalwood (Chandan)",
                  benefit: "calms redness, supports even tone",
                },
              ].map(({ name, benefit }) => (
                <li key={name} className="flex items-start gap-2">
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500"
                    aria-hidden
                  />
                  <span>
                    <strong className="font-semibold text-[#173229]">
                      {name}
                    </strong>
                    {" — "}
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Who it's for ── */}
          <div>
            <h2 className="font-serif text-2xl tracking-tight text-[#14281f] sm:text-3xl">
              Who Is This Kit For?
            </h2>
            <p className="mt-4 text-sm leading-8 text-neutral-700 sm:text-base">
              <strong>Built for you if you:</strong>
            </p>
            <ul className="mt-4 space-y-2 text-sm leading-7 text-neutral-700 sm:text-base">
              {[
                "Deal with recurring acne or hormonal breakouts",
                "Have oily or combination skin",
                "Want to fade dark spots and even tone",
                "Need a simple, chemical-free routine",
                "Haven't found consistent results yet",
                "Want visible change in 28 days",
              ].map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-600"
                    aria-hidden
                  />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* ── Results timeline ── */}
          <div>
            <h2 className="font-serif text-2xl tracking-tight text-[#14281f] sm:text-3xl">
              28-Day Results Timeline
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-4">
              {[
                {
                  week: "Week 1",
                  result: "Cleaner skin. Less congestion. Oil control begins.",
                },
                {
                  week: "Week 2",
                  result: "Fewer breakouts. Smoother texture.",
                },
                {
                  week: "Week 3",
                  result: "Fading acne marks. More even tone.",
                },
                { week: "Week 4", result: "Clearer, calmer, radiant skin." },
              ].map(({ week, result }) => (
                <div
                  key={week}
                  className="rounded-xl border border-[#e7ecdf] bg-[#f8fbf8] p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                    {week}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-neutral-700">
                    {result}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── FAQ ── */}
          <div>
            <h2 className="font-serif text-2xl tracking-tight text-[#14281f] sm:text-3xl">
              FAQ — VedaGlow Ayurvedic Skincare Kit
            </h2>
            <dl className="mt-6 space-y-6">
              {faqs.map(({ question, answer }) => (
                <div
                  key={question}
                  className="border-b border-[#e7ecdf] pb-6 last:border-b-0 last:pb-0"
                >
                  <dt className="text-sm font-semibold text-[#173229] sm:text-base">
                    {question}
                  </dt>
                  <dd className="mt-2 text-sm leading-7 text-neutral-600 sm:text-base">
                    {answer}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </>
  );
}
