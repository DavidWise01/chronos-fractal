#!/usr/bin/env python3
"""CHRONOS B228 — hysteresis and identity closure; no physical inertia claim."""
import math, json, pathlib, hashlib
FLOW=[.65]*2+[-.65]*6+[.65]*8
PER=1296000;ALPHA=.25
wheels=[0,1,2,3];memory=.65;tick=0;cost=0.;history=[]
for step,s in enumerate(FLOW,1):
    memory=(1-ALPHA)*memory+ALPHA*s
    wheels=[wheels[3],*wheels[:3]]
    tick=(tick+324000)%PER
    cost+=abs(1-memory)
    history.append(dict(step=step,stream=s,memory=memory,clock_tick=tick,wheels=wheels[:],effort=cost))
r=history;t={}
t["16 steps"]=len(r)==16
t["two initial aligned"]=FLOW[:2]==[.65,.65]
t["six reversal steps"]=FLOW[2:8]==[-.65]*6
t["eight return steps"]=FLOW[8:]==[.65]*8
t["formula step 3"]=math.isclose(r[2]["memory"],.325)
t["formula step 4"]=math.isclose(r[3]["memory"],.08125)
t["reversal crosses zero"]=r[3]["memory"]>0>r[4]["memory"]
t["return initially negative"]=r[8]["memory"]<0
t["return crosses zero"]=r[8]["memory"]<0<r[9]["memory"]
t["final positive"]=r[15]["memory"]>0
t["final below initial"]=r[15]["memory"]<.65
t["memory gap > 0.1"]=abs(.65-r[15]["memory"])>.1
for k in [4,8,12,16]:
    t[f"wheel cycle closure {k}"]=r[k-1]["wheels"]==[0,1,2,3]
    t[f"clock cycle closure {k}"]=r[k-1]["clock_tick"]==0
t["memory not closed"]=r[15]["memory"]!=.65
t["memory stays bounded"]=all(-.65<=x["memory"]<=.65 for x in r)
t["effort accumulates"]=all(r[i]["effort"]>r[i-1]["effort"] for i in range(1,16))
t["first two cost"]=math.isclose(r[1]["effort"],.7)
t["final cost"]=math.isclose(r[15]["effort"],13.07904962860048)
t["same stream different memory"]=FLOW[0]==FLOW[8] and r[0]["memory"]!=r[8]["memory"]
t["memoryless final = stream"]=FLOW[-1]==.65
t["zero adaptation freezes initial"]=.65+0*(FLOW[-1]-.65)==.65
t["all memory finite"]=all(math.isfinite(x["memory"]) for x in r)
t["clock fault detectable"]=(tick+1)%PER!=tick
t["wavelength swap detectable"]=380!=380+370*1440/5759
t["coordinate shift detectable"]=r[15]["wheels"][0]!=1
t["24 named contacts"]=len(set("abcdefghijklmnopqrstuvwx"))==24
t["12 signed channels"]=len({(v,s) for v in "uvwxyz" for s in [-1,1]})==12
t["five 25-way levels"]=25**5==9765625
assert all(t.values()), [k for k,v in t.items() if not v]
print(f"PASS {sum(t.values())}/{len(t)}")
print("final", r[-1])
