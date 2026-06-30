// =====================================================
// app/privacy-policy/page.tsx
// =====================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | TITI Marketplace",
  description:
    "Privacy Policy for TITI Marketplace",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">

      {/* ===================================================
          HEADER
      =================================================== */}

      <h1 className="mb-2 text-4xl font-bold">
        Privacy Policy
      </h1>

      <p className="text-sm opacity-70">
        Version 1.0
      </p>

      <p className="mb-10 text-sm opacity-70">
        Last Updated: June 30, 2026
      </p>

      {/* ===================================================
          1. INTRODUCTION
      =================================================== */}

      <section className="mb-10">

        <h2 className="mb-4 text-2xl font-semibold">
          1. Introduction
        </h2>

        <p className="mb-4">
          Welcome to TITI Marketplace
          ("TITI", "we", "our", or "us").
          TITI Marketplace is an online
          marketplace built on the
          Pi Network ecosystem that
          allows users to discover,
          buy, sell, and manage products
          using supported Pi Network
          payment services.
        </p>

        <p className="mb-4">
          Your privacy is important to us.
          This Privacy Policy explains
          what information we collect,
          how we use it, how we protect
          it, and the choices available
          to you when using our services.
        </p>

        <p>
          By accessing or using
          TITI Marketplace, you
          acknowledge that you have
          read and understood this
          Privacy Policy.
        </p>

      </section>

      {/* ===================================================
          2. DEFINITIONS
      =================================================== */}

      <section className="mb-10">

        <h2 className="mb-4 text-2xl font-semibold">
          2. Definitions
        </h2>

        <ul className="list-disc space-y-3 pl-6">

          <li>
            <strong>TITI Marketplace</strong>
            {" "}
            refers to the marketplace
            platform operated by us.
          </li>

          <li>
            <strong>User</strong>
            {" "}
            means any individual who
            accesses or uses the
            platform.
          </li>

          <li>
            <strong>Seller</strong>
            {" "}
            means a user authorized
            to publish and sell
            products.
          </li>

          <li>
            <strong>Buyer</strong>
            {" "}
            means a user purchasing
            products through the
            marketplace.
          </li>

          <li>
            <strong>Pi Network</strong>
            {" "}
            refers to the authentication
            and payment ecosystem used
            by this platform.
          </li>

          <li>
            <strong>Blockchain</strong>
            {" "}
            means the public distributed
            ledger used for recording
            Pi transactions.
          </li>

        </ul>

      </section>

      {/* ===================================================
          3. INFORMATION WE COLLECT
      =================================================== */}

      <section className="mb-10">

        <h2 className="mb-4 text-2xl font-semibold">
          3. Information We Collect
        </h2>

        <p className="mb-5">
          We collect only the
          information reasonably
          necessary to operate,
          secure, and improve
          TITI Marketplace.
        </p>

        {/* Pi */}

        <h3 className="mb-3 text-lg font-semibold">
          3.1 Pi Network Account
        </h3>

        <ul className="mb-6 list-disc space-y-2 pl-6">

          <li>Pi username</li>

          <li>Pi user identifier (UID)</li>

          <li>
            Authentication information
            provided by Pi Network
          </li>

          <li>
            Public wallet address
            when required for
            supported payment
            functions
          </li>

        </ul>

        <p className="mb-6">
          We only receive information
          required to identify your
          Pi Network account.
          We do not receive or store
          your Pi wallet password,
          private key, recovery phrase,
          or other wallet secrets.
        </p>

        {/* Marketplace */}

        <h3 className="mb-3 text-lg font-semibold">
          3.2 Marketplace Information
        </h3>

        <ul className="mb-6 list-disc space-y-2 pl-6">

          <li>User profile</li>

          <li>Seller profile</li>

          <li>Store information</li>

          <li>Product listings</li>

          <li>Product descriptions</li>

          <li>Product images</li>

          <li>Product videos</li>

          <li>Categories</li>

          <li>Reviews and ratings</li>

          <li>Shopping cart</li>

          <li>Wishlist and favorites</li>

        </ul>

        {/* Orders */}

        <h3 className="mb-3 text-lg font-semibold">
          3.3 Orders & Shipping
        </h3>

        <ul className="mb-6 list-disc space-y-2 pl-6">

          <li>Recipient name</li>

          <li>Shipping address</li>

          <li>Country</li>

          <li>State or region</li>

          <li>Postal code (if provided)</li>

          <li>Contact phone (optional)</li>

          <li>Order history</li>

          <li>Delivery information</li>

          <li>Order status</li>

        </ul>

        {/* Wallet */}

        <h3 className="mb-3 text-lg font-semibold">
          3.4 Wallet & Payment
          Information
        </h3>

        <ul className="mb-6 list-disc space-y-2 pl-6">

          <li>Payment identifiers</li>

          <li>Payment status</li>

          <li>Withdrawal requests</li>

          <li>Settlement records</li>

          <li>Escrow records</li>

          <li>Blockchain transaction IDs</li>

          <li>Withdrawal history</li>

          <li>Wallet verification records</li>

        </ul>

        {/* Technical */}

        <h3 className="mb-3 text-lg font-semibold">
          3.5 Technical Information
        </h3>

        <ul className="list-disc space-y-2 pl-6">

          <li>IP address</li>

          <li>Browser type</li>

          <li>Operating system</li>

          <li>Device information</li>

          <li>Security logs</li>

          <li>Error logs</li>

          <li>Performance diagnostics</li>

        </ul>

      </section>

      {/* ===================================================
          4. HOW WE USE INFORMATION
      =================================================== */}

      <section className="mb-10">

        <h2 className="mb-4 text-2xl font-semibold">
          4. How We Use Your Information
        </h2>

        <p className="mb-5">
          Information collected through
          TITI Marketplace is used only
          for legitimate business,
          operational, and security
          purposes.
        </p>

        <ul className="list-disc space-y-3 pl-6">

          <li>
            Authenticate users through
            Pi Network.
          </li>

          <li>
            Operate and maintain the
            marketplace.
          </li>

          <li>
            Process purchases and sales.
          </li>

          <li>
            Process Pi payments and
            settlements.
          </li>

          <li>
            Process withdrawal requests.
          </li>

          <li>
            Deliver products to buyers.
          </li>

          <li>
            Provide customer support.
          </li>

          <li>
            Detect fraud, abuse,
            and suspicious activity.
          </li>

          <li>
            Protect platform security.
          </li>

          <li>
            Improve application
            performance and reliability.
          </li>

          <li>
            Comply with applicable
            laws and regulations.
          </li>

        </ul>

      </section>

      {/* ===================================================
          CONTINUE PART 2
      =================================================== */}
      {/* ===================================================
          5. PI NETWORK AUTHENTICATION
      =================================================== */}

      <section className="mb-10">

        <h2 className="mb-4 text-2xl font-semibold">
          5. Pi Network Authentication
        </h2>

        <p className="mb-4">
          TITI Marketplace uses
          Pi Network as its primary
          authentication provider.
          Authentication allows us
          to verify your identity
          without requiring a separate
          username and password.
        </p>

        <p className="mb-4">
          We only receive information
          that Pi Network provides for
          authentication purposes.
          Your Pi wallet private key,
          recovery phrase, and wallet
          password are never accessible
          to TITI Marketplace.
        </p>

        <p>
          Authentication tokens are used
          only to verify your identity
          and protect your account from
          unauthorized access.
        </p>

      </section>

      {/* ===================================================
          6. WALLET & BLOCKCHAIN
      =================================================== */}

      <section className="mb-10">

        <h2 className="mb-4 text-2xl font-semibold">
          6. Wallet & Blockchain
          Transactions
        </h2>

        <p className="mb-4">
          Payments processed through
          TITI Marketplace may be
          recorded on the Pi blockchain.
          Blockchain records are
          publicly visible and cannot
          normally be modified or
          deleted.
        </p>

        <p className="mb-4">
          Financial records stored by
          TITI Marketplace may include
          payment identifiers,
          settlement information,
          withdrawal requests,
          escrow records, and
          transaction references.
        </p>

        <ul className="list-disc space-y-2 pl-6">

          <li>
            We do not store your
            wallet password.
          </li>

          <li>
            We do not store your
            private key.
          </li>

          <li>
            We do not store your
            recovery phrase.
          </li>

          <li>
            Blockchain transaction
            history cannot be removed
            by TITI Marketplace.
          </li>

        </ul>

      </section>

      {/* ===================================================
          7. INFORMATION SHARING
      =================================================== */}

      <section className="mb-10">

        <h2 className="mb-4 text-2xl font-semibold">
          7. Information Sharing
        </h2>

        <p className="mb-4">
          We do not sell your personal
          information.
        </p>

        <p className="mb-4">
          Information may be shared only
          when reasonably necessary to
          operate the marketplace or
          comply with legal obligations.
        </p>

        <ul className="list-disc space-y-2 pl-6">

          <li>
            Shipping providers
          </li>

          <li>
            Payment infrastructure
            providers
          </li>

          <li>
            Cloud hosting providers
          </li>

          <li>
            Fraud prevention services
          </li>

          <li>
            Professional advisors
            when legally required
          </li>

          <li>
            Government authorities
            where required by law
          </li>

        </ul>

      </section>

      {/* ===================================================
          8. COOKIES & LOCAL STORAGE
      =================================================== */}

      <section className="mb-10">

        <h2 className="mb-4 text-2xl font-semibold">
          8. Cookies & Local Storage
        </h2>

        <p className="mb-4">
          TITI Marketplace may use
          browser local storage and
          similar technologies to
          improve functionality,
          remember application
          settings, and maintain
          secure user sessions.
        </p>

        <p className="mb-4">
          Local storage may contain
          temporary authentication
          information, language
          preferences, interface
          settings, shopping cart
          information, and other data
          required for normal platform
          operation.
        </p>

        <p>
          TITI Marketplace does not use
          advertising cookies for
          behavioral advertising.
        </p>

      </section>

      {/* ===================================================
          9. DATA RETENTION
      =================================================== */}

      <section className="mb-10">

        <h2 className="mb-4 text-2xl font-semibold">
          9. Data Retention
        </h2>

        <p className="mb-4">
          We retain information only
          for as long as reasonably
          necessary to operate
          TITI Marketplace.
        </p>

        <ul className="list-disc space-y-2 pl-6">

          <li>
            Maintain user accounts.
          </li>

          <li>
            Process marketplace
            transactions.
          </li>

          <li>
            Resolve disputes.
          </li>

          <li>
            Prevent fraud.
          </li>

          <li>
            Protect platform security.
          </li>

          <li>
            Comply with accounting
            and legal obligations.
          </li>

        </ul>

      </section>

      {/* ===================================================
          10. SECURITY
      =================================================== */}

      <section className="mb-10">

        <h2 className="mb-4 text-2xl font-semibold">
          10. Security
        </h2>

        <p className="mb-4">
          Protecting user information
          is one of our highest
          priorities.
        </p>

        <p className="mb-4">
          We implement administrative,
          technical, and organizational
          safeguards designed to
          protect user information
          against unauthorized access,
          alteration, disclosure,
          or destruction.
        </p>

        <ul className="list-disc space-y-2 pl-6">

          <li>
            Authentication controls
          </li>

          <li>
            Access controls
          </li>

          <li>
            Encrypted communications
          </li>

          <li>
            Security monitoring
          </li>

          <li>
            Audit logging
          </li>

          <li>
            Fraud detection
          </li>

          <li>
            Backup and recovery
            procedures
          </li>

        </ul>

        <p className="mt-4">
          While we work to protect
          your information, no
          internet-based service can
          guarantee absolute security.
        </p>

      </section>

      {/* ===================================================
          CONTINUE PART 3
      =================================================== */}
          {/* ===================================================
          11. YOUR RIGHTS
      =================================================== */}

      <section className="mb-10">

        <h2 className="mb-4 text-2xl font-semibold">
          11. Your Rights
        </h2>

        <p className="mb-4">
          Depending on applicable laws,
          you may have certain rights
          regarding your personal
          information.
        </p>

        <ul className="list-disc space-y-2 pl-6">

          <li>
            Access information associated
            with your account.
          </li>

          <li>
            Update or correct inaccurate
            information.
          </li>

          <li>
            Request deletion of eligible
            personal information.
          </li>

          <li>
            Contact us regarding privacy
            concerns or questions.
          </li>

        </ul>

        <p className="mt-4">
          Some information cannot be
          deleted where retention is
          required for legal obligations,
          fraud prevention, dispute
          resolution, accounting
          requirements, or where records
          have already become part of a
          public blockchain.
        </p>

      </section>

      {/* ===================================================
          12. CHILDREN'S PRIVACY
      =================================================== */}

      <section className="mb-10">

        <h2 className="mb-4 text-2xl font-semibold">
          12. Children's Privacy
        </h2>

        <p>
          TITI Marketplace is intended
          only for individuals who are
          legally permitted to use the
          platform under applicable laws
          and Pi Network policies.
          We do not knowingly collect
          personal information from
          individuals who are not
          permitted to use our services.
        </p>

      </section>

      {/* ===================================================
          13. INTERNATIONAL USERS
      =================================================== */}

      <section className="mb-10">

        <h2 className="mb-4 text-2xl font-semibold">
          13. International Users
        </h2>

        <p className="mb-4">
          TITI Marketplace may be
          accessed from different
          countries and regions.
          By using our services,
          you understand that your
          information may be processed
          where our systems or service
          providers operate, subject
          to applicable laws.
        </p>

        <p>
          We strive to protect user
          information regardless of
          geographic location by
          applying appropriate security
          measures.
        </p>

      </section>

      {/* ===================================================
          14. CHANGES TO THIS POLICY
      =================================================== */}

      <section className="mb-10">

        <h2 className="mb-4 text-2xl font-semibold">
          14. Changes to This Privacy
          Policy
        </h2>

        <p className="mb-4">
          We may update this Privacy
          Policy from time to time
          to reflect improvements to
          our services, legal
          requirements, or security
          practices.
        </p>

        <p className="mb-4">
          When significant changes are
          made, the updated version
          number and "Last Updated"
          date will be revised on this
          page.
        </p>

        <p>
          Continued use of
          TITI Marketplace after an
          updated Privacy Policy
          becomes effective constitutes
          acceptance of the revised
          policy.
        </p>

      </section>

      {/* ===================================================
          15. CONTACT US
      =================================================== */}

      <section className="mb-10">

        <h2 className="mb-4 text-2xl font-semibold">
          15. Contact Us
        </h2>

        <p className="mb-4">
          If you have questions about
          this Privacy Policy or your
          personal information, please
          contact us.
        </p>

        <div className="space-y-2">

          <p>
            <strong>Email:</strong>
            {" "}
            support@titi.onl
          </p>

          <p>
            <strong>Website:</strong>
            {" "}
            https://titi.onl
          </p>

        </div>

      </section>

      {/* ===================================================
          FOOTER
      =================================================== */}

      <hr className="my-10" />

      <p className="text-center text-sm opacity-60">
        © 2026 TITI Marketplace.
        All rights reserved.
      </p>

    </main>
  );
}
    
