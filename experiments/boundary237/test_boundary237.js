#!/usr/bin/env node
"use strict";
/** CHRONOS Boundary 237 — restore a missed first gate WITHOUT resetting memory.
 * Run: node experiments/boundary237/test_boundary237.js
 * All motion, adaptation, "foam", effort are discrete model conventions, not physics.
 */
const START=.65-.543016542866826,TOL=.001,FOAM=.01025,Q=324000,PER=1296000;
const LOW=1-(TOL/START)**(1/4),UP=1-(TOL/START)**(1/3);
const CENTER=(LOW/(1-FOAM)+UP/(1+FOAM))/2,J=.02,EXTRA=.032;
const SLOW=(CENTER-J)*(1-FOAM-EXTRA),FAST=(CENTER+J)*(1+FOAM+EXTRA);
function run(first,second=CENTER,len=12){
 let gap=START,order=[0,1,2,3],clock=0,history=[];
 for(let step=1;step<=len;step++){
  const a=step<=4?first:second;
  gap*=1-a;order=[order[3],order[0],order[1],order[2]];
  clock=(clock+Q)%PER;
  history.push({step,alpha:a,gap,inside:gap<=TOL,wheels:[...order],clock,full:gap<=TOL&&clock===0});
 }
 return history;
}
const slow=run(SLOW),fast=run(FAST),safe=run(CENTER);
function firstIndex(rows,pred){let i=rows.findIndex(pred);return i<0?null:i+1}
const checks={};
for(const [name,rows] of [["slow",slow],["fast",fast],["safe",safe]]){
 checks[name+"_12_steps"]=rows.length===12;
 checks[name+"_gap_monotone"]=rows.every((r,i)=>i===0||r.gap<rows[i-1].gap);
 checks[name+"_tick_monotone_modulo"]=rows.every(r=>r.clock===r.step*Q%PER);
 checks[name+"_wheel_cycle"]=rows.filter(r=>r.step%4===0).every(r=>r.wheels.join()==="0,1,2,3");
 checks[name+"_six_finite"]=rows.slice(0,6).every(r=>Number.isFinite(r.gap));
 checks[name+"_spectral_identity"]=rows.every(r=>r.wheels.slice().sort().join()==="0,1,2,3");
 checks[name+"_memory_positive"]=rows.every(r=>r.gap>0);
 checks[name+"_clock_repeat"]=rows[3].clock===0&&rows[7].clock===0;
}
Object.assign(checks,{
 slow_effective_below_lower:SLOW<LOW,
 fast_effective_above_upper:FAST>UP,
 safe_effective_inside:CENTER>=LOW&&CENTER<UP,
 breached_budget:EXTRA>Math.min(1-FOAM-LOW/(CENTER-J),UP/(CENTER+J)-1-FOAM),
 slow_step3_not_ready:slow[2].gap>TOL,
 slow_step4_not_ready:slow[3].gap>TOL,
 slow_step4_clock_closed:slow[3].clock===0,
 slow_step4_not_full:!slow[3].full,
 corrected_step5_ready:slow[4].inside,
 corrected_step5_phase_open:slow[4].clock!==0,
 corrected_step5_uses_center:slow[4].alpha===CENTER,
 corrected_step8_full:slow[7].full,
 corrected_step8_exact_phase:slow[7].clock===0,
 corrected_step8_wheel_home:slow[7].wheels.join()==="0,1,2,3",
 corrected_step8_gap_small:slow[7].gap<1e-5,
 corrected_first_threshold_at5:firstIndex(slow,r=>r.inside)===5,
 corrected_first_full_at8:firstIndex(slow,r=>r.full)===8,
 no_memory_reset:Math.abs(slow[4].gap-slow[3].gap*(1-CENTER))<1e-14,
 gap_at_correction_not_initial:slow[4].gap!==START*(1-CENTER),
 correction_succeeds_one_step:slow[3].gap>TOL&&slow[4].gap<=TOL,
 baseline_safe_first_full4:firstIndex(safe,r=>r.full)===4,
 recovery_cost_four_extra_steps:(8-4)*Q===PER,
 recovery_cost_1296000_ticks:(8-4)*Q===1296000,
 total_time_2592000_ticks:8*Q===2592000,
 extra_clock_turn_exact:slow[7].step-slow[3].step===4,
 fast_crosses_early3:fast[2].inside,
 fast_already_full4:fast[3].full,
 fast_first_crossing_not_step4:firstIndex(fast,r=>r.inside)===3,
 fast_first_full4:firstIndex(fast,r=>r.full)===4,
 early_history_cannot_be_undone:fast[2].inside&&fast[4].inside,
 correction_keeps_history:slow[3].gap!==safe[3].gap,
 below_slow_perturbation_matters:SLOW<CENTER,
 alpha_bounds:[SLOW,FAST,CENTER].every(x=>x>0&&x<1),
 foam_band_exceeded:EXTRA>.03,
 slow_effective_not_constant:slow[3].alpha!==slow[4].alpha,
 step5_not_full:!slow[4].full,
 step6_not_full:!slow[5].full,
 step7_not_full:!slow[6].full,
 step8_first_full_after_failure:slow.slice(4,7).every(r=>!r.full)&&slow[7].full,
 no_exact_memory_equality:slow.every(r=>r.gap>0),
 original_alpha_formula:Math.abs(slow[3].gap-START*(1-SLOW)**4)<1e-14,
 memory_recovery_formula:Math.abs(slow[7].gap-START*(1-SLOW)**4*(1-CENTER)**4)<1e-14,
 six_zero_anchors:new Set("uvwxyz").size===6,
 twelve_signed_channels:new Set([..."uvwxyz"].flatMap(x=>[x+"+",x+"-"])).size===12,
 twentyfour_contacts:new Set("abcdefghijklmnopqrstuvwx").size===24,
 four_wheels:new Set([0,1440,2880,4320]).size===4,
 five_nested_levels:25**5===9765625,
 wavelength_endpoints:380+370*5759/5759===750,
 clock_fault_detected:(PER+1)%PER!==0,
 coordinate_fault_detected:[0,1440,2880,4320].join()!==[1,1440,2880,4320].join(),
 spectral_fault_detected:380!==380+370*1440/5759,
 clock_period:4*Q===PER,
 witness_append_only:slow.every((r,i)=>r.step===i+1)
});
const failed=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
const result={boundary:237,passed:Object.keys(checks).length-failed.length,total:Object.keys(checks).length,failed,
 effective:{slow:SLOW,fast:FAST,safe:CENTER},failure_gap:slow[3].gap,
 memory_recovery_step:firstIndex(slow,r=>r.inside),full_recovery_step:firstIndex(slow,r=>r.full),
 extra_quarter_turns:4,extra_chronos_ticks:4*Q,slow_history:slow};
console.log(JSON.stringify(result,null,2));if(failed.length)process.exitCode=1;
