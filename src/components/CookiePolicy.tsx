import { LegalPageLayout } from "./LegalPageLayout";

const LAST_UPDATED = "April 9, 2026";
const CONTACT_EMAIL = "vedaglows@gmail.com";
const CONTACT_PHONE = "+91 90589 64964";

export function CookiePolicy() {
  return (
    <LegalPageLayout title="Cookie Policy" lastUpdated={LAST_UPDATED}>
      <p>
        This Cookie Policy explains how VedaGlow uses cookies and similar technologies on our website.
      </p>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">1. What Are Cookies?</h2>
        <p className="mt-2">
          Cookies are small text files stored on your device when you visit our website. They help us
          remember your preferences and improve your experience.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">2. Types of Cookies We Use</h2>

        <h3 className="mt-3 text-xl font-semibold text-[#173229]">a) Necessary Cookies</h3>
        <p className="mt-1">These cookies are essential for the website to function properly.</p>
        <ul className="mt-1 list-disc space-y-1 pl-6">
          <li>Login sessions</li>
          <li>Shopping cart functionality</li>
        </ul>

        <h3 className="mt-4 text-xl font-semibold text-[#173229]">b) Performance Cookies</h3>
        <p className="mt-1">These cookies help us understand how users interact with our website.</p>
        <ul className="mt-1 list-disc space-y-1 pl-6">
          <li>Page visits</li>
          <li>Traffic sources</li>
        </ul>

        <h3 className="mt-4 text-xl font-semibold text-[#173229]">c) Functional Cookies</h3>
        <p className="mt-1">These cookies remember your preferences.</p>
        <ul className="mt-1 list-disc space-y-1 pl-6">
          <li>Saved addresses</li>
          <li>Language settings</li>
        </ul>

        <h3 className="mt-4 text-xl font-semibold text-[#173229]">d) Marketing Cookies</h3>
        <p className="mt-1">
          These cookies are used to show relevant ads and offers.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">3. How We Use Cookies</h2>
        <p className="mt-2">We use cookies to:</p>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Improve website performance</li>
          <li>Remember user preferences</li>
          <li>Provide personalized offers</li>
          <li>Analyze traffic and behavior</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">4. Managing Cookies</h2>
        <p className="mt-2">
          You can control or disable cookies through your browser settings. However, disabling cookies may
          affect website functionality.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">5. Third-Party Cookies</h2>
        <p className="mt-2">
          We may use third-party services like analytics and payment providers that use cookies.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">6. Updates to This Policy</h2>
        <p className="mt-2">
          We may update this Cookie Policy from time to time.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#173229]">7. Contact Us</h2>
        <p className="mt-2">
          For any questions, contact us at:
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
