import { getIssuerGradient } from "@/lib/cards/issuer-colors";
import { cn } from "@/lib/utils";

interface CardArtPlaceholderProps {
  issuer: string;
  network: string;
  cardName: string;
  className?: string;
  /** Hide text labels — useful when the card is rendered small and name is shown elsewhere */
  hideLabels?: boolean;
}

export function CardArtPlaceholder({
  issuer,
  network,
  cardName,
  className,
  hideLabels,
}: CardArtPlaceholderProps) {
  const gradient = getIssuerGradient(issuer);

  return (
    <div
      className={cn(
        "relative aspect-[1.586/1] w-full overflow-hidden rounded-lg",
        className
      )}
      style={{ background: gradient }}
    >
      {/* Gold chip */}
      <div
        className="absolute top-[14%] left-[6.5%] w-[11%] rounded"
        style={{
          aspectRatio: "44/30",
          background:
            "linear-gradient(135deg, #d4af37 0%, #f5d682 40%, #c5a028 70%, #e8c84a 100%)",
          boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3)",
        }}
      />

      {!hideLabels && (
        <>
          {/* Issuer name — top right */}
          <div className="absolute top-[14%] right-[6.5%] mono text-[11px] uppercase tracking-[0.06em] text-white/50">
            {issuer.replace("_", " ")}
          </div>

          {/* Card name — bottom left */}
          <div className="absolute bottom-[19%] left-[6.5%] text-[14px] font-semibold tracking-[0.04em] text-white/90">
            {cardName.toUpperCase()}
          </div>

          {/* Network badge — bottom right */}
          <div className="absolute bottom-[8.5%] right-[6.5%] mono text-[11px] uppercase tracking-[0.06em] text-white/40">
            {network}
          </div>
        </>
      )}
    </div>
  );
}
