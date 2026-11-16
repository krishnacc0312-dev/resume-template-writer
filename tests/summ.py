import sys,json
t=sys.stdin.read(); t=t[t.index('{'):]; j=t[:t.index('OTHER')]; d=json.loads(j)
print('NAME',d['name'],'| TITLE',d['title']); print('CONTACT',d['contact']); print('SUMMARY',[s[:50]+'…'+s[-15:] for s in d['summary']])
for s in d['skills']: print('  SK',repr(s['cat']),'=>',s['items'][:45]+'…'+s['items'][-15:])
for c in d['clients']: print('  CL',repr(c['client']),'|',repr(c['location']),'|',repr(c['role']),'|',repr(c['dates']),'| desc',[x[:40] for x in c['description']],'resp',len(c['responsibilities']),[r[-20:] for r in c['responsibilities']],'| env',c['environment'][:30]+'…'+c['environment'][-15:])
print('EDU',d['education']); print(t[t.index('OTHER'):])
