import { LegalPageLayout } from "./LegalPageLayout";

const LAST_UPDATED = "April 9, 2026";
const CONTACT_EMAIL = "vedaglows@gmail.com";
const CONTACT_PHONE = "+91 90589 64964";

export function TermsAndConditions() {
  return (
    <LegalPageLayout title="Terms & Conditions" lastUpdated={LAST_UPDATED}>
      <p>
        Welcome to VedaGlow. By accessing or using our website, you agree to the following terms and
        conditions.
      </p>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">1. General</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>These Terms govern your use of our website and services.</li>
          <li>By placing an order, you agree to these Terms.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">2. Products</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>We strive to display accurate product information.</li>
          <li>As our products are natural, slight variations may occur.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">3. Pricing</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>All prices are listed in INR (₹).</li>
          <li>Prices are subject to change without prior notice.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">4. Orders</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>We reserve the right to cancel or refuse any order.</li>
          <li>You will be notified in case of cancellation.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">5. Payments</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Payments are processed securely through third-party gateways.</li>
          <li>We do not store your card or UPI details.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">6. Shipping</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Orders are processed within 1-3 business days.</li>
          <li>Delivery time may vary based on location.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">7. Returns & Refunds</h2>
        <p className="mt-2">
          Please refer to our{" "}
          <a href="/return-and-refund-policy" className="text-veda-green hover:underline">
            Return & Refund Policy
          </a>{" "}
          for details.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">8. User Responsibilities</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Provide accurate information during checkout.</li>
          <li>Do not misuse the website.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">9. Intellectual Property</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>All content (logo, images, text) belongs to VedaGlow.</li>
          <li>Unauthorized use is prohibited.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">10. Limitation of Liability</h2>
        <p className="mt-2">
          We are not liable for indirect damages or delays beyond our control.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">11. Governing Law</h2>
        <p className="mt-2">
          These Terms are governed by the laws of India.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">12. Contact Us</h2>
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

