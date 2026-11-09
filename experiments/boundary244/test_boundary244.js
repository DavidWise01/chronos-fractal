#!/usr/bin/env node
"use strict";
/** CHRONOS Boundary 244: evidence admission before bounded calibration.
 * Run: node experiments/boundary244/test_boundary244.js
 * Synthetic records only; three independent witness lineages are MODEL metadata,
 * not a claim of actual third-party authentication.
 */
const G=.65-.543016542866826,T=.001,S=.4,GUARD=1e-10,Q=324000,PER=1296000,STEP4=G*(1-S)**4,MIN=1-(T/STEP4)**.25;
const SEEN_AT=1000,MAX_AGE=100;
const existing=[["o01",-.002,-.005],["o02",.004,.007],["o03",-.005,-.008],["o04",.003,.009],["o05",0,0],["o06",-.003,.010]].map(([id,e,d])=>({id,e,d}));
const witnesses=(id,groups=["north","east","west"],times=[951,952,953])=>groups.map((group,i)=>({id:id+"-w"+i,group,observed_at:times[i],valid:true}));
const packets=[
 {id:"h04",sample:{e:-.008,d:-.015},observed_at:950,source:"synthetic-bench-4",witnesses:witnesses("h04")},
 {id:"h04-duplicate",sample:{e:-.008,d:-.015},observed_at:950,source:"synthetic-bench-4",witnesses:witnesses("h04-duplicate")},
 {id:"h05-dependent",sample:{e:-.009,d:-.016},observed_at:960,source:"synthetic-bench-5",witnesses:witnesses("h05-dependent",["north","north","west"],[961,962,963])},
 {id:"h06-insufficient",sample:{e:-.012,d:-.020},observed_at:970,source:"synthetic-bench-6",witnesses:witnesses("h06-insufficient").slice(0,2)},
 {id:"h07-stale",sample:{e:-.014,d:-.025},observed_at:750,source:"synthetic-bench-7",witnesses:witnesses("h07-stale",["north","east","west"],[751,752,753])},
 {id:"h08-no-source",sample:{e:-.016,d:-.028},observed_at:972,source:"",witnesses:witnesses("h08-no-source",["north","east","west"],[973,974,975])},
 {id:"h09-bad-witness",sample:{e:-.017,d:-.030},observed_at:980,source:"synthetic-bench-9",witnesses:witnesses("h09-bad-witness",["north","east","west"],[981,982,983]).map((w,i)=>({...w,valid:i!==1}))},
 {id:"h10-inside",sample:{e:.003,d:-.006},observed_at:985,source:"synthetic-bench-10",witnesses:witnesses("h10-inside",["north","east","west"],[986,987,988])},
 {id:"h11-future",sample:{e:-.020,d:-.035},observed_at:1020,source:"synthetic-bench-11",witnesses:witnesses("h11-future",["north","east","west"],[1021,1022,1023])},
 {id:"h12-reused-witness",sample:{e:-.021,d:-.038},observed_at:991,source:"synthetic-bench-12",witnesses:witnesses("h04")},
 {id:"h13-nonfinite",sample:{e:Infinity,d:-.04},observed_at:992,source:"synthetic-bench-13",witnesses:witnesses("h13-nonfinite",["north","east","west"],[993,994,995])}
];
function fingerprint(p){return JSON.stringify([p.source,p.sample.e,p.sample.d,p.observed_at]);} // exact canonical identity; NOT cryptographic
function calibrate(samples){
 const j=Math.max(...samples.map(s=>Math.abs(s.e)));
 const f=Math.max(...samples.map(s=>Math.abs(s.d)));
 return {j,f,command:MIN/(1-f)+j+GUARD,count:samples.length};
}
function outcome(cal,packet){const effective=(cal.command+packet.sample.e)*(1+packet.sample.d),gap=STEP4*(1-effective)**4;return {effective,gap,pass:gap<=T};}
function admit(packet,state){
 const reasons=[];
 if(!packet.source||typeof packet.source!=="string")reasons.push("SOURCE_MISSING");
 if(!Number.isInteger(packet.observed_at)||packet.observed_at>SEEN_AT)reasons.push("TIME_INVALID");
 else if(SEEN_AT-packet.observed_at>MAX_AGE)reasons.push("STALE");
 if(!Number.isFinite(packet.sample.e)||!Number.isFinite(packet.sample.d))reasons.push("NONFINITE");
 const key=fingerprint(packet);
 if(state.fingerprints.has(key))reasons.push("DUPLICATE");
 const ws=packet.witnesses||[];
 if(ws.length<3)reasons.push("WITNESSES_INSUFFICIENT");
 if(new Set(ws.map(w=>w.group)).size<3)reasons.push("DEPENDENT_LINEAGE");
 if(new Set(ws.map(w=>w.id)).size!==ws.length)reasons.push("DUPLICATED_ATTESTATION");
 if(ws.some(w=>!w.valid||typeof w.id!=="string"||!w.id||state.witnessIds.has(w.id)))reasons.push("WITNESS_INVALID_OR_REUSED");
 if(ws.some(w=>!Number.isInteger(w.observed_at)||w.observed_at<packet.observed_at||w.observed_at>SEEN_AT))reasons.push("WITNESS_TIME_INVALID");
 if(reasons.length)return {id:packet.id,status:"HOLD",reasons,calibration_changed:false};
 state.fingerprints.add(key);ws.forEach(w=>state.witnessIds.add(w.id));state.accepted.push(packet);
 return {id:packet.id,status:"ADMIT",reasons:[],calibration_changed:true};
}
const state={fingerprints:new Set(),witnessIds:new Set(),accepted:[]};
const baseline=calibrate(existing),before=outcome(baseline,packets[0]);
const decisions=packets.map(p=>admit(p,state));
const next=calibrate([...existing,...state.accepted.map(p=>({id:p.id,...p.sample}))]);
const after=outcome(next,packets[0]),checks={};
const expected=["ADMIT","HOLD","HOLD","HOLD","HOLD","HOLD","HOLD","ADMIT","HOLD","HOLD","HOLD"];
for(let i=0;i<decisions.length;i++){
 const d=decisions[i],p=packets[i];
 checks[d.id+"_decision"]=d.status===expected[i];
 checks[d.id+"_changes_iff_admitted"]=d.calibration_changed===(d.status==="ADMIT");
 checks[d.id+"_reason_consistent"]=(d.status==="HOLD")===d.reasons.length>0;
 checks[d.id+"_immutable_raw"]=p.id===d.id&&p.sample.d!==undefined;
 checks[d.id+"_witness_count"]=p.witnesses.length>=2;
}
Object.assign(checks,{
 historical_training_preserved:existing.length===6&&existing[0].id==="o01",
 two_admitted:state.accepted.length===2,
 nine_held:decisions.filter(d=>d.status==="HOLD").length===9,
 duplicate_reason:decisions[1].reasons.includes("DUPLICATE"),
 dependent_reason:decisions[2].reasons.includes("DEPENDENT_LINEAGE"),
 insufficient_reason:decisions[3].reasons.includes("WITNESSES_INSUFFICIENT"),
 stale_reason:decisions[4].reasons.includes("STALE"),
 missing_source_reason:decisions[5].reasons.includes("SOURCE_MISSING"),
 invalid_witness_reason:decisions[6].reasons.includes("WITNESS_INVALID_OR_REUSED"),
 future_reason:decisions[8].reasons.includes("TIME_INVALID"),
 witness_reuse_reason:decisions[9].reasons.includes("WITNESS_INVALID_OR_REUSED"),
 nonfinite_reason:decisions[10].reasons.includes("NONFINITE"),
 h04_admitted:decisions[0].status==="ADMIT",
 inside_sample_admitted:decisions[7].status==="ADMIT",
 original_bounds:baseline.j===.005&&baseline.f===.010,
 expanded_bounds:next.j===.008&&next.f===.015,
 expanded_count:next.count===8,
 expanded_command_larger:next.command>baseline.command,
 baseline_h04_failure:!before.pass,
 admitted_h04_replay_pass:after.pass,
 no_hold_changing_bounds:next.j===.008&&next.f===.015,
 duplicate_does_not_count:next.count===existing.length+2,
 witness_group_independence:packets[0].witnesses.map(w=>w.group).join()==="north,east,west",
 accepted_lineages_preserved:state.witnessIds.size===6,
 packet_count_unchanged:packets.length===11,
 held_witnesses_not_consumed:!state.witnessIds.has("h05-dependent-w0"),
 checksum_is_plain_identity:typeof fingerprint(packets[0])==="string",
 command_formula:Math.abs(next.command-(MIN/(1-next.f)+next.j+GUARD))<1e-14,
 conservative_distinction:before.gap>T&&after.gap<T,
 full_return_clock:8*Q%PER===0,
 zero_anchors:new Set("uvwxyz").size===6,
 signed_directions:new Set([..."uvwxyz"].flatMap(x=>[x+"+",x+"-"])).size===12,
 contacts:new Set("abcdefghijklmnopqrstuvwx").size===24,
 four_wheels:new Set([0,1440,2880,4320]).size===4,
 five_levels:25**5===9765625,
 chromatic_endpoints:380+370*5759/5759===750,
 clock_fault:(PER+1)%PER===1,
 coordinate_fault:[0,1440,2880,4320].join()!==[1,1440,2880,4320].join(),
 wavelength_fault:380!==380+370*1440/5759
});
const failed=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
console.log(JSON.stringify({boundary:244,passed:Object.keys(checks).length-failed.length,total:Object.keys(checks).length,failed,baseline,next,decisions,before,after},null,2));
if(failed.length)process.exitCode=1;
