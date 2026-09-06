export const pageInfo: Record<
  string,
  {
    title: string;
    description: string;
    question: string;
    answer: string;
    source: string;
    dataset?: string;
  }
> = {
  "/": {
    title: "US spending, national debt & federal money",
    description:
      "Explore US government spending, revenue, debt, inflation, federal awards and tax statistics. Interactive public data with sources and open agent access.",
    question: "Where does the US government get and spend its money?",
    answer:
      "Federal receipts include individual and corporate income taxes, social insurance contributions, excise taxes and other sources. Budget outlays cover benefit programs, agency operations, defense and interest. Borrowing finances the gap when outlays exceed receipts.",
    source: "https://fiscaldata.treasury.gov/americas-finance-guide/",
  },
  "/budget": {
    title: "Federal budget: spending, agencies & tax revenue",
    description:
      "Explore federal receipts since 1934, spending functions since 1940 and agency outlays since 1962. Compare years and follow each budget category.",
    question: "Are federal awards the same as total government spending?",
    answer:
      "No. Contracts and assistance records report obligations. The federal budget reports outlays. Interest, benefits and other spending cannot be understood by adding award records to budget outlays; the measures overlap and use different timing.",
    source: "https://www.usaspending.gov/about",
    dataset: "fiscal-structure",
  },
  "/awards": {
    title: "Search federal contracts, grants & assistance",
    description:
      "Search public federal contracts, grants, direct payments, loans and other assistance by recipient, agency, location and time period.",
    question: "Can a connection between federal awards prove fraud?",
    answer:
      "No. Shared recipients, addresses or other links can be research leads. Confirm identifiers, award scope, reporting periods and source documents before drawing conclusions. A connection alone does not establish wrongdoing.",
    source: "https://www.usaspending.gov/about",
  },
  "/funding": {
    title: "Federal funding by agency, recipient, program & country",
    description:
      "Explore federal award obligations by agency, assistance program, recipient, state and overseas place of performance with USAspending sources.",
    question: "Does overseas award spending measure all foreign aid?",
    answer:
      "No. Place of performance identifies where reported award activity occurs. It is not equivalent to foreign aid, recipient nationality, or all money flowing overseas.",
    source: "https://www.usaspending.gov/about",
    dataset: "explore-all-agencies",
  },
  "/debt": {
    title: "US national debt, inflation & dollar purchasing power",
    description:
      "Explore historical national debt, spending, revenue and CPI purchasing power. Compare nominal and inflation-adjusted measures over time.",
    question:
      "Does the debt timeline prove that leaving gold caused later spending?",
    answer:
      "No. A timeline shows changes and timing, not a causal estimate. Spending and debt reflect policy choices, economic conditions, demographics, wars, interest costs and other factors. The end of dollar gold convertibility in 1971 is context, not proof of a single cause.",
    source:
      "https://www.federalreservehistory.org/essays/gold-convertibility-ends",
    dataset: "normalized",
  },
  "/states": {
    title: "Federal spending by state & state-local finance",
    description:
      "Compare federal award obligations across states and explore state and local spending aggregates and public transparency portals.",
    question: "Are these records contracts issued by state governments?",
    answer:
      "The federal award explorer shows federally reported awards by state. State and local own-source contract systems are separate; this platform provides portals and national finance aggregates rather than a complete state-contract ledger.",
    source: "https://www.census.gov/programs-surveys/gov-finances.html",
    dataset: "explore-all-states",
  },
  "/nonprofits": {
    title: "Nonprofit financial records & federal funding research",
    description:
      "Explore public nonprofit filings and follow federal funding leads. Review EINs, financial periods, source records and limits of name matching.",
    question: "Does a nonprofit name match identify a federal recipient?",
    answer:
      "Not reliably. Nonprofit filings use EINs and federal awards use identifiers such as UEIs. A similar name is a lead that needs independent identity verification.",
    source: "https://projects.propublica.org/nonprofits/",
  },
  "/sources": {
    title: "Public data sources, methodology & agent access",
    description:
      "Review sources, data coverage, definitions and limitations behind spending.wtf. Access downloadable data, a public API and MCP tools.",
    question: "Is spending.wtf a government website?",
    answer:
      "No. spending.wtf is an independent public-data project. It links observations to original sources and distinguishes reported data, calculations, live queries and coverage gaps.",
    source: "https://github.com/ethanplusai/spending.wtf",
  },
  "/notebook": {
    title: "Your spending research notebook",
    description: "Your locally saved public award research.",
    question: "Where are saved awards stored?",
    answer:
      "Saved awards are stored in your browser. They are not a public or shared research account.",
    source: "https://github.com/ethanplusai/spending.wtf",
  },
  "/taxes": {
    title: "Who pays federal taxes? Income, geography & companies",
    description:
      "Explore IRS income tax statistics by income group, state and ZIP code, plus selected company tax disclosures.",
    question: "Who pays federal income taxes?",
    answer:
      "IRS Statistics of Income publishes aggregate individual income tax data by income rank and geography. These tables measure particular income taxes on filed returns, not all taxes paid by every person or household.",
    source:
      "https://www.irs.gov/statistics/soi-tax-stats-individual-statistical-tables-by-tax-rate-and-income-percentile",
    dataset: "taxes",
  },
  "/taxes/income": {
    title: "Federal income tax share by income group, 2001–2023",
    description:
      "Compare the top 1%, other income groups, shares of AGI and average individual income tax rates across 23 tax years of IRS statistics.",
    question: "What share of individual income tax did the top 1% pay in 2023?",
    answer:
      "The top 1% of returns by adjusted gross income accounted for approximately 38.4% of IRS total individual income tax in tax year 2023. This excludes dependent returns and is not a share of all federal, state and local taxes.",
    source: "https://www.irs.gov/pub/irs-soi/23in41ts.xlsx",
    dataset: "taxes",
  },
  "/taxes/geography": {
    title: "Federal individual taxes by state, ZIP code & income",
    description:
      "Compare 2023 IRS state income classes and look up 2022 ZIP-code tax statistics. Explore AGI, return counts and income tax after credits.",
    question: "Can you see federal income tax statistics for a ZIP code?",
    answer:
      "Yes. IRS publishes aggregate ZIP-code statistics by income class. This explorer uses tax year 2022 ZIP data and tax year 2023 state data. Small cells are protected, counts are rounded, and filing addresses do not measure who ultimately bears each tax.",
    source:
      "https://www.irs.gov/statistics/soi-tax-stats-individual-income-tax-statistics-2022-zip-code-data-soi",
    dataset: "taxes",
  },
  "/taxes/corporations": {
    title: "Corporate taxes: cash paid versus tax expense",
    description:
      "Compare 13 major companies across 39 fiscal-year observations. Explore federal cash taxes, worldwide cash, accounting expense and employee tax scenarios.",
    question:
      "Can you see exactly which companies paid federal corporate receipts?",
    answer:
      "Not as a complete public ledger. Company tax returns are generally confidential. Some public filings separately disclose federal cash income taxes, while others provide worldwide cash or accounting expense. These measures cannot simply be summed into Treasury receipts.",
    source:
      "https://www.irs.gov/government-entities/federal-state-local-governments/disclosure-laws",
    dataset: "corporate-taxes",
  },
};
