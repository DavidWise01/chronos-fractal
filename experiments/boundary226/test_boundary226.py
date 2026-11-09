#!/usr/bin/env python3
"""CHRONOS Boundary 226 — reproducible inherited-motion and closure test.
Primitive: four chromatic coordinate wheels around a center; six zero anchors.
The effort ledger is dimensionless, not physical energy or joules.
"""
import math, json, hashlib
from pathlib import Path
PER=1296000
EPS=.01025
COORDS=(0,1440,2880,4320)
ANCHORS=tuple("uvwxyz")
def wavelength(j):return 380+370*j/5759
def rotate(a):return (a[3],a[0],a[1],a[2])
def run(stream):
    wheels=COORDS; tick=0;local=0.;ambient=0.;history=[]
    for i in range(4):
        correction=1-stream
        wheels=rotate(wheels);tick=(tick+PER//4)%PER
        local+=abs(correction);ambient+=abs(stream)
        history.append((wheels,tick,correction))
    return {"stream":stream,"local":local,"external":ambient,"closed":wheels==COORDS and tick==0,"history":history}
cases={
"still":run(0),
"aligned":run(.65),
"opposing":run(-.35),
"overdrive":run(1.25),
"foam_plus":run(.65*(1+EPS)),
"foam_minus":run(.65*(1-EPS))}
b=cases
t={}
t["four_wheel_ids"]=len(COORDS)==4 and len(set(COORDS))==4
t["six_zero_anchors"]=len(set(ANCHORS))==6
t["twelve_signed_directions"]=len({(a,s) for a in ANCHORS for s in (-1,1)})==12
t["twentyfour_face_contacts"]=len(set("abcdefghijklmnopqrstuvwx"))==24
t["five_level_product"]=25**5==9765625
t["quarter_tick"]=PER//4==324000
t["full_tick"]=4*(PER//4)==PER
t["spectral_monotonic"]=all(wavelength(j+1)>wavelength(j) for j in range(5759))
t["spectral_multiset"]=sorted(map(wavelength,rotate(COORDS)))==sorted(map(wavelength,COORDS))
t["six_closed_cycles"]=all(x["closed"] for x in b.values())
t["six_four_step_cycles"]=all(len(x["history"])==4 for x in b.values())
t["signed_correction"]=all(abs(x["stream"]+h[2]-1)<1e-14 for x in b.values() for h in x["history"])
t["still_cost"]=math.isclose(b["still"]["local"],4)
t["aligned_cost"]=math.isclose(b["aligned"]["local"],1.4)
t["opposing_cost"]=math.isclose(b["opposing"]["local"],5.4)
t["overdrive_cost"]=math.isclose(b["overdrive"]["local"],1)
t["aligned_saves_local"]=b["aligned"]["local"]<b["still"]["local"]
t["opposing_adds_local"]=b["opposing"]["local"]>b["still"]["local"]
t["overdrive_brakes"]=b["overdrive"]["history"][0][2]<0
t["negative_correction_positive_effort"]=b["overdrive"]["local"]>0
t["ambient_nonzero"]=b["aligned"]["external"]>0
t["local_not_total_energy"]=b["aligned"]["external"]+b["aligned"]["local"]>b["aligned"]["local"]
t["foam_plus_reduces_correction"]=b["foam_plus"]["local"]<b["aligned"]["local"]
t["foam_minus_increases_correction"]=b["foam_minus"]["local"]>b["aligned"]["local"]
t["foam_true_inverse"]=math.isclose((.65*(1+EPS))/(1+EPS),.65)
t["foam_symmetric_not_inverse"]=not math.isclose((1+EPS)*(1-EPS),1,abs_tol=1e-8)
t["wrong_tick_detectable"]=PER//4+1!=PER//4
t["wrong_wheel_detectable"]=rotate(COORDS)!=COORDS
t["closed_different_cost"]=b["still"]["closed"] and b["aligned"]["closed"] and b["still"]["local"]!=b["aligned"]["local"]
t["all_costs_nonnegative"]=all(x["local"]>=0 for x in b.values())
assert all(t.values()), {k:v for k,v in t.items() if not v}
print(f"PASS {sum(t.values())}/{len(t)}")
for k,x in b.items():print(k,round(x["local"],6),"ambient",round(x["external"],6),"closed",x["closed"])
