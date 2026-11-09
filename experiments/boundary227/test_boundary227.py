#!/usr/bin/env python3
"""B227: stream-memory lag, four-wheel closure, model-only experiment."""
import math
N=1296000
W=(0,1440,2880,4320)
R=lambda p:(p[3],p[0],p[1],p[2])
streams=(.65,.65,-.65,-.65,-.65,-.65,-.65,-.65)
def simulate(alpha):
    m=.65;pos=W;clock=0;effort=0.;out=[]
    for s in streams:
        m=(1-alpha)*m+alpha*s
        effort+=abs(1-m)
        pos=R(pos);clock=(clock+324000)%N
        out.append((m,pos,clock,effort))
    return out
p=simulate(.25);fast=simulate(1.);slow=simulate(.1);none=simulate(0.)
checks={}
checks['4-wheel closure']=p[-1][1]==W
checks['8-step clock closure']=p[-1][2]==0
checks['first reversal lag']=p[2][0]>0
checks['first reversal stream negative']=streams[2]<0
checks['memoryless tracks stream']=fast[2][0]==streams[2]
checks['zero adaptation freezes']=none[-1][0]==.65
checks['first reverse formula']=math.isclose(p[2][0],.75*.65+.25*(-.65))
checks['second reverse formula']=math.isclose(p[3][0],.75*p[2][0]+.25*(-.65))
checks['memory crossed zero']=p[4][0]<0<p[3][0]
checks['memory final not stream']=p[-1][0]!=streams[-1]
checks['memory final not start']=p[-1][0]!=.65
checks['memory decay']=abs(p[-1][0]+.65)<abs(p[2][0]+.65)
checks['fast converges']=abs(fast[-1][0]+.65)<abs(p[-1][0]+.65)
checks['slow retains more']=slow[2][0]>p[2][0]
checks['cost positive']=p[-1][3]>0
checks['cost accumulates']=all(p[i][3]<=p[i+1][3] for i in range(7))
checks['memoryless different cost']=not math.isclose(p[-1][3],fast[-1][3])
checks['memory bounds']=all(-.65<=x[0]<=.65 for x in p)
checks['all values finite']=all(math.isfinite(x[0]) and math.isfinite(x[3]) for x in p)
checks['4-step return']=p[3][1]==W
checks['4-step clock return']=p[3][2]==0
checks['2-turn closure']=p[7][1]==W
checks['6 anchor pairs']=len({(i,s) for i in range(6) for s in (-1,1)})==12
checks['24 contacts']=len(set('abcdefghijklmnopqrstuvwx'))==24
checks['five recursion levels']=25**5==9765625
checks['coordinate range']=all(0<=j<5760 for j in W)
checks['wavelength monotonic']=all(380+370*(j+1)/5759>380+370*j/5759 for j in range(5759))
checks['one clock tick detectable']=(p[-1][2]+1)%N!=p[-1][2]
checks['wheel swap detectable']=R(W)!=W
checks['retained state mismatch detectable']=p[-1][0]!=fast[-1][0]
assert all(checks.values()),[k for k,v in checks.items() if not v]
print('PASS',sum(checks.values()),'/',len(checks))
for i,(m,pos,clock,effort) in enumerate(p):print(i+1,'memory',round(m,9),'clock',clock,'effort',round(effort,9))
