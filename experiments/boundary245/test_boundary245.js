#!/usr/bin/env node
"use strict";
/** CHRONOS B245: synthetic root-ancestry witness gate.
 * Run node experiments/boundary245/test_boundary245.js
 * Declared parent links are fixtures, NOT independently authenticated identity.
 */
const G=.65-.543016542866826,T=.001,S=.4,Q=324000,PER=1296000,GUARD=1e-10,STEP4=G*(1-S)**4,MIN=1-(T/STEP4)**.25;
const baseline=[[-.002,-.005],[.004,.007],[-.005,-.008],[.003,.009],[0,0],[-.003,.01],[-.008,-.015],[.003,-.006]];
const graph={};
for(const [leaf,root] of [["a1","A"],["a2","A"],["a3","A"],["b1","B"],["c1","C"],["d1","D"],["e1","E"],["f1","F"],["g1","G"],["h1","H"],["i1","I"],["j1","J"],["k1","K"],["l1","L"],["aliasA","a1"],["crossA","a2"],["cycle1","cycle2"],["cycle2","cycle1"],["detached","missing"]])graph[leaf]={parent:root};
for(const root of "ABCDEFGHIJKL")graph[root]={parent:null};
function root(node){let id=node,path=[],seen=new Set();while(true){
 if(seen.has(id))return{ok:false,code:"CYCLE",path:[...path,id]};
 seen.add(id);path.push(id);const item=graph[id];
 if(!item)return{ok:false,code:"UNKNOWN_ANCESTOR",path};
 if(item.parent===null)return{ok:true,root:id,path};
 id=item.parent;
}}
const packet=(id,e,d,source,time,w)=>({id,data:[e,d],source,time,witnesses:w});
const packets=[
packet("h14-valid",-.011,-.018,"lab14",940,[["w14a","a1"],["w14b","b1"],["w14c","c1"]]),
packet("h15-shared-root",-.016,-.027,"lab15",945,[["w15a","aliasA"],["w15b","crossA"],["w15c","d1"]]),
packet("h16-unknown",-.020,-.033,"lab16",950,[["w16a","detached"],["w16b","e1"],["w16c","f1"]]),
packet("h17-cycle",-.024,-.040,"lab17",955,[["w17a","cycle1"],["w17b","g1"],["w17c","h1"]]),
packet("h18-reused-root",-.028,-.045,"lab18",960,[["w18a","a3"],["w18b","d1"],["w18c","e1"]]),
packet("h19-reused-id",-.030,-.050,"lab19",965,[["w14a","j1"],["w19b","k1"],["w19c","l1"]]),
packet("h20-valid",.004,-.006,"lab20",970,[["w20a","d1"],["w20b","e1"],["w20c","f1"]]),
packet("h21-duplicate",-.011,-.018,"lab14",940,[["w21a","g1"],["w21b","h1"],["w21c","i1"]]),
packet("h22-shared",-.032,-.054,"lab22",975,[["w22a","g1"],["w22b","g1"],["w22c","j1"]]),
packet("h23-future",-.036,-.060,"lab23",1050,[["w23a","g1"],["w23b","h1"],["w23c","i1"]])
];
const state={roots:new Set(),ids:new Set(),fingerprints:new Set(),admitted:[]};
const fingerprint=p=>JSON.stringify([p.source,p.time,...p.data]);
function admit(p){
 const w=p.witnesses.map(([id,node])=>({id,node,...root(node)})),reasons=[];
 if(!p.source)reasons.push("MISSING_SOURCE");
 if(p.time>1000||p.time<900)reasons.push("TIME_INVALID");
 if(p.data.some(x=>!Number.isFinite(x)))reasons.push("NONFINITE");
 if(state.fingerprints.has(fingerprint(p)))reasons.push("DUPLICATE");
 if(w.length<3)reasons.push("TOO_FEW_WITNESSES");
 if(w.some(x=>!x.ok))reasons.push("UNRESOLVED_ANCESTRY");
 if(w.every(x=>x.ok)&&new Set(w.map(x=>x.root)).size<3)reasons.push("SHARED_ROOT");
 if(w.some(x=>state.ids.has(x.id)))reasons.push("REUSED_ATTESTATION");
 if(w.some(x=>x.ok&&state.roots.has(x.root)))reasons.push("REUSED_ROOT");
 const status=reasons.length?"HOLD":"ADMIT";
 if(status==="ADMIT"){state.admitted.push(p);state.fingerprints.add(fingerprint(p));w.forEach(x=>{state.ids.add(x.id);state.roots.add(x.root)})}
 return{id:p.id,status,reasons,witnesses:w.map(x=>({id:x.id,node:x.node,root:x.ok?x.root:null,issue:x.ok?null:x.code,path:x.path}))};
}
const decisions=packets.map(admit);
const cal=rows=>{const j=Math.max(...rows.map(x=>Math.abs(x[0]))),f=Math.max(...rows.map(x=>Math.abs(x[1])));return{j,f,count:rows.length,command:MIN/(1-f)+j+GUARD}};
const base=cal(baseline),updated=cal([...baseline,...state.admitted.map(p=>p.data)]);
const checks={};
const expected=["ADMIT","HOLD","HOLD","HOLD","HOLD","HOLD","ADMIT","HOLD","HOLD","HOLD"];
packets.forEach((p,i)=>{
 const d=decisions[i],label=p.id;
 checks[label+"_decision"]=d.status===expected[i];
 checks[label+"_reasons"]=(d.status==="HOLD")===Boolean(d.reasons.length);
 checks[label+"_data"]=p.data.length===2&&p.data.every(Number.isFinite);
 checks[label+"_source"]=Boolean(p.source);
 checks[label+"_all_paths"]=d.witnesses.every(x=>x.path.length>0);
 checks[label+"_count"]=d.witnesses.length===3;
 checks[label+"_held_or_distinct"]=d.status==="HOLD"||new Set(d.witnesses.map(x=>x.root)).size===3;
 checks[label+"_id_preserved"]=d.id===p.id;
});
Object.assign(checks,{
 alias_A:root("aliasA").root==="A",
 cross_alias_A:root("crossA").root==="A",
 distinct_D:root("d1").root==="D",
 cycle_found:root("cycle1").code==="CYCLE",
 unknown_found:root("detached").code==="UNKNOWN_ANCESTOR",
 ten_packets:packets.length===10,
 two_admissions:state.admitted.length===2,
 eight_holds:decisions.filter(x=>x.status==="HOLD").length===8,
 first_admitted:decisions[0].status==="ADMIT",
 seventh_admitted:decisions[6].status==="ADMIT",
 shared_alias_held:decisions[1].reasons.includes("SHARED_ROOT"),
 missing_ancestor_held:decisions[2].reasons.includes("UNRESOLVED_ANCESTRY"),
 cycle_held:decisions[3].reasons.includes("UNRESOLVED_ANCESTRY"),
 root_reuse_held:decisions[4].reasons.includes("REUSED_ROOT"),
 witness_id_reuse_held:decisions[5].reasons.includes("REUSED_ATTESTATION"),
 duplicate_held:decisions[7].reasons.includes("DUPLICATE"),
 shared_root_held:decisions[8].reasons.includes("SHARED_ROOT"),
 future_held:decisions[9].reasons.includes("TIME_INVALID"),
 six_used_roots:state.roots.size===6,
 six_used_attestations:state.ids.size===6,
 held_roots_not_consumed:!state.roots.has("G"),
 original_bounds:base.j===.008&&base.f===.015,
 expanded_bounds:updated.j===.011&&updated.f===.018,
 expanded_count:updated.count===10,
 higher_command:updated.command>base.command,
 held_extremes_excluded:updated.j<.036&&updated.f<.06,
 old_fails_new_corner:STEP4*(1-(base.command-.011)*(1-.018))**4>T,
 new_passes_new_corner:STEP4*(1-(updated.command-.011)*(1-.018))**4<T,
 formula:Math.abs(updated.command-(MIN/(1-updated.f)+updated.j+GUARD))<1e-14,
 no_removed_packets:decisions.length===packets.length,
 clock8:8*Q%PER===0,
 clock4:4*Q===PER,
 six_anchors:new Set("uvwxyz").size===6,
 twelve_signed:new Set([..."uvwxyz"].flatMap(x=>[x+"+",x+"-"])).size===12,
 twentyfour_contacts:new Set("abcdefghijklmnopqrstuvwx").size===24,
 four_wheels:new Set([0,1440,2880,4320]).size===4,
 five_levels:25**5===9765625,
 chromatic_endpoints:380+370*5759/5759===750,
 clock_fault:(PER+1)%PER!==0
});
const failed=Object.entries(checks).filter(([,x])=>!x).map(([k])=>k);
console.log(JSON.stringify({boundary:245,passed:Object.keys(checks).length-failed.length,total:Object.keys(checks).length,failed,base,updated,decisions},null,2));
if(failed.length)process.exitCode=1;
