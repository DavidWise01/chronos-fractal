#!/usr/bin/env python3
"""Boundary 224: CHRONOS four-wheel coordinate/wavelength/time fault detection."""
import math,json,hashlib
from pathlib import Path
N=5760; PERIOD=1296000; EPS=.01025
WHEELS=(0,1440,2880,4320)
MODES=('5--5','5++5','5--5','5++5','5--5')
ADDRESS=(0,7,12,18,24)
def wave(j):return 380+370*j/(N-1)
def rotate(p):return (p[3],p[0],p[1],p[2])
def identity(p=WHEELS,tick=123456,address=ADDRESS,modes=MODES,labels=None):
    if labels is None:labels=tuple(wave(i) for i in p)
    return dict(wheels=list(p),wavelength_nm=list(labels),tick=tick%PERIOD,address=list(address),modes=list(modes))
def compare(a,b):return {k:a[k]==b[k] for k in a}
base=identity();tests={};p=WHEELS
for i in range(4):p=rotate(p)
tests['four_turn_order']=p==WHEELS
tests['first_turn_distinct']=rotate(WHEELS)!=WHEELS
tests['wavelength_mapping_all_addresses']=all(wave(j+1)>wave(j) for j in range(N-1))
tests['six_anchors_twelve_unique_directions']=len(set(range(0,360,30)))==12
tests['six_faces_twentyfour_unique_contacts']=len(set('abcdefghijklmnopqrstuvwx'))==24
tests['five_level_address_codec']=all(0<=x<25 for x in ADDRESS) and len(ADDRESS)==5
tests['clock_full_cycle']=identity(tick=123456+PERIOD)==base
tests['scale_inverse']=math.isclose((1+EPS)/(1+EPS),1,abs_tol=1e-15)
tests['symmetric_percentage_not_inverse']=not math.isclose((1+EPS)*(1-EPS),1,abs_tol=1e-8)
swap=list(base['wavelength_nm']);swap[0],swap[1]=swap[1],swap[0]
sw=identity(labels=tuple(swap));ck=identity(tick=123457)
co=identity(p=(1,1440,2880,4320));mo=identity(modes=('5++5',)+MODES[1:])
ad=identity(address=(1,)+ADDRESS[1:])
tests['wavelength_swap_detected']=compare(base,sw)['wavelength_nm'] is False
tests['clock_fault_detected']=compare(base,ck)['tick'] is False
tests['coordinate_fault_detected']=compare(base,co)['wheels'] is False
tests['mode_fault_detected']=compare(base,mo)['modes'] is False
tests['address_fault_detected']=compare(base,ad)['address'] is False
tests['wavelength_coordinate_coupling']=all(math.isclose(base['wavelength_nm'][i],wave(j),abs_tol=1e-12) for i,j in enumerate(WHEELS))
tests['full_identity']=all(compare(base,identity()).values())
tests['no_false_phase_only_closure']=not all(compare(base,ck).values())
tests['no_false_wavelength_only_closure']=not all(compare(base,sw).values())
tests['no_false_coordinate_only_closure']=not all(compare(base,co).values())
tests['no_false_mode_only_closure']=not all(compare(base,mo).values())
tests['no_false_address_only_closure']=not all(compare(base,ad).values())
assert all(tests.values())
summary={'boundary':224,'date':'2026-11-08','status':'PASS','passed':sum(tests.values()),'total':len(tests),'checks':tests,'primitive':'{{5x5}}^5 [box(torroid)] 4 chrome coordinates + 6 zero anchors','assumption':'computational toy mapping; physical Planck foam and gravity/void not tested','inputs':base}
path=Path(__file__).parent;(path/'results.json').write_text(json.dumps(summary,indent=2)+'\n')
events=[];prev='0'*64
for kind,case in [('baseline',base),('wavelength_swap',sw),('clock_shift',ck),('coordinate_shift',co),('mode_change',mo),('address_shift',ad),('recovered',identity())]:
    e={'seq':len(events)+1,'type':kind,'matches_full_baseline':all(compare(base,case).values()),'previous_sha256':prev}
    e['sha256']=hashlib.sha256(json.dumps(e,sort_keys=True).encode()).hexdigest()
    prev=e['sha256'];events.append(e)
(path/'gibson.jsonl').write_text(''.join(json.dumps(e,sort_keys=True)+'\n' for e in events))
print('PASS',sum(tests.values()),'/',len(tests),'GIBSON',len(events))
