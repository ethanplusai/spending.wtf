"""Normalize official IRS releases. Usage: python3 scripts/refresh-tax-data.py [--source-dir DIR].
Without --source-dir, download the pinned releases. Missing values remain null.
"""
import argparse,csv,json,hashlib,tempfile,urllib.request
from pathlib import Path
from datetime import datetime,timezone
from omb import rows
p=argparse.ArgumentParser();p.add_argument('--source-dir');args=p.parse_args()
cache=Path(args.source_dir or tempfile.mkdtemp(prefix='spending-tax-'));cache.mkdir(exist_ok=True)
out=Path(__file__).resolve().parents[1]/'public/data';(out/'tax-zip').mkdir(exist_ok=True)
sources={'shares.xlsx':'https://www.irs.gov/pub/irs-soi/23in41ts.xlsx','states.csv':'https://www.irs.gov/pub/irs-soi/23in55cmcsv.csv','zip.csv':'https://www.irs.gov/pub/irs-soi/22zpallagi.csv'}
for name,url in sources.items():
 if not (cache/name).exists():
  with urllib.request.urlopen(url,timeout=180) as r:(cache/name).write_bytes(r.read())
def write(name,value):
 dest=out/name;tmp=dest.with_suffix('.tmp');tmp.write_text(json.dumps(value,separators=(',',':'),allow_nan=False));tmp.replace(dest)
def number(v,mult=1):
 try:return float(v.replace(',',''))*mult
 except (ValueError,AttributeError):return None
r=rows(cache/'shares.xlsx');years=[]
for i in range(23):
 year=int(r[7+i]['A']);groups={}
 for col,label in [('B','all'),('F','top1'),('J','top5'),('K','top10'),('P','top50')]:
  groups[label]={'returns':r[7+i][col],'agi':r[79+i][col]*1e6,'tax':r[103+i][col]*1e6,'floor':r[31+i].get(col) if col!='B' else None}
 bands=[]
 for label,upper,lower in [('Bottom 50%','all','top50'),('50th–90th percentile','top50','top10'),('90th–99th percentile','top10','top1'),('Top 1%','top1',None)]:
  band={'label':label,**{k:groups[upper][k]-(groups[lower][k] if lower else 0) for k in ['returns','agi','tax']}}
  band['taxShare']=band['tax']/groups['all']['tax']*100;band['incomeShare']=band['agi']/groups['all']['agi']*100;band['averageRate']=band['tax']/band['agi']*100 if band['agi']>0 else None
  bands.append(band)
 years.append({'year':year,'groups':groups,'bands':bands})
state_bands=['All returns','Under $1','$1–9,999','$10,000–24,999','$25,000–49,999','$50,000–74,999','$75,000–99,999','$100,000–199,999','$200,000–499,999','$500,000–999,999','$1 million+']
fields={'returns':('N1',1),'agi':('A00100',1000),'incomeTax':('A06500',1000),'totalLiability':('A10300',1000)}
def values(row):return {k:number(row.get(field),mult) for k,(field,mult) in fields.items()}
states=[{'state':row['STATE'],'band':int(row['AGI_STUB']),**values(row)} for row in csv.DictReader((cache/'states.csv').open(encoding='utf-8-sig'))]
zips={};zip_count=0
for row in csv.DictReader((cache/'zip.csv').open()):
 zip_code=row['zipcode'].zfill(5)
 if zip_code in ['00000','99999']:continue
 state=row['STATE'];zips.setdefault(state,{}).setdefault(zip_code,[]).append({'band':int(row['agi_stub']),**values(row)})
for state,entries in zips.items():write('tax-zip/'+state+'.json',entries);zip_count+=len(entries)
write('tax-zip-index.json',{zip_code:state for state,entries in zips.items() for zip_code in entries})
manifest={name:{'url':url,'sha256':hashlib.sha256((cache/name).read_bytes()).hexdigest()} for name,url in sources.items()}
write('taxes.json',{'retrievedAt':datetime.now(timezone.utc).isoformat(),'sources':manifest,'income':years,'states':states,'stateBands':state_bands,'zipBands':['','$1–24,999','$25,000–49,999','$50,000–74,999','$75,000–99,999','$100,000–199,999','$200,000+'],'zipYear':2022,'stateYear':2023,'zipCount':zip_count,'zipStates':sorted(zips),'incomeDefinition':r[200]['A'],'limitations':{'income':'IRS sample estimates; excludes dependent returns. Total income tax includes net investment income tax, excludes refundable portions of credits, payroll, state and local taxes. AGI is not wealth.','geography':'Federal individual return statistics by filing address, not state taxes or economic incidence. Amounts converted from thousands to dollars. Income tax after credits (A06500) differs from the percentile table definition.','zip':'2022 positive-AGI returns; counts rounded, small cells combined or suppressed. 00000 and 99999 are not real ZIP codes and are excluded. Published income bands may not sum to unrestricted totals. A displayed zero may reflect disclosure protection, not absence of activity.','race':'IRS returns do not collect race or ethnicity. Treasury research estimates demographic effects using statistical methods; no observed tax ledger by race is provided.'}})
print(f'Normalized {len(years)} years, {len(states)} state/income rows and {zip_count} ZIP codes.')
