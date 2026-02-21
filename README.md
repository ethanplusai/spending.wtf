# Federal Procurement Price Analysis

A React web app that visualizes how much the U.S. federal government pays for everyday items compared to estimated market prices, using public procurement data from the USAspending.gov API.

## Overview

This tool provides a neutral, data-first view of federal procurement spending by:
- Fetching contract award data from [USAspending.gov](https://www.usaspending.gov)
- Calculating unit prices from total obligations and quantities
- Comparing those prices against commercial market benchmarks
- Visualizing the differences in a clear, journalistic format

## Features

- **Category Selection**: Switch between Office Furniture and IT Hardware categories
- **Price Comparison Visualization**: SVG-based bar charts showing government vs market prices
- **Filtering & Sorting**: Filter by item type, show only overpaying items, sort by various criteria
- **Expandable Details**: View full source data and links to USAspending.gov
- **Neutral Tone**: No accusations or loaded language - just the data

## Tech Stack

- **React** (via Vite) - UI framework
- **TypeScript** - Type safety
- **SVG** - Lightweight visualizations (no heavy chart libraries)
- **CSS Custom Properties** - Themeable, clean design

## Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx       # App header with explanation
│   ├── Footer.tsx       # Citations and methodology
│   ├── CategorySelector.tsx
│   ├── ComparisonList.tsx
│   ├── ComparisonCard.tsx
│   └── PriceComparisonBar.tsx
├── data/
│   ├── benchmarks.ts    # Market price benchmarks
│   └── pscCodes.ts      # PSC code mappings
├── services/
│   ├── usaspending.ts   # API client
│   └── dataProcessor.ts # Data normalization
├── types/
│   └── index.ts         # TypeScript definitions
├── utils/
│   └── format.ts        # Formatting utilities
├── App.tsx              # Main application
├── App.css              # Component styles
└── index.css            # Global styles
```

## Data Source

All award data comes from the [USAspending.gov API](https://api.usaspending.gov/), which provides public access to federal spending data as mandated by the DATA Act.

### PSC Codes Used

**Office Furniture (71xx series)**
- 7110: Office Furniture
- 7125: Cabinets, Lockers, Bins
- 7105, 7120, 7130, 7195: Related furniture codes

**IT Hardware (70xx series)**
- 7010-7050: Computer equipment codes

## Market Benchmarks

Market price ranges are hardcoded estimates based on general market research. They represent typical commercial prices and do NOT account for:
- Government-specific compliance requirements
- Extended warranties or support contracts
- Volume discounts or lack thereof
- Specialized specifications

See `src/data/benchmarks.ts` for all benchmark values and sources.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Methodology

1. **Data Fetching**: Query USAspending.gov for contract awards in selected PSC categories
2. **Quantity Extraction**: Parse quantities from descriptions (QTY:, EACH, etc.) or default to 1
3. **Unit Price Calculation**: `total_obligation / quantity`
4. **Categorization**: Match descriptions to item categories using keyword matching
5. **Comparison**: Compare unit prices against hardcoded market benchmarks

## Disclaimer

This is an independent research tool and is not affiliated with or endorsed by any government agency. Price comparisons are approximations and should not be interpreted as definitive evidence of waste or wrongdoing. Many legitimate factors can explain price variations in government procurement.

## Future Extensions

This MVP is designed to be extended with:
- Additional product categories
- Time-based filtering (sliders)
- Agency-specific comparisons
- Static data export
- Trend analysis over time

## License

MIT
