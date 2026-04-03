import type { Metadata } from "next";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export const metadata: Metadata = {
  title: "Terms of Service — Wayloft",
  description: "Terms and conditions for using Wayloft.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main className="mx-auto max-w-[720px] px-6 py-16 md:px-10 md:py-24">
        <h1 className="text-2xl font-semibold tracking-[-0.01em]">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: April 2, 2026
        </p>

        <div className="mt-12 space-y-10 text-[15px] leading-[1.7] text-foreground/80">
          <section>
            <h2 className="text-base font-semibold text-foreground">
              Agreement
            </h2>
            <p className="mt-3">
              By creating an account or using Wayloft, you agree to these terms.
              If you don&apos;t agree, don&apos;t use the service. We may update
              these terms — continued use after changes means you accept them.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              What Wayloft is
            </h2>
            <p className="mt-3">
              Wayloft is a travel rewards optimization tool. It helps you track
              credit card portfolios, monitor transfer bonuses, compare cards,
              and find ways to get more value from your points and miles.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              Not financial advice
            </h2>
            <p className="mt-3">
              Wayloft is an informational tool, not a financial advisor. Card
              recommendations, value estimates, annual fee verdicts, and
              spending suggestions are based on general calculations — not your
              complete financial picture. Always do your own research and
              consult a financial professional before making credit decisions.
              Point valuations are estimates and actual redemption values vary.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              Your account
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                You are responsible for keeping your login credentials secure.
              </li>
              <li>
                You must provide accurate information when creating your
                account.
              </li>
              <li>
                You must be at least 13 years old to use Wayloft.
              </li>
              <li>
                One account per person. Don&apos;t share accounts or create
                multiple accounts.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              Affiliate links
            </h2>
            <p className="mt-3">
              Some links on Wayloft are affiliate links. When you click through
              and are approved for a card, we may receive compensation from the
              card issuer. This does not affect the order of our recommendations
              or the information we display. Our card data comes from public
              issuer sources, not affiliate partners.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              Acceptable use
            </h2>
            <p className="mt-3">Don&apos;t use Wayloft to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Scrape, crawl, or bulk-extract data from the platform</li>
              <li>
                Interfere with the service or attempt to access other
                users&apos; data
              </li>
              <li>Use automated tools to create accounts or submit data</li>
              <li>Violate any applicable laws</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              Your data
            </h2>
            <p className="mt-3">
              You own the data you enter into Wayloft (card portfolio, spending,
              balances). We store it to provide the service and you can request
              its deletion at any time. See our{" "}
              <a
                href="/privacy"
                className="text-foreground underline underline-offset-4"
              >
                Privacy Policy
              </a>{" "}
              for details on how we handle your data.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              Data accuracy
            </h2>
            <p className="mt-3">
              We work to keep card data (annual fees, earning rates, signup
              bonuses, transfer partners) accurate and up to date, but card
              issuers change terms frequently. Wayloft is not responsible for
              outdated or incorrect card information. Always verify terms
              directly with the card issuer before applying.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              Limitation of liability
            </h2>
            <p className="mt-3">
              Wayloft is provided &ldquo;as is&rdquo; without warranties of any
              kind. We are not liable for any damages arising from your use of
              the service, including but not limited to: financial decisions made
              based on our tools, loss of data, or service interruptions. Our
              total liability is limited to the amount you have paid us (if
              any) in the 12 months prior to the claim.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              Termination
            </h2>
            <p className="mt-3">
              You can delete your account at any time. We may suspend or
              terminate accounts that violate these terms. On termination, your
              data will be deleted per our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              Governing law
            </h2>
            <p className="mt-3">
              These terms are governed by the laws of the State of Michigan. Any
              disputes will be resolved in the courts of Washtenaw County,
              Michigan.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              Contact
            </h2>
            <p className="mt-3">
              Questions about these terms? Email{" "}
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
