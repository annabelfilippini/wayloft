import type { Metadata } from "next";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export const metadata: Metadata = {
  title: "Privacy Policy — Wayloft",
  description: "How Wayloft collects, uses, and protects your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main className="mx-auto max-w-[720px] px-6 py-16 md:px-10 md:py-24">
        <h1 className="text-2xl font-semibold tracking-[-0.01em]">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: April 2, 2026
        </p>

        <div className="mt-12 space-y-10 text-[15px] leading-[1.7] text-foreground/80">
          <section>
            <h2 className="text-base font-semibold text-foreground">
              What we collect
            </h2>
            <p className="mt-3">
              When you create an account, we collect your email address and name
              (or the profile information provided by Google if you sign in with
              Google OAuth). When you use Wayloft, we store the data you enter —
              your card portfolio, spending amounts, payment dates, loyalty
              balances, and quiz responses. This data is stored in our database
              hosted by Supabase (US servers).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              How we use your data
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong>Provide the service:</strong> Your card and spending data
                powers your dashboard, optimizer, recommendations, and alerts.
              </li>
              <li>
                <strong>Improve the product:</strong> We use aggregate,
                anonymized usage patterns to improve features. We never sell your
                individual data.
              </li>
              <li>
                <strong>Affiliate tracking:</strong> When you click an affiliate
                link to a card issuer, we log the click (card, page, timestamp)
                to measure which content is useful. This works for both
                logged-in and anonymous visitors.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              Cookies and sessions
            </h2>
            <p className="mt-3">
              We use essential cookies to maintain your login session via
              Supabase Auth. We do not use advertising cookies or third-party
              tracking cookies. We may add privacy-respecting analytics (such as
              PostHog) in the future — if we do, this policy will be updated.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              Third-party services
            </h2>
            <p className="mt-3">We use the following services to operate Wayloft:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong>Supabase</strong> — database and authentication (US
                servers)
              </li>
              <li>
                <strong>Vercel</strong> — hosting and deployment (US servers)
              </li>
              <li>
                <strong>Google</strong> — OAuth sign-in (if you choose Google
                login)
              </li>
            </ul>
            <p className="mt-3">
              Each service has its own privacy policy. We do not share your
              personal data with any other third parties.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              Data retention and deletion
            </h2>
            <p className="mt-3">
              Your data is retained as long as your account is active. You can
              request deletion of your account and all associated data by
              emailing us. Upon deletion, your data is permanently removed from
              our database.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              Your rights
            </h2>
            <p className="mt-3">You have the right to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data in a portable format</li>
            </ul>
            <p className="mt-3">
              If you are a California resident, you have additional rights under
              the CCPA, including the right to know what personal information we
              collect and the right to opt out of the sale of personal
              information. We do not sell personal information.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              Children
            </h2>
            <p className="mt-3">
              Wayloft is not intended for users under 13 years of age. We do not
              knowingly collect data from children.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              Changes to this policy
            </h2>
            <p className="mt-3">
              We may update this policy from time to time. If we make material
              changes, we will notify you by updating the date at the top of
              this page.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              Contact
            </h2>
            <p className="mt-3">
              Questions about this policy? Email{" "}
              <a
                href="mailto:annabelfilippini@wayloft.app"
                className="text-foreground underline underline-offset-4"
              >
                annabelfilippini@wayloft.app
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
