import { requireUser } from "@/lib/auth/require-user";
import { AppSidebar } from "@/components/nav/app-sidebar";
import { AppHeader } from "@/components/nav/app-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getAllCards } from "@/lib/cards/catalog";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  const catalog = getAllCards();
  const lightweightCards = catalog.map((c) => ({
    slug: c.slug,
    name: c.name,
    issuer: c.issuer,
  }));

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar user={user} />
      <TooltipProvider delayDuration={300}>
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader cards={lightweightCards} />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </TooltipProvider>
    </div>
  );
}
