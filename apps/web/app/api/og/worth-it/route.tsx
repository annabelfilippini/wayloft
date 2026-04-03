import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

// Load card data at module level
const dataPath = join(process.cwd(), "../../data/credit-cards.json");
const cards = JSON.parse(readFileSync(dataPath, "utf-8")) as any[];

function getCard(slug: string) {
  return cards.find((c: any) => c.slug === slug);
}

function annualizeCents(credit: any): number {
  const mult: Record<string, number> = {
    monthly: 12, quarterly: 4, semi_annual: 2, annual: 1, card_year: 1,
  };
  return credit.amount_cents * (mult[credit.period] ?? 1);
}

function fmtDollars(cents: number): string {
  return `$${Math.round(Math.abs(cents) / 100).toLocaleString()}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }

  const card = getCard(slug);
  if (!card) {
    return new Response("Card not found", { status: 404 });
  }

  const credits = card.credits ?? [];
  const perks = card.perks ?? [];
  const creditsTotal = credits.reduce((s: number, c: any) => s + annualizeCents(c), 0);
  const perksTotal = perks.reduce((s: number, p: any) => s + p.estimated_annual_value_cents, 0);
  const netValue = creditsTotal + perksTotal - card.annual_fee_cents;
  const benefitCount = credits.length + perks.length;

  let verdict: string;
  let verdictColor: string;
  if (netValue >= 5000) {
    verdict = "KEEP";
    verdictColor = "#22c55e";
  } else if (netValue >= -5000) {
    verdict = "CALL FOR RETENTION";
    verdictColor = "#D4A020";
  } else {
    verdict = "DOWNGRADE";
    verdictColor = "#ef4444";
  }

  const cardTitle = `Is ${card.name.startsWith("The ") ? "" : "the "}${card.name} worth it?`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0F0F0F",
          padding: "60px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "40px" }}>
          <span style={{ fontSize: "18px", fontWeight: 700, color: "#D4A020", letterSpacing: "-0.04em" }}>
            WAYLOFT
          </span>
          <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>
            CARD ANALYZER
          </span>
        </div>

        {/* Card name */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <span style={{ fontSize: "20px", color: "rgba(255,255,255,0.4)", marginBottom: "8px", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>
            {card.issuer}
          </span>
          <span style={{ fontSize: "44px", fontWeight: 600, color: "#FAFAF6", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: "40px" }}>
            {cardTitle}
          </span>

          {/* Verdict + Net Value */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
                VERDICT (ALL BENEFITS)
              </span>
              <span style={{ fontSize: "28px", fontWeight: 700, color: verdictColor }}>
                {verdict}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
                NET VALUE
              </span>
              <span style={{ fontSize: "52px", fontWeight: 400, color: netValue >= 0 ? "#22c55e" : "#ef4444", letterSpacing: "-0.02em", lineHeight: 1 }}>
                {netValue >= 0 ? "+" : "-"}{fmtDollars(netValue)}
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: "48px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "24px" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>Credits</span>
              <span style={{ fontSize: "20px", color: "#22c55e" }}>+{fmtDollars(creditsTotal)}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>Perks</span>
              <span style={{ fontSize: "20px", color: "#22c55e" }}>+{fmtDollars(perksTotal)}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>Annual Fee</span>
              <span style={{ fontSize: "20px", color: "#ef4444" }}>-{fmtDollars(card.annual_fee_cents)}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>Benefits</span>
              <span style={{ fontSize: "20px", color: "#FAFAF6" }}>{benefitCount} to toggle</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
          <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.2)" }}>Analysis by Ellis Church</span>
          <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.2)" }}>wayloft.app</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
