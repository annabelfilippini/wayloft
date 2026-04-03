// Curated redemption sweet spots per transferable currency.
// These are real-world high-value award bookings, maintained manually.

export interface SweetSpot {
  destination: string;
  via: string;
  points: string;
  badge: string;
  gradient: string; // Tailwind bg-gradient classes (also used as fallback)
  image?: string; // Unsplash photo URL
  airportCode?: string; // Destination airport/city code for flight search link
}

export interface RecommendedProgram {
  name: string;
  code: string;
  type: "airline" | "hotel";
  descriptor: string;
  badges: string[];
}

export interface CurrencyTravelGuide {
  sweetSpots: SweetSpot[];
  recommended: RecommendedProgram[];
}

// Pinned Unsplash photo IDs → stable, free, high-quality destination images.
// Gradient always renders underneath as a fallback.
const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=400&h=400&fit=crop&auto=format&q=80`;

const PHOTOS = {
  tokyo: unsplash("1540959733332-eab4deabeeaf"),
  paris: unsplash("1502602898657-3e91760cbb34"),
  nyc_la: unsplash("1444723121867-7a241cacace9"),
  beach_resort: unsplash("1520250497591-112f2f40a3f4"),
  caribbean: unsplash("1548574505-5e239809ee19"),
  london: unsplash("1513635269975-59663e0ac1ad"),
  hotel_pool: unsplash("1566073771259-6a8506099945"),
  singapore: unsplash("1525625293386-3f8f99389edd"),
  miami: unsplash("1533106497176-45ae19e68ba2"),
  turkish_coast: unsplash("1589561454226-796a8c7e5023"),
  istanbul: unsplash("1541432901042-2d8bd64b4a9b"),
  canada: unsplash("1503614472-8c93d56e92ce"),
  sydney: unsplash("1523482580672-f109ba8cb9be"),
  europe: unsplash("1467269204594-9661b134dd2b"),
  hawaii: unsplash("1542259009477-d625272157b7"),
  domestic_us: unsplash("1449824913935-59a10b8d2000"),
};

const GUIDES: Record<string, CurrencyTravelGuide> = {
  UR: {
    sweetSpots: [
      {
        destination: "Tokyo",
        via: "via United / ANA",
        points: "60k pts one-way",
        badge: "Instant transfer",
        gradient: "from-rose-500 to-pink-700",
        image: PHOTOS.tokyo,
        airportCode: "NRT",
      },
      {
        destination: "Paris",
        via: "via Air France",
        points: "55k pts",
        badge: "Award deals available",
        gradient: "from-slate-500 to-slate-700",
        image: PHOTOS.paris,
        airportCode: "CDG",
      },
      {
        destination: "NYC → LA",
        via: "via United",
        points: "12k pts",
        badge: "Best domestic deal",
        gradient: "from-amber-500 to-orange-600",
        image: PHOTOS.nyc_la,
        airportCode: "LAX",
      },
      {
        destination: "Hyatt Beach Resort",
        via: "via Hyatt",
        points: "25k pts/night",
        badge: "Great value",
        gradient: "from-cyan-500 to-teal-700",
        image: PHOTOS.beach_resort,
      },
    ],
    recommended: [
      {
        name: "United MileagePlus",
        code: "UA",
        type: "airline",
        descriptor: "Best for domestic flights and Europe",
        badges: ["Instant", "Recommended"],
      },
      {
        name: "World of Hyatt",
        code: "HYATT",
        type: "hotel",
        descriptor: "Best hotel redemption value",
        badges: ["Instant", "Great value"],
      },
      {
        name: "Air France Flying Blue",
        code: "AF",
        type: "airline",
        descriptor: "Good for Europe deals",
        badges: ["Award deals", "Popular"],
      },
    ],
  },
  MR: {
    sweetSpots: [
      {
        destination: "Tokyo",
        via: "via ANA",
        points: "75k pts business",
        badge: "Best business class",
        gradient: "from-rose-500 to-pink-700",
        image: PHOTOS.tokyo,
        airportCode: "NRT",
      },
      {
        destination: "Caribbean",
        via: "via Delta",
        points: "from 15k pts",
        badge: "No blackout dates",
        gradient: "from-emerald-500 to-teal-700",
        image: PHOTOS.caribbean,
        airportCode: "SJU",
      },
      {
        destination: "London",
        via: "via Aeroplan",
        points: "55k pts",
        badge: "Instant transfer",
        gradient: "from-slate-500 to-slate-700",
        image: PHOTOS.london,
        airportCode: "LHR",
      },
      {
        destination: "Hilton Resort",
        via: "via Hilton Honors",
        points: "50k pts/night",
        badge: "Bonus often available",
        gradient: "from-amber-600 to-amber-800",
        image: PHOTOS.hotel_pool,
      },
    ],
    recommended: [
      {
        name: "ANA Mileage Club",
        code: "NH",
        type: "airline",
        descriptor: "Best business class to Asia",
        badges: ["Top value", "Recommended"],
      },
      {
        name: "Air Canada Aeroplan",
        code: "AC",
        type: "airline",
        descriptor: "Flexible routing and partners",
        badges: ["Instant", "Flexible"],
      },
      {
        name: "Delta SkyMiles",
        code: "DL",
        type: "airline",
        descriptor: "No expiration, wide availability",
        badges: ["Instant", "Popular"],
      },
    ],
  },
  TYP: {
    sweetSpots: [
      {
        destination: "Paris",
        via: "via Air France",
        points: "55k pts",
        badge: "Promo awards",
        gradient: "from-slate-500 to-slate-700",
        image: PHOTOS.paris,
        airportCode: "CDG",
      },
      {
        destination: "Singapore",
        via: "via Singapore Air",
        points: "from 40k pts",
        badge: "Great availability",
        gradient: "from-amber-400 to-red-600",
        image: PHOTOS.singapore,
        airportCode: "SIN",
      },
      {
        destination: "NYC → Miami",
        via: "via JetBlue",
        points: "from 5k pts",
        badge: "Best domestic deal",
        gradient: "from-amber-500 to-orange-600",
        image: PHOTOS.miami,
        airportCode: "MIA",
      },
      {
        destination: "Turkish Riviera",
        via: "via Turkish Airlines",
        points: "from 35k pts",
        badge: "Partner awards",
        gradient: "from-cyan-500 to-teal-700",
        image: PHOTOS.turkish_coast,
        airportCode: "AYT",
      },
    ],
    recommended: [
      {
        name: "Air France Flying Blue",
        code: "AF",
        type: "airline",
        descriptor: "Great promo award availability",
        badges: ["Award deals", "Recommended"],
      },
      {
        name: "Singapore KrisFlyer",
        code: "SQ",
        type: "airline",
        descriptor: "Premium cabins to Asia",
        badges: ["Great value", "Popular"],
      },
      {
        name: "JetBlue TrueBlue",
        code: "B6",
        type: "airline",
        descriptor: "Best for domestic flights",
        badges: ["Instant", "Flexible"],
      },
    ],
  },
  C1: {
    sweetSpots: [
      {
        destination: "Istanbul",
        via: "via Turkish Airlines",
        points: "from 45k pts",
        badge: "Partner awards",
        gradient: "from-amber-600 to-red-700",
        image: PHOTOS.istanbul,
        airportCode: "IST",
      },
      {
        destination: "Canada",
        via: "via Aeroplan",
        points: "from 12k pts",
        badge: "Direct transfer",
        gradient: "from-cyan-500 to-teal-700",
        image: PHOTOS.canada,
        airportCode: "YVR",
      },
      {
        destination: "Australia",
        via: "via Qantas",
        points: "from 55k pts",
        badge: "Great value",
        gradient: "from-orange-500 to-red-600",
        image: PHOTOS.sydney,
        airportCode: "SYD",
      },
      {
        destination: "Wyndham Stay",
        via: "via Wyndham",
        points: "15k pts/night",
        badge: "Easy redemption",
        gradient: "from-amber-600 to-amber-800",
        image: PHOTOS.hotel_pool,
      },
    ],
    recommended: [
      {
        name: "Turkish Miles&Smiles",
        code: "TK",
        type: "airline",
        descriptor: "Great partner award rates",
        badges: ["Top value", "Recommended"],
      },
      {
        name: "Air Canada Aeroplan",
        code: "AC",
        type: "airline",
        descriptor: "Flexible routing worldwide",
        badges: ["Instant", "Popular"],
      },
      {
        name: "Wyndham Rewards",
        code: "WYNDHAM",
        type: "hotel",
        descriptor: "Simple flat-rate redemptions",
        badges: ["Easy", "Great value"],
      },
    ],
  },
  BILT: {
    sweetSpots: [
      {
        destination: "Hyatt Stay",
        via: "via Hyatt",
        points: "25k pts/night",
        badge: "Great value",
        gradient: "from-cyan-500 to-teal-700",
        image: PHOTOS.beach_resort,
      },
      {
        destination: "Domestic US",
        via: "via American",
        points: "from 12k pts",
        badge: "Best domestic value",
        gradient: "from-amber-500 to-orange-600",
        image: PHOTOS.domestic_us,
        airportCode: "LAX",
      },
      {
        destination: "Europe",
        via: "via Air France",
        points: "55k pts",
        badge: "Transfer bonus often",
        gradient: "from-slate-500 to-slate-700",
        image: PHOTOS.europe,
        airportCode: "CDG",
      },
      {
        destination: "Hawaii",
        via: "via Hawaiian Airlines",
        points: "from 20k pts",
        badge: "Popular route",
        gradient: "from-rose-500 to-pink-700",
        image: PHOTOS.hawaii,
        airportCode: "HNL",
      },
    ],
    recommended: [
      {
        name: "World of Hyatt",
        code: "HYATT",
        type: "hotel",
        descriptor: "Best hotel redemption value",
        badges: ["Recommended", "Great value"],
      },
      {
        name: "American Airlines",
        code: "AA",
        type: "airline",
        descriptor: "Wide domestic and partner network",
        badges: ["Instant", "Popular"],
      },
      {
        name: "Air France Flying Blue",
        code: "AF",
        type: "airline",
        descriptor: "Good for Europe deals",
        badges: ["Award deals", "Flexible"],
      },
    ],
  },
};

export function getTravelGuide(
  currency: string,
): CurrencyTravelGuide | null {
  return GUIDES[currency] ?? null;
}
