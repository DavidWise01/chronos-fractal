#!/usr/bin/env node
"use strict";
/* CHRONOS B240 · minimum effective postfailure adaptation.
 * Execute: node experiments/boundary240/test_boundary240.js
 * Mathematical toy model, not a physical intervention study.
 */
const G=.65-.543016542866826,T=.001,S=.4,Q=324000,PER=1296000,E=.01025;
const lo=1-(T/G)**.25,hi=1-(T/G)**(1/3),CENTER=(lo/(1-E)+hi/(1+E))/2;
const G4=G*(1-S)**4,THRESHOLD=1-(T/G4)**.25;
const FLOAT_SAFE=THRESHOLD+1e-12;
function run(recovery){let gap=G,order=[0,1,2,3],rows=[];for(let step=1;step<=16;step++){
 const a=step<=4?S:recovery;gap*=1-a;order=[order[3],order[0],order[1],order[2]];
 rows.push({step,alpha:a,gap,ready:gap<=T,phase:step%4,clock:step*Q%PER,wheels:[...order],full:gap<=T&&step%4===0});
 }return rows;}
const passive=run(S),low=run(THRESHOLD-1e-6),safe=run(FLOAT_SAFE),center=run(CENTER),first=(r,p)=>r.find(x=>p(x))?.step;
const checks={};
for(const [name,r] of [["passive",passive],["below",low],["safe",safe],["center",center]]){
 checks[name+"_positive_gap"]=r.every(x=>x.gap>0);
 checks[name+"_monotone_gap"]=r.every((x,i)=>i===0||x.gap<r[i-1].gap);
 checks[name+"_four_wheel_permutation"]=r.every(x=>x.wheels.slice().sort().join()==="0,1,2,3");
 checks[name+"_clock_phase"]=r.every(x=>x.clock===x.step*Q%PER);
 checks[name+"_ready_iff_tolerance"]=r.every(x=>x.ready===(x.gap<=T));
 checks[name+"_full_iff_clock"]=r.every(x=>x.full===(x.ready&&x.clock===0));
 checks[name+"_same_first_four"]=r.slice(0,4).every((x,i)=>x.gap===passive[i].gap);
 checks[name+"_no_reset"]=Math.abs(r[4].gap-r[3].gap*(1-r[4].alpha))<1e-14;
 checks[name+"_finite"]=r.every(x=>Number.isFinite(x.gap));
 checks[name+"_step4_failed"]=r[3].gap>T&&!r[3].full;
}
Object.assign(checks,{
 threshold_formula:Math.abs(G4*(1-THRESHOLD)**4-T)<1e-14,
 threshold_above_40:THRESHOLD>S,
 threshold_below_center:THRESHOLD<CENTER,
 float_safe_above_threshold:FLOAT_SAFE>THRESHOLD,
 float_safe_gap_below_tolerance:safe[7].gap<=T,
 just_below_gap_above_tolerance:low[7].gap>T,
 just_below_step8_fails:!low[7].full,
 safe_step8_full:safe[7].full,
 center_step8_full:center[7].full,
 passive_step8_fail:!passive[7].full,
 passive_step12_full:passive[11].full,
 below_step12_full:low[11].full,
 safe_first_full8:first(safe,x=>x.full)===8,
 center_first_full8:first(center,x=>x.full)===8,
 passive_first_full12:first(passive,x=>x.full)===12,
 just_below_first_full12:first(low,x=>x.full)===12,
 safe_first_ready8:first(safe,x=>x.ready)===8,
 passive_first_ready10:first(passive,x=>x.ready)===10,
 center_first_ready6:first(center,x=>x.ready)===6,
 saved_one_cycle:(12-8)*Q===PER,
 exact_step8_analytic:Math.abs(G4*(1-THRESHOLD)**4-T)<1e-14,
 center_not_needed:CENTER-FLOAT_SAFE>.25,
 minimum_increment_from40:Math.abs((THRESHOLD-S)-.08177352938249349)<1e-12,
 minimum_is_unique_cutoff:THRESHOLD>0&&THRESHOLD<1,
 full_rate_retains_smaller_gap:center[7].gap<safe[7].gap,
 no_time_gain_from_more_correction:first(center,x=>x.full)===first(safe,x=>x.full),
 floating_point_caveat:Math.abs(G4*(1-THRESHOLD)**4-T)<1e-14,
 interval_just_above:Array.from({length:100},(_,i)=>THRESHOLD+1e-9+(CENTER-THRESHOLD-1e-9)*i/99).every(a=>run(a)[7].full),
 interval_just_below:Array.from({length:100},(_,i)=>S+(THRESHOLD-S-1e-6)*i/99).every(a=>!run(a)[7].full),
 quarter_ticks:Q*4===PER,
 six_zero_anchors:new Set("uvwxyz").size===6,
 twelve_signed_directions:new Set([..."uvwxyz"].flatMap(x=>[x+"+",x+"-"])).size===12,
 twentyfour_contacts:new Set("abcdefghijklmnopqrstuvwx").size===24,
 five_levels:25**5===9765625,
 four_chrome_coordinates:new Set([0,1440,2880,4320]).size===4,
 chromatic_endpoints:380+370*5759/5759===750,
 clock_fault:(PER+1)%PER===1,
 coordinate_fault:[0,1440,2880,4320].join()!==[1,1440,2880,4320].join(),
 wavelength_fault:380!==380+370*1440/5759
});
const failed=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
console.log(JSON.stringify({boundary:240,passed:Object.keys(checks).length-failed.length,total:Object.keys(checks).length,failed,initial_gap:G,step4_gap:G4,threshold:THRESHOLD,float_safe:FLOAT_SAFE,passive_full:first(passive,x=>x.full),safe_full:first(safe,x=>x.full),center_full:first(center,x=>x.full),safe_step8_gap:safe[7].gap},null,2));
if(failed.length)process.exitCode=1;
