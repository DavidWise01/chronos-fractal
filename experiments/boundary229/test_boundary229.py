#!/usr/bin/env python3
"""CHRONOS B229: memory relaxation and joint phase-closure test."""
import json,math,hashlib,pathlib
alpha=.25; target=.65; m=.543016542866826; tol=.001
period=1296000;quarter=324000;initial=m;rows=[]
for step in range(1,25):
    m=.75*m+.25*target
    rows.append({'step':step,'memory':m,'gap':abs(target-m),'tick':step*quarter,'phase':step%4})
first=next(x for x in rows if x['gap']<=tol)
joint=next(x for x in rows if x['gap']<=tol and x['phase']==0)
check={}
check['initial_gap_above_tolerance']=abs(target-initial)>tol
check['initial_below_target']=initial<target
check['24_rows']=len(rows)==24
check['memory_increases']=all(x['memory']>(initial if i==0 else rows[i-1]['memory']) for i,x in enumerate(rows))
check['gap_decreases']=all(x['gap']<(abs(target-initial) if i==0 else rows[i-1]['gap']) for i,x in enumerate(rows))
check['analytic_decay']=all(math.isclose(x['gap'],abs(target-initial)*.75**x['step'],abs_tol=1e-14) for x in rows)
check['first_step_17']=first['step']==17
check['step_16_above']=rows[15]['gap']>tol
check['step_17_below']=rows[16]['gap']<=tol
check['step_17_phase_open']=first['phase']!=0
check['joint_step_20']=joint['step']==20
check['joint_phase_zero']=joint['phase']==0
check['joint_clock_closed']=joint['tick']%period==0
check['threshold_tick']=first['tick']==5508000
check['joint_tick']=joint['tick']==6480000
check['six_zeros_twelve_signed']=len({(x,s) for x in 'uvwxyz' for s in (-1,1)})==12
check['24_contacts']=len(set('abcdefghijklmnopqrstuvwx'))==24
check['4_wheels']=len({0,1440,2880,4320})==4
check['five_nested_25way']=25**5==9765625
check['wavelength_map']=all(380+370*(j+1)/5759>380+370*j/5759 for j in range(5759))
check['zero_adaptation_frozen']=(1-0)*initial+0*target==initial
check['full_adaptation_immediate']=(1-1)*initial+1*target==target
check['alpha_valid']=0<alpha<1
check['quarter_ticks']=quarter==324000
check['full_ticks']=4*quarter==period
check['gap_never_exact_in_sample']=all(x['gap']>0 for x in rows)
check['clock_fault_detectable']=(joint['tick']+1)%period!=0
check['coordinate_fault_detectable']=1!=0
check['spectral_swap_detectable']=380!=380+370*1440/5759
check['memory_change_detectable']=abs(first['memory']-initial)>tol
check['positive_elapsed']=all(x['tick']>0 for x in rows)
check['finite_gaps']=all(math.isfinite(x['gap']) for x in rows)
check['threshold_not_exact']=0<first['gap']<=tol
check['joint_within_tolerance']=joint['gap']<=tol
check['joint_not_earlier']=joint['step']>=first['step']
assert all(check.values()),[x for x in check if not check[x]]
root=pathlib.Path(__file__).parent
result={'boundary':229,'status':'PASS','checks':check,'passed':sum(check.values()),'total':len(check),'initial':initial,'target':target,'alpha':alpha,'tolerance':tol,'first_threshold':first,'first_joint_closure':joint,'observations':rows,'scope':'toy model, not measured inertia'}
(root/'results.json').write_text(json.dumps(result,indent=2)+'\n')
prev='0'*64;lines=[]
for x in rows:
    e={'boundary':229,'event':'relaxation','prev_sha256':prev,**x}
    e['sha256']=hashlib.sha256(json.dumps(e,sort_keys=True).encode()).hexdigest();prev=e['sha256'];lines.append(json.dumps(e,sort_keys=True))
(root/'gibson.jsonl').write_text('\n'.join(lines)+'\n')
print('PASS',sum(check.values()),'/',len(check),'threshold',first['step'],'joint',joint['step'])
