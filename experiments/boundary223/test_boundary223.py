#!/usr/bin/env python3
"""CHRONOS B223: 1.025% loop-scale perturbation; SU(2) toy model."""
import math
import numpy as np
E=.01025
I=np.eye(2,dtype=complex)
X=np.array([[0,1],[1,0]],complex)
Z=np.diag([1,-1]).astype(complex)
def U(s,t): return math.cos(t/2)*I-1j*math.sin(t/2)*s
def H(L):
    x=U(X,math.pi*L/3); z=U(Z,math.pi*L/3)
    return (x@z).conj().T@(z@x)
def K(L):
    h=H(L)
    return math.sqrt(max(0,2-float(np.trace(h).real)))/L**2
checks=[]
for k in range(5):
    L=2**(-k)
    for a in (1,1+E,1-E):
        l=L*a
        checks.append(np.linalg.norm(H(l).conj().T@H(l)-I)<1e-12)
        checks.append(abs(K(l)-2*math.sin(math.pi*l/6)**2/l**2)<5e-9)
    checks.append(abs(K(L*(1+E)/(1+E))-K(L))<1e-12)
    checks.append(np.trace(H(L*(1-E))).real > np.trace(H(L)).real > np.trace(H(L*(1+E))).real)
    print(k, f"{K(L):.9f}",f"{K(L*(1+E)):.9f}",f"{K(L*(1-E)):.9f}")
fault=H(1).copy();fault[0,0]*=1+E
checks.append(np.linalg.norm(fault.conj().T@fault-I)>1e-3)
assert all(checks)
print(f"PASS {sum(checks)}/{len(checks)}")
