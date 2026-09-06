"""Build display data from preserved source records without filling missing observations."""
import json,pathlib
from omb import rows as workbook_rows
P=pathlib.Path(__file__).resolve().parents[1]/'public/data'
def load(n):return json.load(open(P/(n+'.json')))['data']
r=load('budget')
headers={x['classification_id']:int(x['classification_desc'][3:]) for x in r if x['classification_desc'].startswith('FY ') and x['classification_desc'][3:].isdigit()}
annual={};monthly={};months=['October','November','December','January','February','March','April','May','June','July','August','September']
def record(x):
 y=headers.get(x['parent_id']);s=x['current_month_gross_outly_amt'];v=x['current_month_gross_rcpt_amt']
 if not y or s=='null' or v=='null':return None
 return {'year':y,'spending':float(s),'revenue':float(v),'date':x['record_date']}
for x in sorted(r,key=lambda x:x['record_date']):
 item=record(x)
 if item and x['classification_desc']=='Year-to-Date' and x['record_date'].endswith('09-30'):annual[item['year']]=item
for x in sorted(r,key=lambda x:x['record_date']):
 item=record(x)
 if not item:continue
 y=item['year']
 # Reconcile monthly observations to the publication vintage of the annual total.
 if y in annual and x['record_date']>annual[y]['date']:continue
 if x['record_type_cd']=='MTH' and x['classification_desc'] in months:
  m=months.index(x['classification_desc']);item['month']=m;item['label']=x['classification_desc'];monthly[(y,m)]=item
cpi={};cpi_monthly=[]
for x in load('cpi'):
 if x['period']!='M13' and x['value']!='-':
  cpi.setdefault(int(x['year']),[]).append(float(x['value']))
  cpi_monthly.append({'year':int(x['year']),'month':int(x['period'][1:]),'value':float(x['value']),'date':x['year']+'-'+x['period'][1:]})
cpi=[{'year':y,'value':sum(v)/len(v),'months':len(v)} for y,v in sorted(cpi.items()) if len(v)==12]
departments=[{'name':x['classification_desc'].replace('Total--','').replace('--Military Programs',''),'amount':float(x['current_fytd_net_outly_amt'])} for x in load('departments') if x['sequence_level_nbr']=='2' and (x['classification_desc'].startswith('Total--Department of') or x['classification_desc']=='Total--Social Security Administration') and x['current_fytd_net_outly_amt']!='null']
debt={}
for x in sorted(load('debt-history'),key=lambda x:x['record_date']):debt[int(x['record_fiscal_year'])]={'year':int(x['record_fiscal_year']),'date':x['record_date'],'debt':float(x['debt_outstanding_amt'])}
result={'annual':sorted(annual.values(),key=lambda x:x['year']),'monthly':sorted(monthly.values(),key=lambda x:(x['year'],x['month'])),'cpi':cpi,'cpiMonthly':sorted(cpi_monthly,key=lambda x:x['date']),'departments':sorted(departments,key=lambda x:-x['amount']),'debtHistory':list(debt.values())}
result['historicalBudget']=[{'year':int(x['A']),'revenue':x['B']*1e6,'spending':x['C']*1e6} for x in workbook_rows(P/'omb-historical-budget.xlsx') if str(x.get('A','')).isdigit() and 1901<=int(x['A'])<=2025]
result['governmentExpenditures']=[{'year':int(x['A']),'total':x['B']*1e9,'federal':x['C']*1e9,'grants':x['F']*1e9,'stateLocalOwnSource':x['G']*1e9} for x in workbook_rows(P/'omb-government-expenditures.xlsx') if str(x.get('A','')).isdigit() and 1948<=int(x['A'])<=2025]
(P/'normalized.json').write_text(json.dumps(result));print('Normalized:',len(annual),'annual budgets;',len(monthly),'months;',len(cpi),'complete CPI years')
