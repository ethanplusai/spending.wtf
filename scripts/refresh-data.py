"""Refresh official public data. Atomic writes; failures preserve previous snapshots."""
import json, urllib.request, datetime, pathlib, concurrent.futures
ROOT=pathlib.Path(__file__).resolve().parents[1]/'public/data'
BASE='https://api.fiscaldata.treasury.gov/services/api/fiscal_service/'
def get(url, body=None):
    req=urllib.request.Request(url,data=json.dumps(body).encode() if body else None,headers={'User-Agent':'SpendingWTF/2.0 public-data-research','Content-Type':'application/json'})
    with urllib.request.urlopen(req, timeout=60) as r: return json.load(r)
def save(name,data,source):
    payload={'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source':source,'data':data}
    p=ROOT/(name+'.json'); tmp=p.with_suffix('.tmp');tmp.write_text(json.dumps(payload));tmp.replace(p)
    print(name, len(data) if isinstance(data,list) else 'ok',flush=True)
def treasury(name,path):
    url=BASE+path; j=get(url)
    if not j.get('data'): raise ValueError(name+' empty')
    rows=j['data']
    if name!='debt':
        pages=int(j.get('meta',{}).get('total-pages',1))
        if pages>100: raise ValueError('Unexpected page count for '+name)
        for page in range(2,pages+1): rows.extend(get(url+'&page[number]='+str(page))['data'])
    save(name,rows,url)
def workbook(name,slug):
    url=f'https://www.whitehouse.gov/wp-content/uploads/2026/04/{slug}_fy2027.xlsx'
    with urllib.request.urlopen(url,timeout=60) as r: content=r.read()
    if not content.startswith(b'PK'): raise ValueError(name+' invalid workbook')
    p=ROOT/(name+'.xlsx');tmp=p.with_suffix('.tmp');tmp.write_bytes(content);tmp.replace(p)
    save(name+'-metadata',{'publication':'FY 2027 historical tables, April 2026','workbook':name+'.xlsx'},url)
def cpi():
    rows=[]
    for year in range(1960,2027,10):
        url=f'https://api.bls.gov/publicAPI/v2/timeseries/data/CUUR0000SA0?startyear={year}&endyear={min(year+9,2026)}'
        j=get(url)
        if j['status']!='REQUEST_SUCCEEDED': raise ValueError(str(j))
        rows.extend(j['Results']['series'][0]['data'])
    save('cpi',rows,'https://www.bls.gov/cpi/ • CUUR0000SA0, monthly, not seasonally adjusted')
def awards():
    url='https://api.usaspending.gov/api/v2/search/spending_by_award/'
    body={'filters':{'time_period':[{'start_date':'2024-10-01','end_date':'2025-09-30'}],'award_type_codes':['A','B','C','D']},'fields':['Award ID','Recipient Name','Award Amount','Awarding Agency','Description','Start Date','End Date','Place of Performance State Code','Recipient UEI'],'page':1,'limit':50,'sort':'Award Amount','order':'desc','subawards':False}
    j=get(url,body)
    if 'results' not in j: raise ValueError(j)
    save('awards-raw',j['results'],url)
    unique={}
    for row in j['results']: unique.setdefault(row['generated_internal_id'],row)
    save('awards',list(unique.values()),url)
def worldbank(name,indicator):
    url=f'https://api.worldbank.org/v2/country/USA/indicator/{indicator}?format=json&per_page=100'
    j=get(url)
    if not isinstance(j,list) or len(j)!=2 or not j[1]:raise ValueError(name+' invalid')
    j[0]['retrievedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();j[0]['source']=url
    p=ROOT/(name+'.json');tmp=p.with_suffix('.tmp');tmp.write_text(json.dumps(j));tmp.replace(p);print(name,len(j[1]),flush=True)
def geography():
    url='https://api.usaspending.gov/api/v2/search/spending_by_geography/'
    j=get(url,{'scope':'place_of_performance','geo_layer':'state','filters':{'time_period':[{'start_date':'2024-10-01','end_date':'2025-09-30'}],'award_type_codes':['A','B','C','D']}})
    save('states',j['results'],url)
jobs=[lambda:treasury('debt','v2/accounting/od/debt_to_penny?sort=-record_date&page[size]=1'),lambda:treasury('debt-history','v2/accounting/od/debt_outstanding?sort=record_date&page[size]=300'),lambda:treasury('budget','v1/accounting/mts/mts_table_1?filter=record_date:gte:2015-01-01&page[size]=10000&sort=record_date'),lambda:treasury('departments','v1/accounting/mts/mts_table_5?filter=record_date:eq:2025-09-30&page[size]=1000'),cpi,awards,geography,lambda:worldbank('gdp','NY.GDP.MKTP.CD'),lambda:worldbank('population','SP.POP.TOTL'),lambda:workbook('omb-historical-budget','hist01z1'),lambda:workbook('omb-government-expenditures','hist14z2')]
if __name__=='__main__':
    ROOT.mkdir(parents=True,exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        results=[pool.submit(j) for j in jobs]
        failures=[]
        for future in results:
            try: future.result()
            except Exception as e: failures.append(str(e));print('FAILED:',e,flush=True)
        if failures: raise SystemExit(1)
