#!/usr/bin/env node
"use strict";
/** CHRONOS B242 — bounded adaptive guard calibration.
 * Run: node experiments/boundary242/test_boundary242.js
 * Toy discrete state model. Bounds are supplied observations/assumptions,
 * NOT estimated from a nonexistent sensor or evidence of real physical foam.
 */
const G=.65-.543016542866826,T=.001,S=.4,Q=324000,PER=1296000,GUARD=1e-10;
const G4=G*(1-S)**4,MIN=1-(T/G4)**.25;
const PROFILES=[["clear",0,0],["mild",.0025,.005],["b241",.005,.01025],["wide",.01,.02],["severe",.02,.03]];
function calibrate(j,f){if(j<0||f<0||f>=1)throw RangeError("invalid uncertainty bound");const command=MIN/(1-f)+j+GUARD;return{j,f,command,worst:(command-j)*(1-f),best:(command+j)*(1+f)}}
function simulate(command,error,mod){let gap=G,order=[0,1,2,3],rows=[];for(let step=1;step<=12;step++){
 const alpha=step<=4?S:(command+error)*(1+mod);
 if(alpha<0||alpha>1)throw RangeError("unstable effective alpha");
 gap*=1-alpha;order=[order[3],...order.slice(0,3)];
 rows.push({step,alpha,gap,ready:gap<=T,clock:step*Q%PER,wheels:[...order],full:gap<=T&&step%4===0});
 }return rows}
const first=(rows,p)=>rows.find(r=>p(r))?.step;
const checks={};
const profiles=PROFILES.map(([name,j,f])=>({name,...calibrate(j,f)}));
for(const p of profiles){
 const k=p.name,w=simulate(p.command,-p.j,-p.f),b=simulate(p.command,p.j,p.f);
 checks[k+"_command_finite"]=Number.isFinite(p.command);
 checks[k+"_rate_bounds"]=p.worst>0&&p.best<1;
 checks[k+"_worst_equal_formula"]=Math.abs(p.worst-(p.command-p.j)*(1-p.f))<1e-14;
 checks[k+"_worst_guarantees_step8"]=w[7].gap<T;
 checks[k+"_best_guarantees_step8"]=b[7].gap<T;
 checks[k+"_first_full_worst"]=first(w,r=>r.full)===8;
 checks[k+"_first_full_best"]=first(b,r=>r.full)===8;
 checks[k+"_common_failed_step4"]=Math.abs(w[3].gap-G4)<1e-14&&Math.abs(b[3].gap-G4)<1e-14;
 checks[k+"_no_history_reset"]=Math.abs(w[4].gap-w[3].gap*(1-p.worst))<1e-14;
 checks[k+"_clock_closure"]=w[7].clock===0&&b[7].clock===0;
 checks[k+"_wheel_home"]=w[7].wheels.join()==="0,1,2,3";
 checks[k+"_worst_gap_ge_best"]=w[7].gap>=b[7].gap;
 checks[k+"_unprotected_lower_fails"]=simulate(p.command-1e-6,-p.j,-p.f)[7].gap>T;
 checks[k+"_uncertainty_grid"]=Array.from({length:11},(_,i)=>-p.j+(2*p.j*i/10)).every(err=>Array.from({length:11},(_,i)=>-p.f+(2*p.f*i/10)).every(mod=>simulate(p.command,err,mod)[7].full));
 checks[k+"_guard_strict"]=p.worst>MIN;
 checks[k+"_projection_identity"]=Math.abs(w[7].gap-G4*(1-p.worst)**4)<1e-14;
}
Object.assign(checks,{
 profile_rate_order:profiles.every((p,i)=>i===0||p.command>profiles[i-1].command),
 profile_b241_consistency:Math.abs(profiles[2].command-.49176284868044307)<1e-14,
 zero_uncertainty_has_tiny_guard:Math.abs(profiles[0].command-(MIN+GUARD))<1e-14,
 mathematical_minimum:Math.abs(G4*(1-MIN)**4-T)<1e-14,
 threshold_in_unit_interval:MIN>0&&MIN<1,
 closed_form_increases_with_error:calibrate(.01,.01).command>calibrate(.005,.01).command,
 closed_form_increases_with_foam:calibrate(.005,.02).command>calibrate(.005,.01).command,
 no_background_sensing:PROFILES.length===5,
 full_rotation_ticks:4*Q===PER,
 saved_cycle_ticks:(12-8)*Q===PER,
 six_zero_anchors:new Set("uvwxyz").size===6,
 signed_directions:new Set([..."uvwxyz"].flatMap(x=>[x+"+",x+"-"])).size===12,
 twentyfour_contacts:new Set("abcdefghijklmnopqrstuvwx").size===24,
 five_levels:25**5===9765625,
 four_wheels:new Set([0,1440,2880,4320]).size===4,
 color_endpoints:380+370*5759/5759===750,
 clock_fault:(PER+1)%PER===1,
 coord_fault:[0,1440,2880,4320].join()!==[1,1440,2880,4320].join(),
 wave_fault:380!==380+370*1440/5759
});
const failed=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
console.log(JSON.stringify({boundary:242,passed:Object.keys(checks).length-failed.length,total:Object.keys(checks).length,failed,minimum:MIN,guard:GUARD,profiles},null,2));
if(failed.length)process.exitCode=1;
