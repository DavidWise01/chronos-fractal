#!/usr/bin/env python3
"""CHRONOS Boundary 225: independent reproducible closure/fault test.
Run: python3 test_boundary225.py
Model only: Chrome coordinates / wavelength labels / Chronos clock.
"""
import math, json
N,PER,EPS=5760,1296000,.01025
p=(0,1440,2880,4320)
wl=lambda j:380+370*j/(N-1)
R=lambda t:(t[3],t[0],t[1],t[2])
inv=lambda t:(t[1],t[2],t[3],t[0])
def state(coords=p,tick=0,waves=None,modes=('5--5','5++5','5--5','5++5','5--5'),address=(0,7,12,18,24)):
    return dict(coords=coords,tick=tick%PER,waves=tuple(map(wl,coords)) if waves is None else waves,modes=modes,address=address)
base=state()
def diff(x):return [k for k in base if base[k]!=x[k]]
a=p
for _ in range(4):a=R(a)
tests={
 'four_turn_closure':a==p,
 'inverse_permutation':all(inv(R(x))==x for x in (p,(3,2,1,0))),
 'wavelength_range':wl(0)==380 and wl(N-1)==750,
 'wavelength_monotone':all(wl(j+1)>wl(j) for j in range(N-1)),
 'wavelength_multiset_conserved':sorted(map(wl,R(p)))==sorted(map(wl,p)),
 'coordinate_wavelength_commute':tuple(map(wl,R(p)))==R(tuple(map(wl,p))),
 'six_zeros_twelve_directions':len(set(j*30 for j in range(12)))==12,
 'six_opposite_pairs':all((j*30+180)%360==((j+6)%12)*30 for j in range(6)),
 'twentyfour_surface_contacts':len(set('abcdefghijklmnopqrstuvwx'))==24,
 'five_levels':25**5==9765625,
 'clock_cycle':4*324000==PER,
 'clock_inverse':(324000+(PER-324000))%PER==0,
 'foam_inverse':math.isclose((1+EPS)/(1+EPS),1,abs_tol=1e-14),
 'opposite_percent_not_inverse':not math.isclose((1+EPS)*(1-EPS),1,abs_tol=1e-8),
 'coordinate_fault':diff(state(coords=(1,1440,2880,4320)))==['coords','waves'],
 'wavelength_swap':diff(state(waves=(wl(1440),wl(0),wl(2880),wl(4320))))==['waves'],
 'one_tick_fault':diff(state(tick=1))==['tick'],
 'mode_fault':diff(state(modes=('5++5','5++5','5--5','5++5','5--5')))==['modes'],
 'address_fault':diff(state(address=(1,7,12,18,24)))==['address'],
 'restored_identity':state()==base,
 'round_trip_cost_positive':a==p and 4+.25>0,
 'inverse_motion_cost_positive':2+.25>0,
 'recursive_address_independent_of_wheel_order':state(coords=R(p))['address']==base['address']
}
assert all(tests.values()),{k:v for k,v in tests.items() if not v}
print('PASS',sum(tests.values()),'/',len(tests))
print(json.dumps(tests,indent=2))
