"""Build the reviewed corporate disclosure snapshot. USD conversion is explicit.
These are selected major issuers, not a complete top-taxpayer universe.
Add observations only after reviewing the cited cash-tax table and fiscal period.
"""
import json
from pathlib import Path
out=Path(__file__).resolve().parents[1]/'public/data/corporate-taxes.json'
old=json.loads(out.read_text());companies=[c for c in old['companies'] if c['ticker'] in ['MSFT','VZ']]
sec='https://www.sec.gov/Archives/edgar/data/'
def add(name,ticker,cik,source,period,observations,notes='',workforce=None):
 years=[{'year':y,'periodEnd':end,'worldwideCash':cash*1000000,'federalCash':None if fed is None else fed*1000000,'federalCurrentExpense':None if expense is None else expense*1000000} for y,end,cash,fed,expense in observations]
 companies.append(dict(name=name,ticker=ticker,cik=str(cik).zfill(10),source=source,sourceNote='Annual report: consolidated cash flows and income tax note',periodEnd=period,years=years,notes=notes,workforce=workforce))
def work(global_count,us,date,source,note,derived=False):return {'global':global_count,'us':us,'date':date,'source':source,'note':note,'usDerived':derived}
s=sec+'1018724/000101872426000004/amzn-20251231.htm'
add('Amazon','AMZN',1018724,s,'December 31',[(2023,'2023-12-31',11179,7435,8652),(2024,'2024-12-31',12308,7630,9039),(2025,'2025-12-31',8295,2751,1220)],workforce=work(1576000,None,'2025-12-31',s,'Worldwide full-time and part-time employees; excludes supplemental contractors and temporary personnel. US count not captured.'))
s=sec+'1652044/000165204426000018/goog-20251231.htm'
add('Alphabet','GOOGL',1652044,s,'December 31',[(2023,'2023-12-31',19164,13689,None),(2024,'2024-12-31',27353,19921,None),(2025,'2025-12-31',21526,13658,None)],'Current tax expense combines federal and state; it is not treated as federal-only expense.',work(190820,None,'2025-12-31',s,'Worldwide employees; US count not captured.'))
s=sec+'320193/000032019325000079/aapl-20250927.htm'
add('Apple','AAPL',320193,s,'September fiscal year end',[(2023,'2023-09-30',18679,None,9445),(2024,'2024-09-28',26102,None,5571),(2025,'2025-09-27',43369,None,11487)],'Worldwide payments include multiple jurisdictions and timing effects; US federal cash is not separately captured in this report.',work(166000,None,'2025-09-27',s,'Worldwide full-time equivalent employees; not headcount or US employment.'))
s=sec+'1326801/000162828026003942/meta-20251231.htm'
add('Meta','META',1326801,s,'December 31',[(2023,'2023-12-31',6607,None,None),(2024,'2024-12-31',10554,None,None),(2025,'2025-12-31',7578,4118,None)],workforce=work(78865,None,'2025-12-31',s,'Worldwide employees; US count not captured.'))
s='https://berkshirehathaway.com/2025ar/2025ar.pdf'
add('Berkshire Hathaway','BRK.B',1067983,s,'December 31',[(2023,'2023-12-31',7765,5639,None),(2024,'2024-12-31',28544,26482,None),(2025,'2025-12-31',13978,11753,None)],'Consolidated group, including operating subsidiaries. Do not add subsidiary disclosures to this total. Tax note 20, printed K-99 / PDF page 125.',work(387800,310240,'2025-12-31',s,'Approximate US count derived from 387,800 worldwide × reported approximate 80% US share.',True))
s='https://stock.walmart.com/sec-filings/all-sec-filings/content/0000104169-25-000021/wmt-20250131.htm/wmtexhibit991fy2510-k.htm'
add('Walmart','WMT',104169,s,'January 31',[(2023,'2023-01-31',3310,None,None),(2024,'2024-01-31',5879,None,None),(2025,'2025-01-31',5884,None,None)],'FY2025 ended January 31, 2025. Cash-flow table labels income taxes paid; refund netting is not explicit in that table.',work(2100000,1600000,'2025-01-31',s,'Approximate reported headcounts. US workforce includes part-time staff; 68% full-time.'))
s=sec+'1318605/000162828026003952/tsla-20251231.htm'
add('Tesla','TSLA',1318605,s,'December 31',[(2023,'2023-12-31',1120,None,48),(2024,'2024-12-31',1330,None,0),(2025,'2025-12-31',1232,28,0)],'2023 and 2024 worldwide cash values are rounded to the precision in the tax note. A zero current provision is not zero cash taxes.',work(134785,None,'2025-12-31',s,'Worldwide headcount; US count not captured.'))
s=sec+'1045810/000104581026000021/nvda-20260125.htm'
add('NVIDIA','NVDA',1045810,s,'January fiscal year end',[(2024,'2024-01-28',6549,None,None),(2025,'2025-01-26',15118,None,None),(2026,'2026-01-25',20288,16755,None)],'Fiscal 2026 ended January 25, 2026. Federal cash is captured only for FY2026; do not label it calendar 2025.',work(42000,None,'2026-01-25',s,'Worldwide employees as of FY2026 end; US count not captured.'))
s=sec+'909832/000090983225000101/cost-20250831.htm'
add('Costco','COST',909832,s,'August/September fiscal year end',[(2023,'2023-09-03',2234,None,None),(2024,'2024-09-01',2319,None,None),(2025,'2025-08-31',2917,None,None)],workforce=work(341000,223000,'2025-08-31',s,'Reported employees by segment. Includes full-time and part-time workers. US hourly employees averaged about $32/hour at year end; this is not average annual pay for all employees.'))
companies[-1]['workforce']['hourlyPayContext']=32
s='https://corporate.target.com/investors/annual/2025-annual-report/10-k-report/10-k-part-ii/item-8-financial-statements-and-supplementary-data'
add('Target','TGT',27419,s,'January/February fiscal year end',[(2023,'2024-02-03',374,None,556),(2024,'2025-02-01',1055,None,1013),(2025,'2026-01-31',1091,781,819)],'FY2025 federal payments include purchases of transferable tax credits; not all were paid directly to Treasury.',work(415000,None,'2026-01-31','https://corporate.target.com/investors/annual/2025-annual-report/10-k-report/10-k-part-i/item-1-business','Full-time, part-time and seasonal team members worldwide; US count not captured.'))
s='https://www.jpmorganchase.com/content/dam/jpmc/jpmorgan-chase-and-co/investor-relations/documents/annualreport-2025.pdf'
add('JPMorgan Chase','JPM',19617,s,'December 31',[(2023,'2023-12-31',9908,2797,None),(2024,'2024-12-31',11715,3465,None),(2025,'2025-12-31',5309,-1099,None)],'Negative federal cash is a net refund, not a missing value. Consolidated income tax note 25, printed page 289 / PDF page 321.',work(318512,None,'2025-12-31',s,'Worldwide employees, annual report financial highlights; US count not captured.'))
for c in companies:
 c.setdefault('notes','');
 if c['ticker']=='MSFT':c['workforce']=work(228000,125000,'2025-06-30',c['source'],'Full-time employees; US count reported separately.')
 if c['ticker']=='VZ':c['workforce']=work(89900,80011,'2025-12-31',c['source'],'Approximate US FTE derived from 89,900 global FTE × reported 89% US share.',True)
 for y in c['years']:y.setdefault('periodEnd',str(y['year'])+('-06-30' if c['ticker']=='MSFT' else '-12-31'))
 c['reviewedAt']='2026-09-06';c['sourceNote']=c['sourceNote'].split(' · reviewed')[0]+' · reviewed 2026-09-06'
 c['accession']=c['source'].split('/')[-2] if '/Archives/edgar/data/' in c['source'] else None
j={'schemaVersion':'2.0','retrievedAt':'2026-09-06','coverage':'13 selected major public companies across technology, retail, finance, conglomerates and telecom. Rankings apply only to captured observations, not all US corporations. Fiscal years differ; see exact period ends. Cash, accounting expense and modeled employee income taxes are separate measures. Missing values are null; net refunds remain negative.','selection':'Purposeful research set of major issuers with reviewed primary reports, not a statistical sample or a complete market-cap/revenue index.','companies':companies}
out.write_text(json.dumps(j,indent=2)+'\n');print(len(companies),'companies',sum(len(c['years']) for c in companies),'company-years')
