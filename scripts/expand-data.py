"""Reproducible broader ledger: original OMB workbooks and USAspending queries.
No synthetic values; atomically preserves each completed snapshot on failure.
"""
import json,datetime,pathlib,urllib.request,concurrent.futures,time
from omb import rows
P=pathlib.Path(__file__).resolve().parents[1]/'public/data'
BASE='https://api.usaspending.gov/api/v2/search/'
GROUPS={'contracts':['A','B','C','D'],'grants':['02','03','04','05'],'direct':['06','10'],'other':['09','11','-1'],'loans':['07','08']}
GROUPS['all']=sum([GROUPS[k] for k in ['contracts','grants','direct','other']],[])
def request(url,body=None):
 for attempt in range(3):
  try:
   req=urllib.request.Request(url,data=json.dumps(body).encode() if body else None,headers={'Content-Type':'application/json','User-Agent':'SpendingWTF/3.0 public-data-research'})
   with urllib.request.urlopen(req,timeout=60) as r:return json.load(r)
  except Exception:
   if attempt==2:raise
   time.sleep(1+attempt)
def save(name,payload):
 p=P/(name+'.json');tmp=p.with_suffix('.tmp');tmp.write_text(json.dumps(payload));tmp.replace(p)
def stamp(source,data,**extra):return {'source':source,'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'data':data,**extra}
def omb():
 tables={}
 for name,slug in [('revenue','hist02z1'),('functions','hist03z1'),('agencies','hist04z1')]:
  url=f'https://www.whitehouse.gov/wp-content/uploads/2026/04/{slug}_fy2027.xlsx'
  with urllib.request.urlopen(url,timeout=60) as r:content=r.read()
  if not content.startswith(b'PK'):raise ValueError('Invalid workbook')
  p=P/f'omb-{name}.xlsx';tmp=p.with_suffix('.tmp');tmp.write_bytes(content);tmp.replace(p);rs=rows(p)
  if name=='revenue':
   mapping={'B':'Individual income taxes','C':'Corporate income taxes','D':'Social insurance & retirement','G':'Excise taxes','H':'Other receipts'}
   data=[{'year':int(r['A']),'total':r['I']*1e6,'items':[{'name':n,'amount':r[c]*1e6} for c,n in mapping.items()]} for r in rs if str(r.get('A','')).isdigit() and 1934<=int(r['A'])<=2025]
  else:
   header=rs[1 if name=='functions' else 2]
   selected=[3,5,6,7,8,9,12,14,15,16,19,20,21,25,26,27,28,29,30,31] if name=='functions' else list(range(3,36))
   totalrow=rs[34 if name=='functions' else 38]
   def val(v):
    # OMB dots represent no amount, not missing source fetches.
    if isinstance(v,(int,float)):return v*1e6
    if v=='..........':return 0
    raise ValueError(f'Unexpected OMB value: {v}')
   data=[{'year':int(y),'total':val(totalrow[c]),'items':[{'name':rs[i]['A'],'amount':val(rs[i][c])} for i in selected]} for c,y in header.items() if str(y).isdigit() and int(y)<=2025]
  tables[name]=stamp(url,data,unit='USD',frequency='fiscal-year',publication='OMB FY 2027 actuals only',limitations=['Millions converted to USD. TQ and estimates excluded. Category rounding can differ from the reported total. Negative outlays and offsetting receipts are retained.'])
 save('fiscal-structure',tables);print('OMB',[(k,len(v['data'])) for k,v in tables.items()],flush=True)
def snapshot(kind,dimension):
 filters={'time_period':[{'start_date':'2024-10-01','end_date':'2025-09-30'}],'award_type_codes':GROUPS[kind]}
 if dimension=='awards':
  loan=kind=='loans'; fields=['Award ID','Recipient Name','Awarding Agency','Description','Place of Performance State Code','Place of Performance Country Code','Recipient UEI']+(['Loan Value','Subsidy Cost','Issued Date','Assistance Listings'] if loan else ['Award Amount','Start Date','End Date'])+(['Assistance Listings'] if kind in ['grants','direct','other'] else [])
  body={'filters':filters,'fields':fields,'page':1,'limit':100,'sort':'Loan Value' if loan else 'Award Amount','order':'desc','subawards':False};endpoint='spending_by_award/'
 elif dimension in ['states','countries']:
  if dimension=='countries':filters['place_of_performance_scope']='foreign'
  body={'filters':filters,'scope':'place_of_performance','geo_layer':'state' if dimension=='states' else 'country','spending_level':'transactions'};endpoint='spending_by_geography/'
 elif dimension=='timeline':
  filters['time_period']=[{'start_date':'2016-10-01','end_date':'2025-09-30'}]
  body={'filters':filters,'group':'fiscal_year','spending_level':'transactions'};endpoint='spending_over_time/'
 elif dimension=='counts':
  body={'filters':filters};endpoint='spending_by_award_count/'
 else:
  category={'agencies':'awarding_agency','programs':'cfda','recipients':'recipient'}[dimension]
  body={'filters':filters,'category':category,'page':1,'limit':100,'spending_level':'transactions'};endpoint=f'spending_by_category/{category}/'
 url=BASE+endpoint;j=request(url,body)
 if 'results' not in j:raise ValueError(str(j))
 data=j['results']
 if dimension=='awards':
  unique={}
  for r in data:
   r['awardKind']=kind
   if kind=='loans':r['Award Amount']=r['Loan Value'];r['Start Date']=r.get('Issued Date','');r['End Date']=''
   unique.setdefault(r['generated_internal_id'],r)
  data=list(unique.values())
 payload=stamp(url,data,query=body,hasNext=bool(j.get('page_metadata',{}).get('hasNext')),measure='Lifetime loan face value' if dimension=='awards' and kind=='loans' else 'Lifetime award amount' if dimension=='awards' else 'Award counts' if dimension=='counts' else 'Period transaction obligations',unit='count' if dimension=='counts' else 'USD')
 save(f'explore-{kind}-{dimension}',payload);print(kind,dimension,len(data),flush=True)
if __name__=='__main__':
 jobs=[('omb',None)]+[(k,d) for k in ['all','contracts','grants','direct','other','loans'] for d in (['agencies','programs','recipients','countries','states','timeline','counts'] if k=='all' else ['awards','timeline','states'] if k in ['contracts','grants','direct'] else ['awards','timeline'])]
 failures=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
  fs={pool.submit(omb if k=='omb' else snapshot,*(() if k=='omb' else (k,d))):(k,d) for k,d in jobs}
  for f in concurrent.futures.as_completed(fs):
   try:f.result()
   except Exception as e:failures.append(fs[f]);print('FAILED',fs[f],str(e),flush=True)
 if failures:raise SystemExit(1)
