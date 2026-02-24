import Link from "next/link";
import Nav from "@/components/Nav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — FDE World",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Nav />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <Link
          href="/"
          className="text-sm text-accent hover:text-accent-hover transition-colors duration-150 mb-6 inline-block"
        >
          &larr; Back to home
        </Link>

        <article className="prose prose-zinc max-w-none">
          <h1 className="text-2xl font-semibold tracking-heading text-text-primary mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-text-tertiary mb-8">
            Last updated: February 2026
          </p>

          <section className="space-y-6 text-sm text-text-secondary leading-relaxed">
            <div>
              <h2 className="text-base font-semibold text-text-primary mb-2">
                Who we are
              </h2>
              <p>
                FDE World is operated by Ikuto Group, a company registered in the
                United Kingdom. When we say &ldquo;we&rdquo;, &ldquo;us&rdquo; or
                &ldquo;our&rdquo; in this policy, we mean Ikuto Group.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-text-primary mb-2">
                What data we collect
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Email address</li>
                <li>
                  Profile information: name, location, skills, work authorisation,
                  notice period, salary expectations, current role, current company,
                  years of experience, LinkedIn profile URL, and open-to-work status
                </li>
                <li>CV / resume (optional, uploaded by you)</li>
                <li>Job save history</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-semibold text-text-primary mb-2">
                Why we collect it
              </h2>
              <p>We process your data under the following lawful bases:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>
                  <strong>Legitimate interests</strong> &mdash; to provide
                  personalised job matching, your candidate profile, and the FDE
                  World community experience.
                </li>
                <li>
                  <strong>Consent</strong> &mdash; for marketing emails (e.g. job
                  alert digests). You can change your alert frequency or opt out at
                  any time from your account settings.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-semibold text-text-primary mb-2">
                How we use your data
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Personalised job feed based on your role preferences</li>
                <li>Email digest of new matching roles (daily or weekly)</li>
                <li>Your candidate profile, visible only to you</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-semibold text-text-primary mb-2">
                Who we share your data with
              </h2>
              <p>
                We never sell your data. We use the following GDPR-compliant
                processors:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>
                  <strong>Railway</strong> &mdash; infrastructure and hosting (EU
                  region)
                </li>
                <li>
                  <strong>Resend</strong> &mdash; email delivery
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-semibold text-text-primary mb-2">
                How long we keep your data
              </h2>
              <p>
                We retain your data until you delete your account. When you delete
                your account, all personal data including your profile, saved jobs,
                and uploaded CV are permanently removed.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-text-primary mb-2">
                Your rights
              </h2>
              <p>Under UK GDPR you have the right to:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>
                  <strong>Access</strong> &mdash; request a copy of your data
                </li>
                <li>
                  <strong>Erasure</strong> &mdash; delete your account and all
                  associated data
                </li>
                <li>
                  <strong>Rectification</strong> &mdash; correct inaccurate data via
                  your account settings
                </li>
                <li>
                  <strong>Portability</strong> &mdash; receive your data in a
                  structured, machine-readable format
                </li>
                <li>
                  <strong>Object</strong> &mdash; object to processing based on
                  legitimate interests
                </li>
              </ul>
              <p className="mt-2">
                To exercise any of these rights, contact us at{" "}
                <a
                  href="mailto:hello@fdeworld.com"
                  className="text-accent hover:text-accent-hover underline"
                >
                  hello@fdeworld.com
                </a>
                .
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-text-primary mb-2">
                Cookies
              </h2>
              <p>
                We use a single session cookie to keep you signed in. We do not use
                any tracking, analytics, or advertising cookies.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-text-primary mb-2">
                Contact
              </h2>
              <p>
                If you have questions about this policy or your data, email us at{" "}
                <a
                  href="mailto:hello@fdeworld.com"
                  className="text-accent hover:text-accent-hover underline"
                >
                  hello@fdeworld.com
                </a>
                .
              </p>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
