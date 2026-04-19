import { LegalPageLayout } from "./LegalPageLayout";

const LAST_UPDATED = "April 9, 2026";
const CONTACT_EMAIL = "vedaglows@gmail.com";
const CONTACT_PHONE = "+91 90589 64964";

export function ReturnRefundPolicy() {
  return (
    <LegalPageLayout title="Return & Refund Policy" lastUpdated={LAST_UPDATED}>
      <p>
        At VedaGlow, customer satisfaction is our priority.
      </p>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">1. Returns</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Returns are accepted within 7 days of delivery.</li>
          <li>Product must be unused and in original packaging.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">2. Non-Returnable Items</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Opened or used products</li>
          <li>Personal care items (for hygiene reasons)</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">3. Damaged or Wrong Product</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>If you receive a damaged or incorrect product, contact us within 48 hours.</li>
          <li>Provide photos or video as proof.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">4. Refunds</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Approved refunds will be processed within 5-7 business days.</li>
          <li>Refund will be credited to original payment method.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">5. Cancellation</h2>
        <p className="mt-2">Orders can be cancelled before dispatch.</p>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">6. Contact Us</h2>
        <p className="mt-2">
          Email:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-veda-green hover:underline">
            {CONTACT_EMAIL}
          </a>
        </p>
        <p>
          Phone:{" "}
          <a href="tel:+919058964964" className="text-veda-green hover:underline">
            {CONTACT_PHONE}
          </a>
        </p>
      </section>
    </LegalPageLayout>
  );
}

