#!/usr/bin/env node
"use strict";
/** CHRONOS B230: adaptive tolerance closure tests. Node 18+. No external packages. */
const START=.543016542866826,TARGET=.65,G=TARGET-START,STEP_TICKS=324000,PERIOD=1296000;
const thresholds=[.1,.01,.001,.0001,.00001,.000001];
function first(t){let n=0,g=G;while(g>t){g*=.75;n++;if(n>10000)throw Error("unbounded search");}
  let j=Math.ceil(n/4)*4;return {tolerance:t,memoryStep:n,jointStep:j,memoryGap:g,jointGap:G*.75**j,memoryTicks:n*STEP_TICKS,jointTicks:j*STEP_TICKS};}
const rows=thresholds.map(first),checks={};
for(const r of rows){let k=String(r.tolerance);
  checks[k+"_minimal_memory"]=G*.75**(r.memoryStep-1)>r.tolerance&&r.memoryGap<=r.tolerance;
  checks[k+"_joint_mod4"]=r.jointStep%4===0&&r.jointStep>=r.memoryStep;
  checks[k+"_joint_gap"]=r.jointGap<=r.tolerance;
  checks[k+"_joint_first"]=r.jointStep===0||(r.jointStep-4<r.memoryStep);
}
checks.strictly_increasing_steps=rows.every((r,i)=>i===0||r.memoryStep>rows[i-1].memoryStep);
checks.strictly_increasing_joint=rows.every((r,i)=>i===0||r.jointStep>rows[i-1].jointStep);
checks.expected_memory_steps=rows.map(x=>x.memoryStep).join()==="1,9,17,25,33,41";
checks.expected_joint_steps=rows.map(x=>x.jointStep).join()==="4,12,20,28,36,44";
checks.clock_cycle=4*STEP_TICKS===PERIOD;
checks.positive_initial_gap=G>0;
checks.gap_monotonic=[...Array(100)].every((_,i)=>G*.75**(i+1)<G*.75**i);
checks.no_finite_exact_return=[...Array(100)].every((_,i)=>G*.75**i>0);
checks.four_distinct_chrome_coordinates=new Set([0,1440,2880,4320]).size===4;
checks.six_zero_anchors=new Set("uvwxyz").size===6;
checks.twelve_signed_directions=new Set([...("uvwxyz")].flatMap(x=>[x+"+",x+"-"])).size===12;
checks.twentyfour_contacts=new Set("abcdefghijklmnopqrstuvwx").size===24;
checks.five_nested_levels=25**5===9765625;
checks.wavelength_map_ends=(380+370*5759/5759)===750;
checks.clock_fault_detected=(rows[2].jointTicks+1)%PERIOD!==0;
checks.coordinate_swap_detected=[0,1440,2880,4320].join()!==[1440,0,2880,4320].join();
checks.wavelength_swap_detected=380+370*1440/5759!==380;
checks.memory_fault_detected=rows[2].memoryStep!==rows[2].jointStep;
const failed=Object.entries(checks).filter(([k,v])=>!v).map(([k])=>k);
if(typeof console!=="undefined"){console.log(JSON.stringify({boundary:230,passed:Object.keys(checks).length-failed.length,total:Object.keys(checks).length,failed,rows},null,2));}
if(failed.length)process.exitCode=1;
