import { LegalPageLayout } from "./LegalPageLayout";

const LAST_UPDATED = "April 9, 2026";
const CONTACT_EMAIL = "vedaglows@gmail.com";
const CONTACT_PHONE = "+91 90589 64964";

export function PrivacyPolicy() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <p>
        At VedaGlow, we respect your privacy and are committed to protecting your personal information.
        This Privacy Policy explains how we collect, use, and protect your data when you use our website.
      </p>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">1. Information We Collect</h2>
        <p className="mt-2">We may collect the following information:</p>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Full Name</li>
          <li>Phone Number</li>
          <li>Email Address</li>
          <li>Shipping Address</li>
          <li>Payment details (processed securely via third-party payment gateways)</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">2. How We Use Your Information</h2>
        <p className="mt-2">We use your information to:</p>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Process and deliver your orders</li>
          <li>Provide customer support</li>
          <li>Send order updates via SMS, Email, or WhatsApp</li>
          <li>Improve our website and services</li>
          <li>Prevent fraud and ensure security</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">3. Sharing of Information</h2>
        <p className="mt-2">We do not sell your personal data. However, we may share your data with:</p>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Delivery partners (for shipping orders)</li>
          <li>Payment gateways (for secure transactions)</li>
          <li>Legal authorities if required by law</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">4. Data Security</h2>
        <p className="mt-2">
          We use secure technologies and encryption to protect your data. Your payment information is handled
          securely by trusted third-party providers.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">5. Your Rights (India DPDP Act)</h2>
        <p className="mt-2">As per applicable Indian laws, you have the right to:</p>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Access your personal data</li>
          <li>Request correction or deletion</li>
          <li>Withdraw consent at any time</li>
        </ul>
        <p className="mt-3">
          To exercise your rights, contact us at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-veda-green hover:underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">6. Cookies and Tracking</h2>
        <p className="mt-2">
          We use cookies to improve your browsing experience. For more details, please refer to our{" "}
          <a href="/cookie-policy" className="text-veda-green hover:underline">
            Cookie Policy
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">7. Third-Party Links</h2>
        <p className="mt-2">
          Our website may contain links to external sites. We are not responsible for their privacy practices.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">8. Updates to This Policy</h2>
        <p className="mt-2">
          We may update this policy from time to time. Changes will be posted on this page.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">9. Contact Us</h2>
        <p className="mt-2">
          If you have any questions, contact us at:
        </p>
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

