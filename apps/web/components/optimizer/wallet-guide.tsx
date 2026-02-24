"use client";

import type { WalletGuide as WalletGuideType, CatalogCard, ExperienceLevel } from "@wayloft/shared";
import { CATEGORY_DEFINITIONS } from "@/lib/optimizer/categories";
import { CategoryRow } from "./category-row";

interface WalletGuideProps {
  guide: WalletGuideType;
  catalog: CatalogCard[];
  experienceLevel?: ExperienceLevel | null;
}

export function WalletGuide({ guide, catalog, experienceLevel }: WalletGuideProps) {
  const catalogMap = new Map(
    catalog.map((c) => [c.slug, { network: c.network }])
  );

  const categoryIconMap = new Map(
    CATEGORY_DEFINITIONS.map((d) => [d.category, d.icon])
  );

  return (
    <div className="space-y-6">
      {/* Category grid */}
      <div className="space-y-3">
        {guide.categories.map((cat) => (
          <CategoryRow
            key={cat.category}
            recommendation={cat}
            iconName={categoryIconMap.get(cat.category) ?? "CircleDollarSign"}
            catalogMap={catalogMap}
            experienceLevel={experienceLevel}
          />
        ))}
      </div>
    </div>
  );
}
