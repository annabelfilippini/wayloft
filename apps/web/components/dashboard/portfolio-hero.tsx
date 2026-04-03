import { createClient } from "@/lib/supabase/server";
import { getAllCppValuations } from "@/lib/cards/valuations";

interface PortfolioHeroProps {
  userId: string;
  displayName: string;
}

export async function PortfolioHero({ userId, displayName }: PortfolioHeroProps) {
  const supabase = await createClient();

  // Get loyalty balances to compute portfolio value
  const { data: balances } = await supabase
    .from("loyalty_balances")
    .select("program_name, program_code, balance, currency")
    .eq("user_id", userId)
    .is("deleted_at", null);

  const valuations = getAllCppValuations();
  const totalValue = Math.round(
    (balances ?? []).reduce((sum, b) => {
      const cpp = valuations[b.program_code]?.cpp ?? 1.0;
      return sum + ((b.balance ?? 0) * cpp) / 100;
    }, 0)
  );
  const programCount = new Set((balances ?? []).map((b) => b.program_code)).size;

  return (
    <div className="mx-auto max-w-[1200px] px-8 pt-[90px] pb-[70px] flex flex-col sm:flex-row justify-between items-start sm:items-end gap-10">
      <div>
        <div className="text-[28px] sm:text-[42px] font-light leading-[1.2] text-muted-foreground">
          Welcome back, <span className="text-foreground font-medium">{displayName}</span>
        </div>
      </div>
      <div className="sm:text-right">
        <div className="label-signal text-muted-foreground mb-3 sm:text-right">
          Estimated Portfolio Value
        </div>
        <div className="mono text-[44px] sm:text-[72px] lg:text-[90px] font-normal text-primary leading-none tracking-[-0.02em]">
          ${totalValue > 0 ? totalValue.toLocaleString() : "—"}
        </div>
        {programCount > 0 && (
          <div className="mono text-[13px] sm:text-[15px] text-muted-foreground mt-2.5 tracking-[0.02em]">
            across {programCount} program{programCount !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
