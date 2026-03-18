import { requireUser } from "@/lib/auth/require-user";
import { AppSidebar } from "@/components/nav/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar user={user} />
      <TooltipProvider delayDuration={300}>
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </TooltipProvider>
    </div>
  );
}
