#!/usr/bin/env python3
"""CHRONOS B223: ±1.025% geometric loop perturbation, SU(2) toy model."""
import math
import numpy as np
EPS=.01025
I=np.eye(2,dtype=complex)
X=np.array([[0,1],[1,0]],complex)
Z=np.diag([1,-1]).astype(complex)
def U(s,t): return math.cos(t/2)*I-1j*math.sin(t/2)*s
def H(L):
    x=U(X,math.pi*L/3); z=U(Z,math.pi*L/3)
    return (x@z).conj().T@(z@x)
def K(L): return math.sqrt(max(0,2-np.trace(H(L)).real))/L**2
checks={}
for k in range(5):
    L=2.**(-k)
    cases=(L,L*(1+EPS),L*(1-EPS))
    checks[f'level_{k}_unitary']=all(np.linalg.norm(H(l).conj().T@H(l)-I)<1e-12 for l in cases)
    checks[f'level_{k}_formula']=all(abs(K(l)-2*math.sin(math.pi*l/6)**2/l**2)<5e-9 for l in cases)
    checks[f'level_{k}_inverse']=abs(K(L*(1+EPS)/(1+EPS))-K(L))<1e-12
    checks[f'level_{k}_trace_order']=np.trace(H(L*(1-EPS))).real > np.trace(H(L)).real > np.trace(H(L*(1+EPS))).real
    print(k, f"{K(L):.9f}",f"{K(L*(1+EPS)):.9f}",f"{K(L*(1-EPS)):.9f}")
fault=H(1).copy();fault[0,0]*=1+EPS
checks['fault_detected']=np.linalg.norm(fault.conj().T@fault-I)>1e-3
checks['all_finite']=all(np.isfinite(K(L*a)) for L in [2.**(-k) for k in range(5)] for a in (1,1+EPS,1-EPS))
checks['limit']=abs(2*math.sin(math.pi/6144)**2/(1/1024)**2-math.pi**2/18)<1e-6
print(f"PASS {sum(checks.values())}/{len(checks)}")
assert all(checks.values())
