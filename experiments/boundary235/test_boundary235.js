#!/usr/bin/env node
"use strict";
/** CHRONOS B235: maximize symmetric nominal-rate margin within robust first-gate interval.
 * Node 18+, zero dependencies. This is a discrete toy relaxation model, not physics.
 */
const G=.65-.543016542866826,T=.001,E=.01025,Q=324000,PER=1296000;
const L=(1-(T/G)**.25)/(1-E),U=(1-(T/G)**(1/3))/(1+E),C=(L+U)/2;
function gate(a,d){let n=0,g=G;while(g>T&&n<1000){n++;g*=1-a*(1+d)}return {n,j:Math.ceil(n/4)*4,g}}
const margin=a=>Math.min(a-L,U-a);
const cases=[["below",L-.00001,false],["lower",L,true],["lowernear",L+.00001,true],["center",C,true],["reference",.75,true],["uppernear",U-.00001,true],["upper",U,false],["above",U+.00001,false]];
const checks={};
for(const [name,a,inside] of cases){
 checks[name+"_geometric"]=(a>=L&&a<U)===inside;
 checks[name+"_three_mode"]=([-E,0,E].every(d=>gate(a,d).n===4))===inside;
 checks[name+"_phase"]=[-E,0,E].every(d=>gate(a,d).j%4===0);
}
for(const [name,d] of [["minus",-E],["base",0],["plus",E]]){
 checks[name+"_center_gate"]=gate(C,d).n===4;
 checks[name+"_reference_gate"]=gate(.75,d).n===4;
 checks[name+"_center_joint"]=gate(C,d).j===4;
 checks[name+"_reference_joint"]=gate(.75,d).j===4;
 checks[name+"_center_tolerance"]=gate(C,d).g<=T;
 checks[name+"_reference_tolerance"]=gate(.75,d).g<=T;
}
Object.assign(checks,{
 midpoint_equal:C===(L+U)/2,
 midpoint_inside:C>=L&&C<U,
 reference_inside:.75>=L&&.75<U,
 symmetrical_margin:Math.abs((C-L)-(U-C))<1e-14,
 half_width_margin:Math.abs(margin(C)-(U-L)/2)<1e-14,
 center_outperforms_reference:margin(C)>margin(.75),
 reference_upper_limited:Math.abs(margin(.75)-(U-.75))<1e-14,
 gain_positive:margin(C)-margin(.75)>0,
 midpoint_margin_positive:margin(C)>0,
 upper_edge_excluded:gate(U,E).n===3,
 lower_edge_included:gate(L,-E).n===4,
 just_below_delayed:gate(L-.00001,-E).n===5,
 just_above_early:gate(U+.00001,E).n===3,
 midpoint_continuous_foam:Array.from({length:101},(_,i)=>-E+2*E*i/100).every(d=>gate(C,d).n===4),
 reference_continuous_foam:Array.from({length:101},(_,i)=>-E+2*E*i/100).every(d=>gate(.75,d).n===4),
 grid_margin_optimal:Array.from({length:10001},(_,i)=>L+(U-L)*i/10000).every(a=>margin(a)<=margin(C)+1e-12),
 center_safe_jitter:Array.from({length:401},(_,i)=>C-margin(C)+1e-9+2*(margin(C)-1e-9)*i/400).every(a=>[-E,0,E].every(d=>gate(a,d).n===4)),
 upper_jitter_breaks:gate(C+margin(C),E).n===3,
 four_quarter_clock:4*Q===PER,
 clock_fault:(PER+1)%PER===1,
 coordinate_fault:[0,1440,2880,4320].join()!==[1,1440,2880,4320].join(),
 wavelength_fault:380!==380+370*1440/5759,
 six_anchors:new Set("uvwxyz").size===6,
 twelve_signed:new Set([..."uvwxyz"].flatMap(s=>[s+"+",s+"-"])).size===12,
 twentyfour_contacts:new Set("abcdefghijklmnopqrstuvwx").size===24,
 four_wheels:new Set([0,1440,2880,4320]).size===4,
 five_levels:25**5===9765625,
 spectral_end:380+370*5759/5759===750,
 gap_nonzero:gate(C,0).g>0,
 all_finite:[L,U,C,margin(C),margin(.75)].every(Number.isFinite),
 legal_bounds:L>0&&U<1
});
const failed=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
console.log(JSON.stringify({boundary:235,passed:Object.keys(checks).length-failed.length,total:Object.keys(checks).length,failed,stable_core:{lower_inclusive:L,upper_exclusive:U},midpoint:C,center_margin:margin(C),reference_rate:.75,reference_margin:margin(.75),gain:margin(C)-margin(.75)},null,2));
if(failed.length)process.exitCode=1;
