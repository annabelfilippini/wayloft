import type { SpendingCategory } from "@wayloft/shared";

export interface CategoryDefinition {
  category: SpendingCategory;
  displayName: string;
  catalogKeys: string[];
  icon: string; // lucide icon name
}

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  { category: "dining", displayName: "Dining", catalogKeys: ["dining"], icon: "UtensilsCrossed" },
  { category: "travel", displayName: "Travel", catalogKeys: ["travel", "flights", "hotels", "car_rentals"], icon: "Plane" },
  { category: "groceries", displayName: "Groceries", catalogKeys: ["groceries"], icon: "ShoppingCart" },
  { category: "gas", displayName: "Gas", catalogKeys: ["gas"], icon: "Fuel" },
  { category: "streaming", displayName: "Streaming", catalogKeys: ["streaming"], icon: "Tv" },
  { category: "online_shopping", displayName: "Online Shopping", catalogKeys: ["online_shopping"], icon: "ShoppingBag" },
  { category: "transit", displayName: "Transit & Rideshare", catalogKeys: ["transit"], icon: "TrainFront" },
  { category: "drugstores", displayName: "Drugstores", catalogKeys: ["drugstores"], icon: "Pill" },
  { category: "entertainment", displayName: "Entertainment", catalogKeys: ["entertainment"], icon: "Ticket" },
  { category: "rent", displayName: "Rent", catalogKeys: ["rent"], icon: "Home" },
  { category: "bills", displayName: "Bills & Utilities", catalogKeys: ["internet_cable_phone"], icon: "Zap" },
  { category: "other", displayName: "Everything Else", catalogKeys: ["other"], icon: "CircleDollarSign" },
];

export const CATEGORY_MAP = new Map(
  CATEGORY_DEFINITIONS.map((d) => [d.category, d])
);
