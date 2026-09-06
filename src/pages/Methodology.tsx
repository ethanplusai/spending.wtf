import { ArrowUpRight, Landmark, Network, Scale, FileText } from "lucide-react";
import { sources } from "../data";

function Methodology() {
  return (
    <section className="section subpage methodology">
      <div className="page-intro">
        <span className="eyebrow">PUBLIC DATA. OPEN METHODOLOGY.</span>
        <h1>Trust is in the details.</h1>
        <p>
          Every number has a definition. Every dataset has limits.
          <br />
          Here is how to read this ledger—and how to check our work.
        </p>
      </div>
      <div className="method-grid">
        {[
          {
            icon: Landmark,
            title: "Outlays are money paid.",
            text: "The overview uses Treasury Monthly Treasury Statement data. Outlays measure payments, and receipts measure incoming revenue. The deficit is outlays minus receipts. These cash-flow measures differ from obligations and budget authority.",
          },
          {
            icon: FileText,
            title: "An award is not a payment.",
            text: "USAspending non-loan award search returns lifetime award amounts for awards with activity during your date range. State geography uses net obligations in the selected fiscal year. Do not add these measures together or interpret an award total as a unit price.",
          },
          {
            icon: Scale,
            title: "Debt is a stock. Deficit is a flow.",
            text: "National debt is measured at a date; the deficit covers a period. Gross federal debt includes debt held by the public and intragovernmental holdings. Debt changes can differ from the deficit because of cash balances and other financing adjustments.",
          },
          {
            icon: Network,
            title: "A connection is not a verdict.",
            text: "Connections group only loaded awards, by reported recipient UEI or exact name. They do not establish common ownership, political ties, wrongdoing, or fraud. Evidence requires corroboration with contract documents and other records.",
          },
        ].map((m) => (
          <article key={m.title}>
            <m.icon size={22} />
            <h3>{m.title}</h3>
            <p>{m.text}</p>
          </article>
        ))}
      </div>
      <h2>The source register.</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Source</th>
              <th>Used for</th>
              <th>Coverage / treatment</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <a
                  href="https://www.whitehouse.gov/omb/information-resources/budget/historical-tables/"
                  target="_blank"
                  rel="noreferrer"
                >
                  OMB Historical Tables <ArrowUpRight size={12} />
                </a>
              </td>
              <td>
                Budget totals, revenue sources, functions, agencies, state/local
                own-source expenditures
              </td>
              <td>
                FY 2027 tables 1.1, 2.1, 3.1, 4.1, and 14.2. Actual years only,
                through 2025. Annual spending from 1901; nationwide state/local
                own-source expenditure from 1948. Excludes grouped early periods
                and the separate 1976 transition quarter.
              </td>
            </tr>
            <tr>
              <td>
                <a href={sources.treasury} target="_blank" rel="noreferrer">
                  U.S. Treasury <ArrowUpRight size={12} />
                </a>
              </td>
              <td>Debt, receipts, outlays, departments</td>
              <td>
                Historical debt from 1790. Monthly budget snapshots from 2015
                include prior-year comparisons. Overview stops at completed FY
                2025. Department breakdown fixed to FY 2025.
              </td>
            </tr>
            <tr>
              <td>
                <a href={sources.usa} target="_blank" rel="noreferrer">
                  USAspending.gov <ArrowUpRight size={12} />
                </a>
              </td>
              <td>
                Contracts, grants, direct payments, loans, programs, recipients,
                subawards, geography
              </td>
              <td>
                Live paginated award queries and source-wide obligation
                aggregates. Forty starter examples span four non-loan types; 499
                source awards are preserved across five types. Combined award
                searches query each type separately. FY 2025 geography includes
                grants, direct payments and contracts. Subawards are nested, not
                additive.
              </td>
            </tr>
            <tr>
              <td>
                <a href={sources.bls} target="_blank" rel="noreferrer">
                  Bureau of Labor Statistics <ArrowUpRight size={12} />
                </a>
              </td>
              <td>CPI, purchasing-power adjustment</td>
              <td>
                CUUR0000SA0, all urban consumers, all items, not seasonally
                adjusted. Annual averages require 12 reported months. No
                interpolation across missing years.
              </td>
            </tr>
            <tr>
              <td>
                <a
                  href="https://data.worldbank.org/country/united-states"
                  target="_blank"
                  rel="noreferrer"
                >
                  World Bank WDI <ArrowUpRight size={12} />
                </a>
              </td>
              <td>GDP and population context</td>
              <td>
                NY.GDP.MKTP.CD and SP.POP.TOTL. Calendar-year observations
                matched to fiscal-year debt; contextual ratios rather than
                official fiscal-year ratios. CC BY 4.0.
              </td>
            </tr>
            <tr>
              <td>
                <a
                  href="https://www.census.gov/programs-surveys/gov-finances.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  Census / state & local portals <ArrowUpRight size={12} />
                </a>
              </td>
              <td>Source discovery</td>
              <td>
                Directory only. State and municipal transactions are not yet
                ingested. OMB Table 14.2 supplies the separately labeled
                nationwide own-source expenditure aggregate.
              </td>
            </tr>
            <tr>
              <td>
                <a href="https://projects.propublica.org/nonprofits/api">
                  IRS via ProPublica <ArrowUpRight size={12} />
                </a>
              </td>
              <td>Nonprofit organizations and Form 990 finances</td>
              <td>
                Live name/state searches, EIN profiles, extracted financial
                history, and original filing links. Name matches are not
                verified EIN-to-UEI joins; total revenue is not federal grant
                revenue.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="method-details">
        <details open>
          <summary>Freshness, revisions, and unavailable data</summary>
          <p>
            Bundled source snapshots were retrieved September 5, 2026. Debt
            attempts a live refresh when the overview opens; live contract
            searches are explicit. Live provider responses are cached for five
            minutes with their retrieval timestamps. Snapshot and source
            observation dates are different: an older observation does not
            become current when downloaded again. Historical figures can be
            revised. Where Treasury reports more than one historical observation
            for a year (1843), the annual chart uses the later date. Monthly
            budget charts use the same publication vintage as their annual
            total. The money map uses OMB FY 2027 revisions; those can differ
            from the Treasury MTS vintage on the overview.
          </p>
          <p>
            Failed live searches display an error and retain the previously
            labeled result set. Missing values are not silently converted to
            zero or replaced with invented estimates. Downloads include source
            and measure context.
          </p>
        </details>
        <details>
          <summary>Inflation and historical comparisons</summary>
          <p>
            Inflation-adjusted dollars equal nominal dollars multiplied by
            target-year CPI divided by observation-year CPI. The calculator uses
            the same ratio. These annual CPI values approximate a national
            consumer basket, not every household’s expenses. Calendar-year CPI
            is used alongside fiscal-year budget data and is labeled
            accordingly.
          </p>
          <p>
            The 1971 marker identifies the suspension of international gold
            convertibility. Domestic redemption had ended earlier. A chart does
            not estimate the causal effect of this change; nominal growth also
            reflects inflation, population, and economic growth.
          </p>
        </details>
        <details>
          <summary>Privacy and saved research</summary>
          <p>
            Your notebook is stored in this browser’s local storage. No account,
            advertising analytics, or third-party tracking is included. Search
            terms are sent to this app’s server and USAspending to retrieve
            records. Export saved records before clearing browser storage or
            moving devices.
          </p>
        </details>
        <details>
          <summary>Investigative limits and next data integrations</summary>
          <p>
            This release does not score or label recipients for fraud. A useful
            next stage needs procurement competition fields, amendment
            histories, verified vendor hierarchies, subawards, audit reports,
            and reproducible anomaly definitions. The current connection view
            exposes reported agency–recipient–award relationships only.
          </p>
          <p>
            State and local integration requires source-specific ingestion,
            fiscal-calendar normalization, entity resolution, provenance, and
            federal-transfer reconciliation. Directory sources are candidates
            for that work, not claims of completed ingestion.
          </p>
        </details>
        <details>
          <summary>Design and independence</summary>
          <p>
            This independent project draws design inspiration from the National
            Design Studio’s clear typography, civic orientation, and focus on
            usable public services. It is not affiliated with or endorsed by the
            Studio, the U.S. government, or any data provider.
          </p>
          <a href="https://ndstudio.gov/" target="_blank" rel="noreferrer">
            Visit the design reference <ArrowUpRight size={12} />
          </a>
        </details>
      </div>
    </section>
  );
}

export default Methodology;
