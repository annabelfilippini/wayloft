// Issuer → gradient card art styles matching Signal design system
// Each entry has a CSS gradient for card face backgrounds

export const issuerGradients: Record<string, string> = {
  chase: "linear-gradient(135deg, #1a1f71 0%, #0d1347 40%, #0a0e3a 100%)",
  amex: "linear-gradient(135deg, #c6993e 0%, #a67c2e 50%, #b8922f 100%)",
  citi: "linear-gradient(135deg, #005f9e 0%, #003d6b 50%, #004e7a 100%)",
  capital_one: "linear-gradient(160deg, #2d2d2d 0%, #3d3d3d 30%, #1a1a1a 100%)",
  bilt: "linear-gradient(135deg, #1a1a1a 0%, #333333 50%, #0f0f0f 100%)",
  wells_fargo: "linear-gradient(135deg, #b71c1c 0%, #8b0000 50%, #a51717 100%)",
  barclays: "linear-gradient(135deg, #00838f 0%, #005f6b 50%, #00727e 100%)",
  us_bank: "linear-gradient(135deg, #1a3a5c 0%, #0f2440 50%, #162f4c 100%)",
  bank_of_america: "linear-gradient(135deg, #b71c1c 0%, #880e0e 50%, #a01717 100%)",
};

// Tailwind class fallbacks for simpler contexts (non-gradient)
export const issuerColors: Record<
  string,
  { bg: string; text: string; accent: string }
> = {
  chase: { bg: "bg-blue-900", text: "text-white", accent: "bg-blue-700" },
  amex: { bg: "bg-amber-700", text: "text-white", accent: "bg-amber-500" },
  citi: { bg: "bg-sky-800", text: "text-white", accent: "bg-sky-600" },
  capital_one: { bg: "bg-neutral-900", text: "text-white", accent: "bg-neutral-700" },
  bilt: { bg: "bg-neutral-900", text: "text-white", accent: "bg-neutral-700" },
  wells_fargo: { bg: "bg-red-800", text: "text-white", accent: "bg-red-600" },
  barclays: { bg: "bg-teal-700", text: "text-white", accent: "bg-teal-500" },
  us_bank: { bg: "bg-slate-800", text: "text-white", accent: "bg-slate-600" },
  bank_of_america: { bg: "bg-red-800", text: "text-white", accent: "bg-red-600" },
};

export function getIssuerColors(issuer: string) {
  return (
    issuerColors[issuer] ?? {
      bg: "bg-neutral-700",
      text: "text-white",
      accent: "bg-neutral-500",
    }
  );
}

export function getIssuerGradient(issuer: string): string {
  return (
    issuerGradients[issuer] ??
    "linear-gradient(135deg, #333333 0%, #1a1a1a 100%)"
  );
}
