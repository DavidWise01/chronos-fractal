#!/usr/bin/env node
"use strict";
/** CHRONOS Boundary 238: passive vs corrected recovery after a missed first gate.
 * Run: node experiments/boundary238/test_boundary238.js
 * Dimensionless mathematical model; no physical claims.
 */
const G=.65-.543016542866826,T=.001,E=.01025,Q=324000,PER=1296000;
const L=1-(T/G)**.25,U=1-(T/G)**(1/3),C=(L/(1-E)+U/(1+E))/2,S=(C-.02)*(1-E-.032);
function run(corrected){let gap=G,rows=[],order=[0,1,2,3],clock=0;
 for(let step=1;step<=12;step++){const alpha=corrected&&step>4?C:S;gap*=1-alpha;
 order=[order[3],...order.slice(0,3)];clock=(clock+Q)%PER;
 rows.push({step,alpha,gap,ready:gap<=T,clock,wheels:[...order],full:gap<=T&&clock===0});}
 return rows;}
const passive=run(false),corrected=run(true),first=(r,p)=>r.find(x=>p(x))?.step;
const checks={};
for(const [name,r] of [["passive",passive],["corrected",corrected]]){
 checks[name+" monotone"]=r.every((x,i)=>i===0||x.gap<r[i-1].gap);
 checks[name+" first gate fail"]=r[3].gap>T&&!r[3].full;
 checks[name+" step5 ready"]=r[4].ready;
 checks[name+" first memory step5"]=first(r,x=>x.ready)===5;
 checks[name+" step5 phase open"]=r[4].clock!==0;
 checks[name+" first full step8"]=first(r,x=>x.full)===8;
 checks[name+" step8 phase closed"]=r[7].clock===0;
 checks[name+" step8 wheel home"]=r[7].wheels.join()==="0,1,2,3";
 checks[name+" phase cycles"]=r.filter(x=>x.step%4===0).every(x=>x.clock===0);
 checks[name+" all finite"]=r.every(x=>Number.isFinite(x.gap));
 checks[name+" retained memory positive"]=r.every(x=>x.gap>0);
 checks[name+" step8 tolerance"]=r[7].gap<T;
 checks[name+" clock count"]=r[7].step*Q===2592000;
 checks[name+" sequence"]=r.every((x,i)=>x.step===i+1);
 checks[name+" four wheels invariant"]=r.every(x=>x.wheels.slice().sort().join()==="0,1,2,3");
}
Object.assign(checks,{
 slow_below_lower:S<L,
 center_inside_window:C>=L&&C<U,
 both_identical_before_correction:passive.slice(0,4).every((x,i)=>x.gap===corrected[i].gap),
 passive_constant_rate:passive.every(x=>x.alpha===S),
 corrected_rate_only_after_step4:corrected.slice(0,4).every(x=>x.alpha===S)&&corrected.slice(4).every(x=>x.alpha===C),
 corrected_memory_not_reset:Math.abs(corrected[4].gap-corrected[3].gap*(1-C))<1e-14,
 passive_memory_not_reset:Math.abs(passive[4].gap-passive[3].gap*(1-S))<1e-14,
 corrected_step5_gap_smaller:corrected[4].gap<passive[4].gap,
 corrected_step8_gap_smaller:corrected[7].gap<passive[7].gap,
 passive_step8_gap_value:Math.abs(passive[7].gap-0.00000950748878187571)<1e-15,
 corrected_step8_gap_value:Math.abs(corrected[7].gap-0.000004696541432587789)<1e-15,
 same_first_memory: first(passive,x=>x.ready)===first(corrected,x=>x.ready),
 same_first_full: first(passive,x=>x.full)===first(corrected,x=>x.full),
 both_extra_four_steps: first(passive,x=>x.full)-4===4&&first(corrected,x=>x.full)-4===4,
 no_timing_gain_from_correction: first(passive,x=>x.full)-first(corrected,x=>x.full)===0,
 correction_reduces_residual:corrected[7].gap/passive[7].gap<1,
 two_model_paths_distinct_after4:passive.slice(4).every((x,i)=>x.gap>corrected[i+4].gap),
 active_not_same_as_passive:corrected[7].alpha!==passive[7].alpha,
 clock_tick_count:4*Q===PER,
 step4_failure_both:passive[3].gap>T&&corrected[3].gap>T,
 step5_memory_both:passive[4].gap<T&&corrected[4].gap<T,
 step8_joint_both:passive[7].full&&corrected[7].full,
 six_zeros:new Set("uvwxyz").size===6,
 twelve_directions:new Set([..."uvwxyz"].flatMap(x=>[x+"+",x+"-"])).size===12,
 twentyfour_contacts:new Set("abcdefghijklmnopqrstuvwx").size===24,
 five_levels:25**5===9765625,
 four_chrome_positions:new Set([0,1440,2880,4320]).size===4,
 spectral_ends:380+370*5759/5759===750,
 clock_fault:(PER+1)%PER===1,
 coordinate_fault:[0,1440,2880,4320].join()!==[1,1440,2880,4320].join(),
 wavelength_fault:380!==380+370*1440/5759
});
const failed=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
console.log(JSON.stringify({boundary:238,passed:Object.keys(checks).length-failed.length,total:Object.keys(checks).length,failed,passive,corrected,first_full:8},null,2));
if(failed.length)process.exitCode=1;
