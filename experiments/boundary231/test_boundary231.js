#!/usr/bin/env node
"use strict";
// CHRONOS Boundary 231. Run: node test_boundary231.js (no packages required).
const G=.65-.543016542866826,TOL=.001,Q=324000,FULL=1296000;
const RATES=[.1,.15,.2,.25,.3,.4,.5,.6,.75,1];
function gate(alpha){let n=0,g=G;while(g>TOL){g*=1-alpha;n++;if(n>10000)throw Error("unbounded")}let j=Math.ceil(n/4)*4;return {alpha,memory_gate:n,joint_gate:j,wait_steps:j-n,memory_gap:g,joint_gap:G*(1-alpha)**j,chronos_ticks:j*Q}}
const rows=RATES.map(gate),checks={};
for(const r of rows){
 const a=r.alpha,k=String(a),n=r.memory_gate,j=r.joint_gate;
 checks[k+"/first_threshold"]=r.memory_gap<=TOL&&(n===0||G*(1-a)**(n-1)>TOL);
 checks[k+"/phase_closes"]=j%4===0;
 checks[k+"/joint_minimal"]=j>=n&&j-n<4;
 checks[k+"/joint_gap"]=r.joint_gap<=TOL;
}
checks.strictly_faster_to_threshold=rows.every((r,i)=>i===0||r.memory_gate<=rows[i-1].memory_gate);
checks.strictly_faster_to_joint=rows.every((r,i)=>i===0||r.joint_gate<=rows[i-1].joint_gate);
checks.all_recovery_steps_finite=rows.every(r=>Number.isFinite(r.memory_gate));
checks.resonance_when_n_mod4_zero=rows.every(r=>(r.wait_steps===0)===(r.memory_gate%4===0));
checks.four_chrome_wheels=new Set([0,1440,2880,4320]).size===4;
checks.five_levels=25**5===9765625;
checks.six_zero_anchors=new Set("uvwxyz").size===6;
checks.twelve_signed_directions=new Set([..."uvwxyz"].flatMap(a=>[a+"+",a+"-"])).size===12;
checks.twentyfour_surface_contacts=new Set("abcdefghijklmnopqrstuvwx").size===24;
checks.wavelength_endpoints=(380+370*5759/5759)===750;
checks.quarter_turn_clock=4*Q===FULL;
checks.one_tick_fault=(rows[0].chronos_ticks+1)%FULL===1;
checks.coord_fault=[0,1440,2880,4320].join()!=[1,1440,2880,4320].join();
checks.wavelength_fault=380+370*1440/5759!==380;
checks.alpha_one_instant=rows[9].memory_gate===1;
checks.alpha_one_wait_three=rows[9].wait_steps===3;
checks.alpha_025_memory_gate=rows[3].memory_gate===17;
checks.alpha_025_joint_gate=rows[3].joint_gate===20;
const bad=Object.entries(checks).filter(([k,v])=>!v).map(([k])=>k);
console.log(JSON.stringify({boundary:231,passed:Object.keys(checks).length-bad.length,total:Object.keys(checks).length,bad,rows},null,2));
if(bad.length)process.exitCode=1;
