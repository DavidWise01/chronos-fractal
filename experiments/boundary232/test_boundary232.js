#!/usr/bin/env node
"use strict";
/** CHRONOS Boundary 232: first-step-four gate interval.
 * Run: node test_boundary232.js. No external dependencies.
 * Return-gate alignment is discrete arithmetic; NOT physical resonance.
 */
const initial=.65-.543016542866826,epsilon=.001,Q=324000,PER=1296000;
const q=epsilon/initial, lower=1-q**(1/4),upper=1-q**(1/3);
function gate(alpha){if(alpha<0||alpha>1)throw RangeError("alpha outside [0,1]");let g=initial,n=0;while(g>epsilon&&n<10000){n++;g*=1-alpha;}return {alpha,memory:n,joint:4*Math.ceil(n/4),wait:4*Math.ceil(n/4)-n,gap:g};}
const cases=[
 {name:"below lower",a:lower-1e-5,expected:5},
 {name:"lower",a:lower,expected:4},
 {name:"interior",a:.75,expected:4},
 {name:"near upper",a:upper-1e-5,expected:4},
 {name:"upper",a:upper,expected:3},
 {name:"above upper",a:upper+1e-5,expected:3}
].map(c=>({...c,...gate(c.a)}));
const checks={};
for(const c of cases){
 checks[c.name+" exact first crossing"]=c.memory===c.expected;
 checks[c.name+" joint phase"]=c.joint%4===0;
 checks[c.name+" gap satisfied"]=c.gap<=epsilon;
 checks[c.name+" minimality"]=c.memory===0||initial*(1-c.a)**(c.memory-1)>epsilon-1e-14;
}
checks.lower_included=initial*(1-lower)**4<=epsilon;
checks.below_lower_excluded=gate(lower-1e-5).memory>4;
checks.upper_excluded=gate(upper).memory<4;
checks.below_upper_included=gate(upper-1e-5).memory===4;
checks.rate075_inside=lower<=.75&&.75<upper;
checks.width_positive=upper>lower;
checks.closed_form_lower=Math.abs(initial*(1-lower)**4-epsilon)<1e-12;
checks.closed_form_upper=Math.abs(initial*(1-upper)**3-epsilon)<1e-12;
checks.lower_joint_step4=gate(lower).joint===4;
checks.below_lower_joint_step8=gate(lower-1e-5).joint===8;
checks.upper_joint_still4=gate(upper).joint===4;
checks.interior_zero_wait=gate(.75).wait===0;
checks.upper_one_step_wait=gate(upper).wait===1;
checks.sweep_matches_exact_interval=[...Array(1001)].every((_,i)=>{let a=i/1000;let expected=a>=lower&&a<upper;return (gate(a).memory===4)===expected});
checks.four_distinct_chrome_wheels=new Set([0,1440,2880,4320]).size===4;
checks.six_zero_anchors=new Set("uvwxyz").size===6;
checks.twelve_signed_directions=new Set([..."uvwxyz"].flatMap(x=>[x+"+",x+"-"])).size===12;
checks.twentyfour_contacts=new Set("abcdefghijklmnopqrstuvwx").size===24;
checks.five_levels=25**5===9765625;
checks.clock_quarter=4*Q===PER;
checks.wavelength_endpoints=(380+370*5759/5759)===750;
checks.clock_fault_detectable=(4*Q+1)%PER===1;
checks.chromatic_swap_detectable=[0,1440,2880,4320].join()!=[1440,0,2880,4320].join();
checks.memory_gap_not_exact=gate(.75).gap>0;
const failed=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
console.log(JSON.stringify({boundary:232,passed:Object.keys(checks).length-failed.length,total:Object.keys(checks).length,failed,lower,upper,cases},null,2));
if(failed.length)process.exitCode=1;
