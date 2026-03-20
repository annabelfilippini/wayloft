import { getIssuerColors } from "@/lib/cards/issuer-colors";
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
  const colors = getIssuerColors(issuer);

  return (
    <div
      className={cn(
        "relative aspect-[1.586/1] w-full overflow-hidden rounded-lg",
        colors.bg,
        colors.text,
        className
      )}
    >
      {/* Accent stripe */}
      <div className={cn("absolute top-0 right-0 h-full w-1/3 opacity-30", colors.accent)} />

      {!hideLabels && (
        <>
          {/* Issuer name */}
          <div className="absolute top-3 left-4 text-xs font-bold uppercase tracking-wider opacity-80">
            {issuer.replace("_", " ")}
          </div>

          {/* Card name */}
          <div className="absolute bottom-6 left-4 right-4 text-sm font-semibold leading-tight">
            {cardName}
          </div>

          {/* Network badge */}
          <div className="absolute right-3 bottom-3 text-[10px] font-medium uppercase opacity-60">
            {network}
          </div>
        </>
      )}
    </div>
  );
}
