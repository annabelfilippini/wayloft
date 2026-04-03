import { requireUser } from "@/lib/auth/require-user";
import { AppTopNav } from "@/components/nav/app-topnav";
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <TooltipProvider delayDuration={300}>
      <AppTopNav user={user} />
      <main className="pt-[52px] pb-14 md:pb-0 min-h-screen">
        {children}
      </main>
    </TooltipProvider>
  );
}
