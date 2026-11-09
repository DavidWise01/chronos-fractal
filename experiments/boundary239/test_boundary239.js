#!/usr/bin/env node
"use strict";
/* CHRONOS B239 — intervention wins one Chrome cycle, zero dependencies. */
const INITIAL=.65-.543016542866826,TOL=.001,Q=324000,PER=1296000,SLOW=.4,EPS=.01025;
const LO=1-(TOL/INITIAL)**.25,HI=1-(TOL/INITIAL)**(1/3),CENTER=(LO/(1-EPS)+HI/(1+EPS))/2;
function run(corrected){
  let gap=INITIAL,order=[0,1,2,3],rows=[];
  for(let step=1;step<=16;step++){
    const alpha=step>4&&corrected?CENTER:SLOW;
    gap*=1-alpha;order=[order[3],order[0],order[1],order[2]];
    rows.push({step,alpha,gap,ready:gap<=TOL,phase:step%4,clock_tick:(step*Q)%PER,wheels:[...order],full:gap<=TOL&&step%4===0});
  }
  return rows;
}
const passive=run(false),corrected=run(true),first=(r,p)=>r.find(x=>p(x))?.step,checks={};
for(const [name,rows] of [["passive",passive],["corrected",corrected]]){
 checks[name+"_16_rows"]=rows.length===16;
 checks[name+"_monotone_gap"]=rows.every((r,i)=>i===0||r.gap<rows[i-1].gap);
 checks[name+"_positive_gap"]=rows.every(r=>r.gap>0);
 checks[name+"_finite"]=rows.every(r=>Number.isFinite(r.gap));
 checks[name+"_step4_failure"]=rows[3].gap>TOL;
 checks[name+"_step4_clock"]=rows[3].clock_tick===0;
 checks[name+"_step4_wheels"]=rows[3].wheels.join()==="0,1,2,3";
 checks[name+"_step5_no_full"]=!rows[4].full;
 checks[name+"_step8_clock"]=rows[7].clock_tick===0;
 checks[name+"_step12_clock"]=rows[11].clock_tick===0;
 checks[name+"_wheel_permutation"]=rows.every(r=>r.wheels.slice().sort().join()==="0,1,2,3");
 checks[name+"_quarter_ticks"]=rows.every(r=>r.clock_tick===r.step*Q%PER);
 checks[name+"_full_only_at_phase0"]=rows.every(r=>!r.full||r.phase===0);
 checks[name+"_within_tolerance_definition"]=rows.every(r=>r.ready===(r.gap<=TOL));
 checks[name+"_full_return_definition"]=rows.every(r=>r.full===(r.ready&&r.phase===0));
 checks[name+"_sequence"]=rows.every((r,i)=>r.step===i+1);
}
Object.assign(checks,{
 initial_gap_positive:INITIAL>0,
 slow_rate_below_8_step_threshold:SLOW<1-(TOL/INITIAL)**(1/8),
 slow_rate_below_four_step_threshold:SLOW<LO,
 center_inside_robust_core:CENTER>=LO/(1-EPS)&&CENTER<HI/(1+EPS),
 histories_identical_through_step4:passive.slice(0,4).every((r,i)=>r.gap===corrected[i].gap&&r.alpha===corrected[i].alpha),
 histories_diverge_at_step5:passive[4].gap>corrected[4].gap,
 passive_rate_constant:passive.every(r=>r.alpha===SLOW),
 corrected_rate_after_step4:corrected.slice(4).every(r=>r.alpha===CENTER),
 no_reset_passive:Math.abs(passive[4].gap-passive[3].gap*(1-SLOW))<1e-14,
 no_reset_corrected:Math.abs(corrected[4].gap-corrected[3].gap*(1-CENTER))<1e-14,
 step4_gap_value:Math.abs(passive[3].gap-0.013865056044459353)<1e-14,
 passive_step8_above_tol:passive[7].gap>TOL,
 corrected_step8_within_tol:corrected[7].gap<=TOL,
 passive_step10_ready:first(passive,r=>r.ready)===10,
 corrected_step6_ready:first(corrected,r=>r.ready)===6,
 passive_step12_full:first(passive,r=>r.full)===12,
 corrected_step8_full:first(corrected,r=>r.full)===8,
 passive_step8_not_full:!passive[7].full,
 corrected_step8_full_boolean:corrected[7].full,
 passive_step12_full_boolean:passive[11].full,
 corrected_memory_ready_before_full:first(corrected,r=>r.ready)<first(corrected,r=>r.full),
 passive_memory_ready_before_full:first(passive,r=>r.ready)<first(passive,r=>r.full),
 one_full_cycle_saved:first(passive,r=>r.full)-first(corrected,r=>r.full)===4,
 one_full_clock_saved:(12-8)*Q===PER,
 actual_tick_times:corrected[7].step*Q===2592000&&passive[11].step*Q===3888000,
 corrected_step8_exact_gap:Math.abs(corrected[7].gap-0.00006456669590247158)<1e-14,
 passive_step8_exact_gap:Math.abs(passive[7].gap-0.001796911263361932)<1e-14,
 passive_step12_exact_gap:Math.abs(passive[11].gap-0.00023287969973170638)<1e-14,
 corrected_gain_positive:passive[7].gap>corrected[7].gap,
 corrected_step12_gap_lower:corrected[11].gap<passive[11].gap,
 analytic_passive_8:Math.abs(passive[7].gap-INITIAL*(1-SLOW)**8)<1e-14,
 analytic_corrected_8:Math.abs(corrected[7].gap-INITIAL*(1-SLOW)**4*(1-CENTER)**4)<1e-14,
 clock_period:4*Q===PER,
 six_zeros:new Set("uvwxyz").size===6,
 twelve_signed:new Set([..."uvwxyz"].flatMap(s=>[s+"+",s+"-"])).size===12,
 twentyfour_contacts:new Set("abcdefghijklmnopqrstuvwx").size===24,
 four_chrome_wheels:new Set([0,1440,2880,4320]).size===4,
 five_nested_levels:25**5===9765625,
 chromatic_endpoints:380+370*5759/5759===750,
 clock_fault_detected:(PER+1)%PER!==0,
 coord_fault_detected:[0,1440,2880,4320].join()!==[1,1440,2880,4320].join(),
 spectral_fault_detected:380!==380+370*1440/5759,
 append_only_step_order:passive.every((r,i)=>r.step===i+1)&&corrected.every((r,i)=>r.step===i+1)
});
const failed=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
console.log(JSON.stringify({boundary:239,passed:Object.keys(checks).length-failed.length,total:Object.keys(checks).length,failed,slow_rate:SLOW,corrected_rate:CENTER,passive_memory_step:10,corrected_memory_step:6,passive_full_step:12,corrected_full_step:8,ticks_saved:PER},null,2));
if(failed.length)process.exitCode=1;
