"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CardGrid } from "./card-grid";
import { EmptyState } from "./empty-state";
import { WalletGuide } from "@/components/optimizer/wallet-guide";
import { CopyCheatSheet } from "@/components/optimizer/copy-cheat-sheet";
import { EmptyOptimizer } from "@/components/optimizer/empty-optimizer";
import type {
  UserCard,
  CatalogCard,
  WalletGuide as WalletGuideType,
  ExperienceLevel,
} from "@wayloft/shared";

interface CardsTabViewProps {
  defaultTab: "cards" | "optimizer";
  cards: UserCard[];
  catalog: CatalogCard[];
  guide: WalletGuideType | null;
  experienceLevel: ExperienceLevel | null;
}

function CardsTabViewInner({
  defaultTab,
  cards,
  catalog,
  guide,
  experienceLevel,
}: CardsTabViewProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentTab =
    searchParams.get("view") === "optimizer" ? "optimizer" : "cards";

  function handleTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "cards") {
      params.delete("view");
    } else {
      params.set("view", value);
    }
    const qs = params.toString();
    router.replace(`/cards${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  return (
    <Tabs
      value={currentTab}
      defaultValue={defaultTab}
      onValueChange={handleTabChange}
    >
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="cards">My Cards</TabsTrigger>
          <TabsTrigger value="optimizer">Optimizer</TabsTrigger>
        </TabsList>
        {currentTab === "optimizer" && guide && (
          <CopyCheatSheet guide={guide} />
        )}
      </div>

      <TabsContent value="cards" className="mt-6">
        {cards.length === 0 ? (
          <EmptyState />
        ) : (
          <CardGrid cards={cards} catalog={catalog} />
        )}
      </TabsContent>

      <TabsContent value="optimizer" className="mt-6">
        {cards.length === 0 || !guide ? (
          <EmptyOptimizer />
        ) : (
          <WalletGuide
            guide={guide}
            catalog={catalog}
            experienceLevel={experienceLevel}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}

export function CardsTabView(props: CardsTabViewProps) {
  return (
    <Suspense>
      <CardsTabViewInner {...props} />
    </Suspense>
  );
}
