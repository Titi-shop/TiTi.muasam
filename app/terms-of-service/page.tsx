// app/terms-of-service/page.tsx

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Titi Marketplace",
  description: "Terms of Service for Titi Marketplace",
};

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-6 text-4xl font-bold">Terms of Service</h1>

      <p className="mb-8 text-sm opacity-70">
        Last Updated: June 22, 2026
      </p>

      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold">
          1. Acceptance of Terms
        </h2>
        <p>
          By accessing or using Titi Marketplace, you agree to comply with and
          be bound by these Terms of Service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold">
          2. Marketplace Services
        </h2>
        <p>
          Titi Marketplace is an online marketplace built on the Pi Network
          ecosystem where users can buy, sell, and manage products using Pi
          Network supported payment methods.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold">
          3. User Accounts
        </h2>

        <ul className="list-disc pl-6">
          <li>Users access the platform using Pi Network authentication.</li>
          <li>Users are responsible for account security.</li>
          <li>Users must provide accurate information.</li>
          <li>Users may not impersonate other individuals.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold">
          4. Seller Responsibilities
        </h2>

        <ul className="list-disc pl-6">
          <li>Provide accurate product information.</li>
          <li>Maintain inventory accuracy.</li>
          <li>Ship products within a reasonable timeframe.</li>
          <li>Comply with applicable laws.</li>
          <li>Honor accepted orders.</li>
        </ul>

        <p className="mt-3">
          Sellers are solely responsible for products listed and sold through
          the platform.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold">
          5. Buyer Responsibilities
        </h2>

        <ul className="list-disc pl-6">
          <li>Review product information before purchase.</li>
          <li>Provide accurate shipping information.</li>
          <li>Complete payments honestly.</li>
          <li>Use dispute procedures in good faith.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold">
          6. Payments
        </h2>

        <p>
          Payments may be processed using Pi Network and associated payment
          infrastructure.
        </p>

        <ul className="mt-3 list-disc pl-6">
          <li>Blockchain transactions may be irreversible.</li>
          <li>Users must verify payment details before confirmation.</li>
          <li>Titi Marketplace does not control the Pi blockchain.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold">
          7. Escrow and Settlement
        </h2>

        <p>
          Funds may be temporarily held for settlement, order processing,
          dispute resolution, or fraud prevention purposes.
        </p>

        <p className="mt-3">
          Titi Marketplace reserves the right to delay settlement while
          verification or dispute investigations are ongoing.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold">
          8. Withdrawals
        </h2>

        <ul className="list-disc pl-6">
          <li>Withdrawal requests may be reviewed before processing.</li>
          <li>Users are responsible for wallet address accuracy.</li>
          <li>Suspicious withdrawals may be delayed or rejected.</li>
          <li>Security verification may be required.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold">
          9. Prohibited Activities
        </h2>

        <ul className="list-disc pl-6">
          <li>Fraud or deceptive conduct.</li>
          <li>Sale of illegal products.</li>
          <li>Money laundering activities.</li>
          <li>Unauthorized access to systems.</li>
          <li>Abuse of marketplace services.</li>
          <li>Distribution of malicious software.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold">
          10. Account Suspension
        </h2>

        <p>
          We reserve the right to suspend or terminate accounts involved in
          fraud, abuse, security threats, or violations of these Terms.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold">
          11. Limitation of Liability
        </h2>

        <p>
          Titi Marketplace is provided on an "as is" basis. To the fullest
          extent permitted by law, we are not liable for indirect or
          consequential damages arising from use of the platform.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold">
          12. Changes to Terms
        </h2>

        <p>
          We may update these Terms from time to time. Continued use of the
          platform after changes become effective constitutes acceptance of the
          updated Terms.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-semibold">
          13. Contact Information
        </h2>

        <p>Email: support@titi.onl</p>
        <p>Website: https://titi.onl</p>
      </section>
    </main>
  );
}
