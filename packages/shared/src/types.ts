export interface GoldRateCountry {
  slug: string;
  name: string;
  currencyCode: string;
  currencySymbol: string;
  usesTola: boolean;
  defaultTaxPercent: number;
  defaultDutyPercent: number;
}

export interface GoldRateCity {
  slug: string;
  name: string;
  localPremiumPercent: number;
  marketTimings: string;
  localDescription: string;
}

export interface GoldRatePrices {
  gram: {
    k24: number;
    k22: number;
    k21: number;
    k18: number;
  };
  tola: {
    k24: number;
    k22: number;
  };
  ounce: {
    k24: number;
  };
}

/** One stored quote. `city` is null for the country-wide average. */
export interface GoldRate {
  country: GoldRateCountry;
  city: GoldRateCity | null;
  prices: GoldRatePrices;
  change24hPercent: number;
  updatedAt: string;
}

export interface GoldRatesResponse {
  rates: GoldRate[];
}
