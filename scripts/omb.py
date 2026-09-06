"""Read cached Excel values with Python's standard library; retain original workbook."""
import zipfile,xml.etree.ElementTree as ET
N={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
def rows(path):
 with zipfile.ZipFile(path) as z:
  strings=[]
  if 'xl/sharedStrings.xml' in z.namelist():strings=[''.join(si.itertext()) for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',N)]
  tree=ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
  out=[]
  for row in tree.findall('.//m:row',N):
   cells={}
   for c in row.findall('m:c',N):
    v=c.find('m:v',N);text=v.text if v is not None else None
    if text is not None:
     if c.get('t')=='s':text=strings[int(text)]
     else:
      try:text=float(text)
      except ValueError:pass
    elif c.get('t')=='inlineStr':text=''.join(c.find('m:is',N).itertext())
    if text is not None:cells[''.join(x for x in c.get('r') if x.isalpha())]=text
   out.append(cells)
  return out
if __name__=='__main__':
 import sys
 for row in rows(sys.argv[1])[:30]:print(row)
