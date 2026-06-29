import { LegalPageLayout } from "./LegalPageLayout";

const LAST_UPDATED = "April 9, 2026";
const CONTACT_EMAIL = "vedaglows@gmail.com";
const CONTACT_PHONE = "+91 90589 64964";

export function ShippingPolicy() {
  return (
    <LegalPageLayout title="Shipping Policy" lastUpdated={LAST_UPDATED}>
      <section>
        <h2 className="font-serif text-2xl text-[#173229]">
          1. Order Processing
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Orders are processed within 1-3 business days.</li>
          <li>Orders are not shipped on Sundays or public holidays.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">2. Delivery Time</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Metro cities: 2-5 business days</li>
          <li>Other locations: 4-7 business days</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">
          3. Shipping Charges
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Free shipping on orders above ₹499.</li>
          <li>Standard shipping charge: ₹39 on single-kit ₹499 orders.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">
          4. Order Tracking
        </h2>
        <p className="mt-2">
          Tracking details will be shared via SMS, Email, or WhatsApp.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">5. Delays</h2>
        <p className="mt-2">
          Delivery delays may occur due to unforeseen circumstances.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">
          6. Incorrect Address
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Please ensure accurate address details.</li>
          <li>
            We are not responsible for delivery issues due to incorrect
            information.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">7. Contact Us</h2>
        <p className="mt-2">
          Email:{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-veda-green hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
        <p>
          Phone:{" "}
          <a
            href="tel:+919058964964"
            className="text-veda-green hover:underline"
          >
            {CONTACT_PHONE}
          </a>
        </p>
      </section>
    </LegalPageLayout>
  );
}
