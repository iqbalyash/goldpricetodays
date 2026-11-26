export interface SeedCity {
  slug: string;
  name: string;
  localPremiumPercent: number;
  marketTimings: string;
  localDescription: string;
}

export interface SeedCountry {
  slug: string;
  name: string;
  currencyCode: string;
  currencySymbol: string;
  /** Bullion-quote tax. Editable starting value, not a live statutory feed. */
  defaultTaxPercent: number;
  /** Bullion-quote duty. Editable starting value, not a live statutory feed. */
  defaultDutyPercent: number;
  /** Jewellery GST/VAT default for the bill calculator. Not a second copy of the bullion tax. */
  jewelleryTaxPercent: number;
  usesTola: boolean;
  cities: SeedCity[];
}

export const seedMarkets: SeedCountry[] = [
  {
    slug: "pakistan",
    name: "Pakistan",
    currencyCode: "PKR",
    currencySymbol: "Rs",
    defaultTaxPercent: 0,
    defaultDutyPercent: 0,
    jewelleryTaxPercent: 0,
    usesTola: true,
    cities: [
      {
        slug: "karachi",
        name: "Karachi",
        localPremiumPercent: 0.35,
        marketTimings: "Sat–Thu, 11:00 AM – 8:00 PM PKT",
        localDescription:
          "Karachi Sarafa Bazaar is the main wholesale bullion screen for Pakistan. Dealers quote 24K and 22K by tola and gram, and the city premium sits on the country average.",
      },
      {
        slug: "lahore",
        name: "Lahore",
        localPremiumPercent: 0.4,
        marketTimings: "Sat–Thu, 11:00 AM – 7:30 PM PKT",
        localDescription:
          "Lahore Rang Mahal & Mall Road Bullion Market is the Punjab wholesale counter. Quotes follow the Pakistan benchmark with a small Lahore premium over the country average.",
      },
      {
        slug: "rawalpindi",
        name: "Rawalpindi",
        localPremiumPercent: 0.55,
        marketTimings: "Sat–Thu, 10:00 AM – 6:30 PM PKT",
        localDescription:
          "Rawalpindi Sarafa Bazaar, Raja Bazaar, is the twin-cities retail screen. Quotes follow the Pakistan benchmark with a wider local premium than Karachi.",
      },
      {
        slug: "islamabad",
        name: "Islamabad",
        localPremiumPercent: 0.5,
        marketTimings: "Sat–Thu, 11:00 AM – 8:00 PM PKT",
        localDescription:
          "Islamabad Jinnah Super & F-10 Gold Markets serve the capital's retail buyers. The premium is narrower than Rawalpindi and still above the country average.",
      },
      {
        slug: "peshawar",
        name: "Peshawar",
        localPremiumPercent: 0.6,
        marketTimings: "Sat–Thu, 10:00 AM – 7:00 PM PKT",
        localDescription:
          "Peshawar Namak Mandi & Saddar Sarafa is the Khyber Pakhtunkhwa bullion cluster. Local demand keeps the premium above the other Punjab counters.",
      },
      {
        slug: "faisalabad",
        name: "Faisalabad",
        localPremiumPercent: 0.45,
        marketTimings: "Sat–Thu, 10:30 AM – 7:30 PM PKT",
        localDescription:
          "Faisalabad Rail Bazaar Sarafa is the textile city's gold counter. Rates track the Pakistan average with a modest local premium.",
      },
      {
        slug: "multan",
        name: "Multan",
        localPremiumPercent: 0.48,
        marketTimings: "Sat–Thu, 10:00 AM – 7:00 PM PKT",
        localDescription:
          "Multan Hussain Agahi Sarafa is the south Punjab retail market. Buyers see a small premium over the country 24K and 22K screens.",
      },
      {
        slug: "sialkot",
        name: "Sialkot",
        localPremiumPercent: 0.42,
        marketTimings: "Sat–Thu, 10:00 AM – 7:00 PM PKT",
        localDescription:
          "Sialkot Sarafa Bazaar on Trunk Bazaar quotes export-city jewellery and bullion. The local premium stays close to the Lahore screen.",
      },
    ],
  },
  {
    slug: "india",
    name: "India",
    currencyCode: "INR",
    currencySymbol: "₹",
    defaultTaxPercent: 3,
    defaultDutyPercent: 6,
    jewelleryTaxPercent: 3,
    usesTola: false,
    cities: [
      {
        slug: "mumbai",
        name: "Mumbai",
        localPremiumPercent: 0.75,
        marketTimings: "Mon–Sat, 10:00 AM – 7:00 PM IST",
        localDescription:
          "Zaveri Bazaar Bullion Market is India's reference retail screen. GST and import duty are applied before the Mumbai premium.",
      },
      {
        slug: "new-delhi",
        name: "New Delhi",
        localPremiumPercent: 0.65,
        marketTimings: "Mon–Sat, 10:30 AM – 7:30 PM IST",
        localDescription:
          "Chandni Chowk & Karol Bagh is the Delhi bullion and jewellery corridor. The city premium is below Mumbai and above the country average.",
      },
      {
        slug: "chennai",
        name: "Chennai",
        localPremiumPercent: 0.55,
        marketTimings: "Mon–Sat, 10:00 AM – 8:00 PM IST",
        localDescription:
          "Chennai Sowcarpet Gold Market on NSC Bose Road is the Tamil Nadu wholesale counter. Quotes add a smaller premium than Mumbai.",
      },
      {
        slug: "bengaluru",
        name: "Bengaluru",
        localPremiumPercent: 0.5,
        marketTimings: "Mon–Sat, 10:00 AM – 7:30 PM IST",
        localDescription:
          "Bengaluru Avenue Road Bullion Market is the city's main gold street. Retail quotes sit close to the India average after tax and duty.",
      },
      {
        slug: "hyderabad",
        name: "Hyderabad",
        localPremiumPercent: 0.52,
        marketTimings: "Mon–Sat, 10:30 AM – 8:00 PM IST",
        localDescription:
          "Hyderabad Patthargatti & Abids Sarafa serves the Deccan retail trade. The local premium is a narrow spread over the country screen.",
      },
      {
        slug: "kolkata",
        name: "Kolkata",
        localPremiumPercent: 0.58,
        marketTimings: "Mon–Sat, 11:00 AM – 7:30 PM IST",
        localDescription:
          "Kolkata B.B. Ganguly Street & Bowbazar is the eastern bullion market. Dealers quote a modest premium over the India average.",
      },
      {
        slug: "ahmedabad",
        name: "Ahmedabad",
        localPremiumPercent: 0.48,
        marketTimings: "Mon–Sat, 10:00 AM – 7:00 PM IST",
        localDescription:
          "Ahmedabad Manek Chowk Bullion Market is the Gujarat wholesale screen. The city premium is the tightest of the listed India markets.",
      },
    ],
  },
  {
    slug: "uae",
    name: "United Arab Emirates",
    currencyCode: "AED",
    currencySymbol: "AED",
    defaultTaxPercent: 5,
    defaultDutyPercent: 0,
    jewelleryTaxPercent: 5,
    usesTola: false,
    cities: [
      {
        slug: "dubai",
        name: "Dubai",
        localPremiumPercent: 0.4,
        marketTimings: "Sat–Thu, 10:00 AM – 10:00 PM GST",
        localDescription:
          "Dubai Gold Souk, Deira, is the Gulf's main retail bullion screen. Investment bars start from the spot, then VAT and a small Dubai premium.",
      },
      {
        slug: "abu-dhabi",
        name: "Abu Dhabi",
        localPremiumPercent: 0.35,
        marketTimings: "Sat–Thu, 10:00 AM – 10:00 PM GST",
        localDescription:
          "Madinat Zayed Gold Centre is Abu Dhabi's covered bullion market. The local premium is slightly tighter than the Deira souk.",
      },
      {
        slug: "sharjah",
        name: "Sharjah",
        localPremiumPercent: 0.3,
        marketTimings: "Sat–Thu, 10:00 AM – 10:30 PM GST",
        localDescription:
          "Sharjah Gold Souk on Al Arouba Street is the emirate's retail counter. Buyers usually see the lowest listed UAE premium.",
      },
    ],
  },
  {
    slug: "saudi-arabia",
    name: "Saudi Arabia",
    currencyCode: "SAR",
    currencySymbol: "SAR",
    defaultTaxPercent: 15,
    defaultDutyPercent: 0,
    jewelleryTaxPercent: 15,
    usesTola: false,
    cities: [
      {
        slug: "riyadh",
        name: "Riyadh",
        localPremiumPercent: 0.45,
        marketTimings: "Sat–Thu, 10:00 AM – 10:00 PM AST",
        localDescription:
          "Al Batha Gold Market is Riyadh's main bullion souq. Quotes follow the international spot, then VAT and a small capital-city premium.",
      },
      {
        slug: "jeddah",
        name: "Jeddah",
        localPremiumPercent: 0.4,
        marketTimings: "Sat–Thu, 10:00 AM – 11:00 PM AST",
        localDescription:
          "Al Balad Gold Souk is Jeddah's historic gold quarter. The local premium is a touch below the Riyadh screen.",
      },
      {
        slug: "dammam",
        name: "Dammam",
        localPremiumPercent: 0.38,
        marketTimings: "Sat–Thu, 10:00 AM – 10:00 PM AST",
        localDescription:
          "Dammam King Saud Street Gold Market serves the Eastern Province. Retail quotes carry the smallest listed Saudi premium.",
      },
    ],
  },
  {
    slug: "usa",
    name: "United States",
    currencyCode: "USD",
    currencySymbol: "$",
    defaultTaxPercent: 0,
    defaultDutyPercent: 0,
    jewelleryTaxPercent: 0,
    usesTola: false,
    cities: [
      {
        slug: "new-york",
        name: "New York",
        localPremiumPercent: 1.25,
        marketTimings: "Mon–Fri, 9:30 AM – 5:00 PM ET",
        localDescription:
          "Diamond District / COMEX Benchmark is the New York dealer screen. The city premium is a typical retail spread over the international spot. State sales tax is not included.",
      },
      {
        slug: "los-angeles",
        name: "Los Angeles",
        localPremiumPercent: 1.15,
        marketTimings: "Mon–Fri, 10:00 AM – 5:30 PM PT",
        localDescription:
          "Los Angeles Jewelry District on Hill Street is the West Coast dealer cluster. The retail premium sits just under the New York screen.",
      },
      {
        slug: "chicago",
        name: "Chicago",
        localPremiumPercent: 1.05,
        marketTimings: "Mon–Fri, 10:00 AM – 5:00 PM CT",
        localDescription:
          "Chicago Jewelers Row on Wabash Avenue quotes Midwest retail bullion. The local premium is narrower than the coastal dealer markets.",
      },
      {
        slug: "houston",
        name: "Houston",
        localPremiumPercent: 1,
        marketTimings: "Mon–Fri, 10:00 AM – 5:30 PM CT",
        localDescription:
          "Houston Gold & Jewelry District is the Gulf Coast retail screen. Dealers add the tightest listed US premium over the spot.",
      },
    ],
  },
  {
    slug: "uk",
    name: "United Kingdom",
    currencyCode: "GBP",
    currencySymbol: "£",
    defaultTaxPercent: 0,
    defaultDutyPercent: 0,
    jewelleryTaxPercent: 20,
    usesTola: false,
    cities: [
      {
        slug: "london",
        name: "London",
        localPremiumPercent: 1.1,
        marketTimings: "Mon–Fri, 9:00 AM – 5:30 PM GMT",
        localDescription:
          "London Bullion Market / Hatton Garden is the UK dealer screen. Investment gold is quoted over the spot without VAT. The jewellery calculator uses a separate VAT default.",
      },
      {
        slug: "birmingham",
        name: "Birmingham",
        localPremiumPercent: 0.95,
        marketTimings: "Mon–Fri, 9:30 AM – 5:00 PM GMT",
        localDescription:
          "Birmingham Jewellery Quarter is the UK's manufacturing bullion district. The retail premium is below the London dealer screen.",
      },
      {
        slug: "manchester",
        name: "Manchester",
        localPremiumPercent: 0.9,
        marketTimings: "Mon–Sat, 10:00 AM – 5:00 PM GMT",
        localDescription:
          "Manchester Shudehill & King Street jewellers are the north-west retail counters. The local premium is the tightest of the listed UK cities.",
      },
    ],
  },
];
