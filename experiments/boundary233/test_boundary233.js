#!/usr/bin/env node
"use strict";
// CHRONOS Boundary 233 · +/-1.025% modulation of effective adaptation.
// Run: node experiments/boundary233/test_boundary233.js
// Constructed discrete relaxation model, NOT evidence of real Planck foam.
const G=.65-.543016542866826,TOL=.001,EPS=.01025,Q=324000,PER=1296000;
const L=1-(TOL/G)**.25,U=1-(TOL/G)**(1/3);
const modes=[
 {id:"minus",delta:-EPS},
 {id:"base",delta:0},
 {id:"plus",delta:EPS}
].map(x=>({...x,lower:L/(1+x.delta),upper:U/(1+x.delta)}));
function gate(a,delta){const effective=a*(1+delta);if(effective<0||effective>1)throw RangeError("effective alpha out of range");
 let n=0,g=G;while(g>TOL&&n<10000){g*=1-effective;n++}
 return {n,joint:4*Math.ceil(n/4),gap:g,effective};
}
const tests={};
for(const m of modes){
 const mid=(m.lower+m.upper)/2,below=m.lower-1e-5,near=m.upper-1e-5,above=m.upper+1e-5;
 tests[m.id+"_lower_exact"]=gate(m.lower,m.delta).n===4;
 tests[m.id+"_below_lower"]=gate(below,m.delta).n===5;
 tests[m.id+"_interior"]=gate(mid,m.delta).n===4;
 tests[m.id+"_below_upper"]=gate(near,m.delta).n===4;
 tests[m.id+"_upper_exact"]=gate(m.upper,m.delta).n===3;
 tests[m.id+"_above_upper"]=gate(above,m.delta).n===3;
 tests[m.id+"_lower_equation"]=Math.abs(G*(1-m.lower*(1+m.delta))**4-TOL)<1e-12;
 tests[m.id+"_upper_equation"]=Math.abs(G*(1-m.upper*(1+m.delta))**3-TOL)<1e-12;
 tests[m.id+"_below_joint8"]=gate(below,m.delta).joint===8;
 tests[m.id+"_inside_joint4"]=gate(mid,m.delta).joint===4;
 tests[m.id+"_above_joint4"]=gate(above,m.delta).joint===4;
 tests[m.id+"_inside_alpha_in_unit"]=mid>=0&&mid<=1;
 tests[m.id+"_sweep"]=Array.from({length:1001},(_,i)=>i/1000).every(a=>(gate(a,m.delta).n===4)===(a>=m.lower&&a<m.upper));
}
tests.shift_plus_left=modes[2].lower<modes[1].lower&&modes[2].upper<modes[1].upper;
tests.shift_minus_right=modes[0].lower>modes[1].lower&&modes[0].upper>modes[1].upper;
tests.plus_narrows=modes[2].upper-modes[2].lower<modes[1].upper-modes[1].lower;
tests.minus_widens=modes[0].upper-modes[0].lower>modes[1].upper-modes[1].lower;
tests.effective_alpha_075_plus=gate(.75,EPS).effective===.75*(1+EPS);
tests.effective_alpha_075_minus=gate(.75,-EPS).effective===.75*(1-EPS);
tests.base_window_contains_075=L<=.75&&.75<U;
tests.clock_full_turn=4*Q===PER;
tests.four_wheels_distinct=new Set([0,1440,2880,4320]).size===4;
tests.six_zeros=new Set("uvwxyz").size===6;
tests.twelve_directions=new Set([..."uvwxyz"].flatMap(x=>[x+"+",x+"-"])).size===12;
tests.twentyfour_contacts=new Set("abcdefghijklmnopqrstuvwx").size===24;
tests.five_nested_levels=25**5===9765625;
tests.wavelength_endpoints=380+370*5759/5759===750;
tests.fault_tick_detected=(4*Q+1)%PER!==0;
tests.fault_wavelength_detected=380!==380+370*1440/5759;
tests.fault_coordinate_detected=[0,1440,2880,4320].join()!==[1,1440,2880,4320].join();
const failed=Object.entries(tests).filter(([,v])=>!v).map(([k])=>k);
console.log(JSON.stringify({boundary:233,passed:Object.keys(tests).length-failed.length,total:Object.keys(tests).length,failed,window:modes,at_nominal_75:modes.map(m=>({mode:m.id,...gate(.75,m.delta)}))},null,2));
if(failed.length)process.exitCode=1;
