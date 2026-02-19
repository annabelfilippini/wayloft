// Issuer → Tailwind color classes for card art placeholders
// Each entry has bg (background), text (foreground), and accent

export const issuerColors: Record<
  string,
  { bg: string; text: string; accent: string }
> = {
  chase: { bg: "bg-blue-900", text: "text-white", accent: "bg-blue-700" },
  amex: { bg: "bg-sky-700", text: "text-white", accent: "bg-sky-500" },
  citi: { bg: "bg-blue-600", text: "text-white", accent: "bg-blue-400" },
  capital_one: { bg: "bg-red-700", text: "text-white", accent: "bg-red-500" },
  bilt: { bg: "bg-neutral-900", text: "text-white", accent: "bg-neutral-700" },
  wells_fargo: { bg: "bg-yellow-600", text: "text-white", accent: "bg-yellow-500" },
  barclays: { bg: "bg-cyan-700", text: "text-white", accent: "bg-cyan-500" },
  us_bank: { bg: "bg-purple-800", text: "text-white", accent: "bg-purple-600" },
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
