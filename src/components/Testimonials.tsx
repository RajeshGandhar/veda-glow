export function Testimonials() {
  const testimonials = [
    {
      quote:
        "My breakouts reduced visibly in three weeks. The biggest change was how calm and balanced my skin felt every morning.",
      author: "Priya Sharma",
      city: "Mumbai",
      rating: 5,
      result: "Texture looked clearer by week 3",
      avatar: "PS",
      concern: "Persistent breakouts",
      timeline: "Visible shift in 21 days",
    },
    {
      quote:
        "I stopped using five different products. This routine is simple and my midday oiliness is finally under control.",
      author: "Anika Verma",
      city: "Bangalore",
      rating: 5,
      result: "Oil control improved in 14 days",
      avatar: "AV",
      concern: "Excess oil + clogged pores",
      timeline: "Balance in 2 weeks",
    },
    {
      quote:
        "I was worried about reactions, but this felt gentle from day one. My face looks fresher and less tired in photos.",
      author: "Rohit Patel",
      city: "Delhi",
      rating: 5,
      result: "No irritation, visible glow",
      avatar: "RP",
      concern: "Sensitive, dull skin",
      timeline: "Comfort from first week",
    },
  ];

  return (
    <section
      id="testimonials"
      aria-label="Customer reviews — VedaGlow results for acne and glowing skin"
      className="relative overflow-hidden bg-[radial-gradient(circle_at_0%_14%,rgba(6,95,70,0.08),transparent_28%),radial-gradient(circle_at_92%_0%,rgba(251,191,36,0.14),transparent_24%),linear-gradient(180deg,#ffffff_0%,#f6faf7_100%)] px-4 py-16 sm:px-8 sm:py-24"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-24 h-64 w-64 rounded-full bg-emerald-100/50 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-amber-100/35 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex rounded-full border border-[#dbe7df] bg-white/75 px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-veda-green shadow-[0_16px_32px_-28px_rgba(6,95,70,0.7)]">
            Customer stories
          </p>
          <h2 className="mt-5 font-serif text-4xl tracking-[-0.04em] text-[#0f352a] sm:text-5xl">
            Customer Reviews and Results
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-neutral-700 sm:text-lg">
            7,200+ customers. Real results from consistent Ayurvedic care over 28 days.
          </p>
        </div>

        <div className="relative mt-8 grid gap-3 rounded-[1.35rem] border border-[#dce8e0] bg-white/70 p-4 shadow-[0_28px_50px_-42px_rgba(15,23,42,0.5)] backdrop-blur-md sm:grid-cols-3 sm:p-5">
          <div className="rounded-xl border border-[#e3ece6] bg-[linear-gradient(180deg,#ffffff_0%,#f8fcfa_100%)] px-4 py-3 text-center">
            <p className="font-serif text-[1.8rem] leading-none text-veda-green">4.8/5</p>
            <p className="mt-1 text-[0.66rem] uppercase tracking-[0.17em] text-neutral-600">
              Average rating
            </p>
          </div>
          <div className="rounded-xl border border-[#e3ece6] bg-[linear-gradient(180deg,#ffffff_0%,#f8fcfa_100%)] px-4 py-3 text-center">
            <p className="font-serif text-[1.8rem] leading-none text-veda-green">92%</p>
            <p className="mt-1 text-[0.66rem] uppercase tracking-[0.17em] text-neutral-600">
              Repeat customers
            </p>
          </div>
          <div className="rounded-xl border border-[#e3ece6] bg-[linear-gradient(180deg,#ffffff_0%,#f8fcfa_100%)] px-4 py-3 text-center">
            <p className="font-serif text-[1.8rem] leading-none text-veda-green">7 days</p>
            <p className="mt-1 text-[0.66rem] uppercase tracking-[0.17em] text-neutral-600">
              Satisfaction window
            </p>
          </div>
        </div>

        <div className="mt-8 grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((review) => (
            <article
              key={review.author}
              className="group relative flex h-full flex-col overflow-hidden rounded-[1.7rem] border border-[#d9e8de] bg-[linear-gradient(180deg,#ffffff_0%,#f9fcfa_100%)] p-6 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.44)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_34px_70px_-40px_rgba(6,95,70,0.42)]"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-100/65 blur-2xl" />
              <div className="mb-4 flex items-start justify-between gap-3">
                <span className="font-serif text-5xl leading-none text-emerald-200/80">“</span>
                <div
                  className="flex items-center gap-1 text-amber-500"
                  aria-label="5 star rating"
                >
                  {[...Array(review.rating)].map((_, i) => (
                    <svg
                      key={i}
                      viewBox="0 0 20 20"
                      className="h-4 w-4 fill-current"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden
                    >
                      <path d="M10 2.2l2.19 4.43 4.89.71-3.54 3.45.84 4.87L10 13.7 5.62 16l.84-4.87L2.92 7.34l4.89-.71L10 2.2z" />
                    </svg>
                  ))}
                </div>
                <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  Verified
                </span>
              </div>

              <p className="relative min-h-[9rem] flex-1 text-sm leading-7 text-neutral-700">
                "{review.quote}"
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-[#dce9df] bg-white px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.13em] text-[#2d5144]">
                  {review.concern}
                </span>
                <span className="rounded-full border border-[#eedfae] bg-[#fff8e2] px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.13em] text-[#6e5929]">
                  {review.timeline}
                </span>
              </div>

              <div className="mt-auto border-t border-[#e4eee7] pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ebf6ef_0%,#dff0e6_100%)] text-sm font-semibold text-veda-green ring-2 ring-white shadow-[0_16px_30px_-26px_rgba(6,95,70,0.8)]">
                    {review.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#173229]">{review.author}</p>
                    <p className="text-xs text-neutral-500">{review.city}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                  Outcome: {review.result}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
