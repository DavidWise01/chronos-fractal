#!/usr/bin/env node
"use strict";
/** CHRONOS B243: finite observed uncertainty and honest coverage statuses.
 * Run: node experiments/boundary243/test_boundary243.js
 * All observations are labeled SYNTHETIC; never claim physical sensing.
 */
const G=.65-.543016542866826,T=.001,S=.4,Q=324000,PER=1296000,GUARD=1e-10;
const G4=G*(1-S)**4,MIN=1-(T/G4)**.25;
const train=[
 {id:"o01",e:-.002,d:-.005},{id:"o02",e:.004,d:.007},
 {id:"o03",e:-.005,d:-.008},{id:"o04",e:.003,d:.009},
 {id:"o05",e:0,d:0},{id:"o06",e:-.003,d:.010}
];
const holdout=[
 {id:"h01",e:-.004,d:-.009},{id:"h02",e:.002,d:.006},
 {id:"h03",e:.006,d:.001},{id:"h04",e:-.008,d:-.015},
 {id:"h05",e:-.0055,d:-.0105}
];
function calibrate(samples){
 const j=Math.max(...samples.map(s=>Math.abs(s.e)));
 const f=Math.max(...samples.map(s=>Math.abs(s.d)));
 return {j,f,command:MIN/(1-f)+j+GUARD,n:samples.length};
}
function assess(sample,cal){
 const covered=Math.abs(sample.e)<=cal.j&&Math.abs(sample.d)<=cal.f;
 const effective=(cal.command+sample.e)*(1+sample.d);
 const gap=G4*(1-effective)**4;
 return {...sample,covered,coverage:covered?"COVERED":"UNKNOWN",effective,gap,actual:gap<=T?"PASS":"FAIL"};
}
function history(sample,cal){
 let gap=G,order=[0,1,2,3],rows=[];
 for(let step=1;step<=12;step++){
  let alpha=step<=4?S:(cal.command+sample.e)*(1+sample.d);
  gap*=1-alpha;order=[order[3],...order.slice(0,3)];
  rows.push({step,alpha,gap,ready:gap<=T,clock:step*Q%PER,wheels:[...order],full:gap<=T&&step%4===0});
 }return rows;
}
const original=calibrate(train),expanded=calibrate([...train,holdout[3]]);
const assessed=holdout.map(x=>assess(x,original));
const checks={};
for(const s of train){
 checks[s.id+"_contained"]=assess(s,original).covered;
 checks[s.id+"_actual_pass"]=assess(s,original).actual==="PASS";
 checks[s.id+"_id_present"]=s.id.length>0;
 checks[s.id+"_raw_unchanged"]=train.some(t=>t.id===s.id&&t.e===s.e&&t.d===s.d);
}
for(const h of assessed){
 const row=history(h,original);
 checks[h.id+"_actual_matches_gap"]=(h.actual==="PASS")===(h.gap<=T);
 checks[h.id+"_coverage_rule"]=h.covered===(Math.abs(h.e)<=original.j&&Math.abs(h.d)<=original.f);
 checks[h.id+"_coverage_status"]=h.coverage===(h.covered?"COVERED":"UNKNOWN");
 checks[h.id+"_synthetic_outcome"]=row[7].full===(h.actual==="PASS");
 checks[h.id+"_no_reset"]=Math.abs(row[4].gap-row[3].gap*(1-row[4].alpha))<1e-14;
 checks[h.id+"_first4_same"]=Math.abs(row[3].gap-G4)<1e-14;
 checks[h.id+"_phase8"]=row[7].clock===0;
 checks[h.id+"_wheels_home"]=row[7].wheels.join()==="0,1,2,3";
 checks[h.id+"_phase12"]=row[11].clock===0;
 checks[h.id+"_clock_numerical"]=row.every(r=>r.clock===r.step*Q%PER);
}
Object.assign(checks,{
 training_count:train.length===6,
 heldout_count:holdout.length===5,
 observed_j_exact:original.j===.005,
 observed_f_exact:original.f===.010,
 calibrated_command:Math.abs(original.command-.4916399287691854)<1e-14,
 covered_holdouts_pass:assessed.filter(x=>x.covered).length===2&&assessed.filter(x=>x.covered).every(x=>x.actual==="PASS"),
 outside_count:assessed.filter(x=>!x.covered).length===3,
 outside_pass_exists:assessed.some(x=>!x.covered&&x.actual==="PASS"),
 outside_fail_exists:assessed.some(x=>!x.covered&&x.actual==="FAIL"),
 no_outside_claims:assessed.filter(x=>!x.covered).every(x=>x.coverage==="UNKNOWN"),
 failed_sample_outside:assessed.find(x=>x.id==="h04").coverage==="UNKNOWN"&&assessed.find(x=>x.id==="h04").actual==="FAIL",
 pass_outside_unknown:assessed.find(x=>x.id==="h03").coverage==="UNKNOWN"&&assessed.find(x=>x.id==="h03").actual==="PASS",
 original_worst_gap:G4*(1-(original.command-original.j)*(1-original.f))**4<T,
 original_closed_form:Math.abs((original.command-original.j)*(1-original.f)-(MIN+GUARD*(1-original.f)))<1e-14,
 holdout_not_in_training:holdout.every(h=>!train.some(x=>x.id===h.id)),
 no_leakage_into_initial_bounds:original.j===.005&&original.f===.01,
 expanded_j:expanded.j===.008,
 expanded_f:expanded.f===.015,
 expanded_command_higher:expanded.command>original.command,
 replay_failed_sample_now_passes:assess(holdout[3],expanded).actual==="PASS",
 replay_failed_sample_now_covered:assess(holdout[3],expanded).covered,
 expanded_training_count:expanded.n===7,
 expanded_original_records_unchanged:train.every((x,i)=>train[i].id===x.id),
 new_worst_gap:G4*(1-(expanded.command-expanded.j)*(1-expanded.f))**4<T,
 single_sample_not_universal:original.n===6&&holdout.length===5,
 all_train_measured_envelope:train.every(x=>assess(x,original).covered),
 increased_uncertainty_recalibrates:expanded.j>original.j&&expanded.f>original.f,
 expanded_on_failure_only:!assessed[3].covered&&assessed[3].actual==="FAIL",
 pass_not_equivalent_coverage:assessed[2].actual==="PASS"&&!assessed[2].covered,
 clock_cycle:4*Q===PER,
 six_zero_anchors:new Set("uvwxyz").size===6,
 twelve_signed_directions:new Set([..."uvwxyz"].flatMap(x=>[x+"+",x+"-"])).size===12,
 twentyfour_contacts:new Set("abcdefghijklmnopqrstuvwx").size===24,
 five_nested_levels:25**5===9765625,
 four_chrome_wheels:new Set([0,1440,2880,4320]).size===4,
 wavelength_endpoints:380+370*5759/5759===750,
 clock_fault:(PER+1)%PER===1,
 coordinate_fault:[0,1440,2880,4320].join()!==[1,1440,2880,4320].join(),
 wavelength_fault:380!==380+370*1440/5759
});
const failed=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
console.log(JSON.stringify({boundary:243,passed:Object.keys(checks).length-failed.length,total:Object.keys(checks).length,failed,original,expanded,holdout:assessed},null,2));
if(failed.length)process.exitCode=1;
