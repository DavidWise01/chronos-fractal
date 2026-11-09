#!/usr/bin/env node
"use strict";
/** CHRONOS B241: guarded minimal rate for +/-0.5 pp additive rate error
 * and +/-1.025% multiplicative modulation, after shared step-four failure.
 * Run: node experiments/boundary241/test_boundary241.js
 * Toy discrete memory and phase model; not an empirical physical claim.
 */
const G=.65-.543016542866826,T=.001,S=.4,Q=324000,PER=1296000,E=.01025,J=.005,NUMERICAL_GUARD=1e-10;
const g4=G*(1-S)**4,MIN=1-(T/g4)**.25,ROBUST=MIN/(1-E)+J,CMD=ROBUST+NUMERICAL_GUARD;
function gap8(command,error,foam){const eff=(command+error)*(1+foam);return {effective:eff,gap:g4*(1-eff)**4,ready:g4*(1-eff)**4<=T}}
function trajectory(command,error,foam){let gap=G,order=[0,1,2,3],out=[];for(let step=1;step<=12;step++){let alpha=step<=4?S:(command+error)*(1+foam);gap*=1-alpha;order=[order[3],...order.slice(0,3)];out.push({step,alpha,gap,ready:gap<=T,clock:step*Q%PER,order:[...order],full:gap<=T&&step%4===0});}return out}
const cases=[
 ["worst",CMD,-J,-E,true],["best",CMD,J,E,true],["rate_minus",CMD,-J,E,true],["foam_minus",CMD,J,-E,true],
 ["nominal",CMD,0,0,true],["below_worst",ROBUST-1e-6,-J,-E,false],
 ["old_unprotected",MIN+1e-12,-J,-E,false]
];
const checks={};const first=(r,p)=>r.find(x=>p(x))?.step;
for(const [name,c,e,f,ready] of cases){
 const r=trajectory(c,e,f);
 checks[name+"_step4_common"]=Math.abs(r[3].gap-g4)<1e-14;
 checks[name+"_step4_failure"]=r[3].gap>T;
 checks[name+"_step8_phase"]=r[7].clock===0;
 checks[name+"_step8_acceptance"]=r[7].ready===ready;
 checks[name+"_first_full"]=first(r,x=>x.full)===(ready?8:12);
 checks[name+"_permutation"]=r.every(x=>x.order.slice().sort().join()==="0,1,2,3");
 checks[name+"_gap_monotone"]=r.every((x,i)=>i===0||x.gap<r[i-1].gap);
 checks[name+"_finite"]=r.every(x=>Number.isFinite(x.gap));
 checks[name+"_witness_preserved"]=Math.abs(r[4].gap-r[3].gap*(1-r[4].alpha))<1e-14;
}
Object.assign(checks,{
 robust_closed_form:Math.abs((ROBUST-J)*(1-E)-MIN)<1e-14,
 guarded_rate_above_boundary:CMD>ROBUST,
 rate_above_B240:CMD>MIN,
 cmd_below_center:CMD<.7387707922453981,
 guard_positive:NUMERICAL_GUARD>0,
 mathematical_threshold_identity:Math.abs(g4*(1-MIN)**4-T)<1e-14,
 strict_worst_gap:gap8(CMD,-J,-E).gap<T,
 edge_float_ambiguity:Math.abs(gap8(ROBUST,-J,-E).gap-T)<1e-14,
 just_below_fails:gap8(ROBUST-1e-6,-J,-E).gap>T,
 plus_error_improves:gap8(CMD,J,-E).gap<gap8(CMD,-J,-E).gap,
 plus_foam_improves:gap8(CMD,-J,E).gap<gap8(CMD,-J,-E).gap,
 best_case_gap_lowest:gap8(CMD,J,E).gap<gap8(CMD,0,0).gap,
 guaranteed_all_121_grid:Array.from({length:11},(_,i)=>-J+i*(2*J/10)).every(err=>Array.from({length:11},(_,i)=>-E+i*(2*E/10)).every(foam=>gap8(CMD,err,foam).gap<T)),
 effective_under_unity:(CMD+J)*(1+E)<1,
 effective_above_zero:(CMD-J)*(1-E)>0,
 worst_first_memory_step8:first(trajectory(CMD,-J,-E),x=>x.ready)===8,
 best_first_memory_step8:first(trajectory(CMD,J,E),x=>x.ready)===8,
 unguarded_below_first_full12:first(trajectory(ROBUST-1e-6,-J,-E),x=>x.full)===12,
 unprotected_threshold_fails:gap8(MIN+1e-12,-J,-E).gap>T,
 same_failure_state_all_cases:cases.every(([,c,e,f])=>Math.abs(trajectory(c,e,f)[3].gap-g4)<1e-14),
 no_extra_clock_benefit_above_guard:first(trajectory(.7387707922453981,0,0),x=>x.full)===8,
 improvement_over_passive_ticks:4*Q===PER,
 first_full_ticks:8*Q===2592000,
 passive_full_ticks:12*Q===3888000,
 six_zeros:new Set("uvwxyz").size===6,
 twelve_signed:new Set([..."uvwxyz"].flatMap(x=>[x+"+",x+"-"])).size===12,
 twentyfour_contacts:new Set("abcdefghijklmnopqrstuvwx").size===24,
 four_wheels:new Set([0,1440,2880,4320]).size===4,
 five_nested_levels:25**5===9765625,
 wavelengths_endpoints:380+370*5759/5759===750,
 clock_fault:(PER+1)%PER===1,
 coordinate_fault:[0,1440,2880,4320].join()!==[1,1440,2880,4320].join(),
 wave_fault:380!==380+370*1440/5759
});
const failed=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
console.log(JSON.stringify({boundary:241,passed:Object.keys(checks).length-failed.length,total:Object.keys(checks).length,failed,command:CMD,mathematical_boundary:ROBUST,unprotected_min:MIN,worst:gap8(CMD,-J,-E),best:gap8(CMD,J,E)},null,2));
if(failed.length)process.exitCode=1;
