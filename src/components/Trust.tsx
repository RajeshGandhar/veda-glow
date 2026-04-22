type TrustIconProps = {
  className?: string;
};

function GuaranteeIcon({ className }: TrustIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M12 3l7 3v5c0 5-3.2 8.6-7 10-3.8-1.4-7-5-7-10V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8.4 11.9l2.3 2.3 4.8-4.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SecurePaymentIcon({ className }: TrustIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect x="4" y="10" width="16" height="10" rx="2.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M8 10V7.7C8 5.7 9.8 4 12 4s4 1.7 4 3.7V10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="12" cy="15" r="1.2" fill="currentColor" />
    </svg>
  );
}

function DeliveryIcon({ className }: TrustIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M3.5 8.5h11v7h-11zM14.5 10.2h3l2 2.4v2.9h-5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="17.5" r="1.9" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17" cy="17.5" r="1.9" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function SupportIcon({ className }: TrustIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M4 6.7C4 5.2 5.2 4 6.7 4h10.6C18.8 4 20 5.2 20 6.7v6.6c0 1.5-1.2 2.7-2.7 2.7H11l-3.8 3v-3H6.7C5.2 16 4 14.8 4 13.3V6.7z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8 9.8h8M8 12.3h5.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Trust() {
  const whatsappLink = "https://wa.me/919058964964";
  const assurances = [
    {
      Icon: GuaranteeIcon,
      title: "7-Day Guarantee",
      detail: "Full refund if not satisfied.",
      tag: "Risk-free start",
    },
    {
      Icon: SecurePaymentIcon,
      title: "Secure Payment",
      detail: "Encrypted checkout and verified flow.",
      tag: "Trusted gateway",
    },
    {
      Icon: DeliveryIcon,
      title: "Fast Delivery",
      detail: "3-5 days across India with tracking.",
      tag: "Priority dispatch",
    },
    {
      Icon: SupportIcon,
      title: "Real Support",
      detail: "Chat with us on WhatsApp anytime.",
      tag: "Human assistance",
    },
  ] as const;

  return (
    <section
      id="trust"
      aria-label="VedaGlow trust and support — guarantee, delivery, and payment"
      className="relative overflow-hidden bg-[radial-gradient(circle_at_4%_20%,rgba(6,95,70,0.09),transparent_30%),radial-gradient(circle_at_96%_6%,rgba(251,191,36,0.16),transparent_24%),linear-gradient(180deg,#ffffff_0%,#f6faf7_100%)] px-4 py-16 sm:px-8 sm:py-24"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-emerald-100/45 blur-3xl" />
        <div className="absolute -right-20 bottom-4 h-64 w-64 rounded-full bg-amber-100/35 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <p className="inline-flex rounded-full border border-[#dbe7df] bg-white/75 px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-veda-green shadow-[0_16px_32px_-28px_rgba(6,95,70,0.7)]">
            Confidence without clutter
          </p>
          <h2 className="mt-5 font-serif text-4xl tracking-[-0.04em] text-[#0f352a] md:text-5xl">
            Simple assurances,
            <span className="block text-emerald-700">quietly presented.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-neutral-700 sm:text-lg">
            Everything you need to order with confidence. Nothing you don't.
          </p>
        </div>

        <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {assurances.map((item) => (
            <article
              key={item.title}
              className="group relative flex h-full flex-col overflow-hidden rounded-[1.55rem] border border-[#d9e8de] bg-[linear-gradient(180deg,#ffffff_0%,#f9fcfa_100%)] p-5 shadow-[0_24px_56px_-42px_rgba(15,23,42,0.44)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_34px_66px_-40px_rgba(6,95,70,0.42)]"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-100/70 blur-2xl" />
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#dccaa4]/70 bg-[linear-gradient(180deg,#fffaf0_0%,#f5ebd7_100%)] text-[#5d4b2d] ring-2 ring-white shadow-[0_18px_34px_-26px_rgba(122,95,55,0.42)]">
                <item.Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-serif text-[1.45rem] leading-tight tracking-[-0.02em] text-[#173229]">
                {item.title}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-7 text-neutral-700">
                {item.detail}
              </p>
              <p className="mt-4 inline-flex rounded-full border border-[#dce9df] bg-white px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#2f5d50]">
                {item.tag}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-[1.7rem] border border-[#dbe7df] bg-white/80 shadow-[0_26px_56px_-42px_rgba(15,23,42,0.5)] backdrop-blur-md overflow-hidden">
          {/* Green accent stripe */}
          <div className="h-1 w-full bg-gradient-to-r from-[#25D366] via-emerald-400 to-[#128C7E]" />

          <div className="p-5 sm:p-7">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">

              {/* Left: text content */}
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 mb-3">
                  {/* Pulsing green online dot */}
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#25D366] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#25D366]" />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                    Support Available
                  </span>
                </div>

                <p className="font-serif text-2xl tracking-[-0.03em] text-[#163027]">
                  Need help or have questions?
                </p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600 max-w-sm">
                  Talk to our support team directly on WhatsApp.
                  Fast response during working hours.
                </p>

                <p className="mt-3 text-sm text-neutral-600">
                  or call us at{" "}
                  <a
                    href="tel:+919058964964"
                    className="font-semibold text-veda-green underline decoration-1 underline-offset-2 hover:text-emerald-700"
                  >
                    +91 90589 64964
                  </a>
                </p>
              </div>

              {/* Right: WhatsApp button */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative inline-flex items-center gap-3 rounded-2xl px-7 py-4 text-sm font-bold text-white shadow-[0_8px_32px_-8px_rgba(37,211,102,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-8px_rgba(37,211,102,0.70)] active:translate-y-0 active:scale-95"
                  style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" }}
                  aria-label="Chat on WhatsApp"
                >
                  {/* Shimmer glow on hover */}
                  <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.15), transparent 70%)" }} />

                  {/* WhatsApp logo SVG */}
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>

                  <span className="text-[15px] tracking-tight">Chat on WhatsApp</span>

                  {/* Arrow */}
                  <svg className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>

                {/* Subtext */}
                <p className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500">
                  <svg className="h-3 w-3 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                  </svg>
                  Typically replies in minutes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
