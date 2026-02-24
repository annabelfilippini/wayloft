export const GLOSSARY: Record<
  string,
  { term: string; beginner: string; intermediate: string }
> = {
  earning_rate: {
    term: "Earning rate",
    beginner:
      "How many points you earn per dollar spent in this category",
    intermediate: "Points multiplier per $1 in this spending category",
  },
  earning_cap: {
    term: "Earning cap",
    beginner:
      "A limit on how much bonus earning you can get in this category before it drops to 1x",
    intermediate:
      "Maximum spend that earns the bonus multiplier per period",
  },
  portal_cpp: {
    term: "Portal value",
    beginner:
      "How much each point is worth when you book travel through your card's website",
    intermediate:
      "Cents-per-point redemption rate in the issuer's travel portal",
  },
  cpp: {
    term: "cpp",
    beginner:
      "Cents per point — how much each point is worth in real money",
    intermediate: "Cents-per-point valuation",
  },
  annual_fee: {
    term: "Annual fee",
    beginner:
      "A yearly charge for having this card — offset it with perks and credits",
    intermediate: "Yearly card fee",
  },
  transfer_partner: {
    term: "Transfer partner",
    beginner:
      "An airline or hotel you can send your points to, often for better value than booking through the card's portal",
    intermediate:
      "Airline/hotel loyalty program you can transfer points to at a set ratio",
  },
  effective_cents: {
    term: "\u00a2/$",
    beginner:
      "Cents of value you earn per dollar spent, factoring in point valuations",
    intermediate: "Effective cents earned per dollar spent",
  },
  signup_bonus: {
    term: "Signup bonus",
    beginner:
      "A big chunk of points you get after spending a required amount in your first few months",
    intermediate: "Welcome offer points after meeting minimum spend",
  },
};
