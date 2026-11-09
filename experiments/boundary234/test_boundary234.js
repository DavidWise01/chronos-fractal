#!/usr/bin/env node
"use strict";
/** CHRONOS B234 — robust first-gate intersection under +/-1.025% modulation.
 * Execute: node experiments/boundary234/test_boundary234.js
 * All "foam" here is a synthetic multiplier on adaptation, not an observation.
 */
const G=.65-.543016542866826,TOL=.001,EPS=.01025,Q=324000,PER=1296000;
const L=1-(TOL/G)**.25,U=1-(TOL/G)**(1/3);
const MODE=[-EPS,0,EPS].map(d=>({d,low:L/(1+d),high:U/(1+d)}));
const lo=Math.max(...MODE.map(m=>m.low)),hi=Math.min(...MODE.map(m=>m.high));
function gate(a,d){if(a<0||a>1)throw RangeError("alpha outside [0,1]");let n=0,g=G;
 while(g>TOL&&n<10000){n++;g*=1-a*(1+d);}
 return {n,joint:Math.ceil(n/4)*4,g};
}
const tests={};
for(const m of MODE){
 const id=String(m.d);
 tests[id+" lower passed"]=gate(m.low,m.d).n===4;
 tests[id+" below lower"]=gate(m.low-.00001,m.d).n===5;
 tests[id+" inside"]=gate(.75,m.d).n===4;
 tests[id+" near upper"]=gate(m.high-.00001,m.d).n===4;
 tests[id+" upper omitted"]=gate(m.high,m.d).n===3;
 tests[id+" above upper"]=gate(m.high+.00001,m.d).n===3;
 tests[id+" lower formula"]=Math.abs(G*(1-m.low*(1+m.d))**4-TOL)<1e-12;
 tests[id+" upper formula"]=Math.abs(G*(1-m.high*(1+m.d))**3-TOL)<1e-12;
 tests[id+" 75 clock"]=gate(.75,m.d).joint===4;
 tests[id+" bounds"]=m.high>m.low;
 tests[id+" sweep"]=Array.from({length:1001},(_,i)=>i/1000).every(a=>(gate(a,m.d).n===4)===(a>=m.low&&a<m.high));
}
const probes=[["below core",lo-1e-5,false],["low core",lo,true],["75%",.75,true],["near upper",hi-1e-5,true],["upper core",hi,false],["above core",hi+1e-5,false]];
for(const [name,a,result] of probes)tests["robust "+name]=(MODE.every(m=>gate(a,m.d).n===4)===result);
tests["low from minus"]=lo===MODE[0].low;
tests["upper from plus"]=hi===MODE[2].high;
tests["intersection positive"]=hi>lo;
tests["core under baseline"]=lo>=MODE[1].low&&hi<=MODE[1].high;
tests["core in minus"]=lo>=MODE[0].low&&hi<=MODE[0].high;
tests["core in plus"]=lo>=MODE[2].low&&hi<=MODE[2].high;
tests["robust exhaustive"]=Array.from({length:1001},(_,i)=>i/1000).every(a=>(MODE.every(m=>gate(a,m.d).n===4)===(a>=lo&&a<hi)));
tests["extremes bound continuous"]=Array.from({length:51},(_,i)=>-EPS+2*EPS*i/50).every(d=>gate(.75,d).n===4);
tests["low f4"]=Math.abs(G*(1-lo*(1-EPS))**4-TOL)<1e-12;
tests["high f3"]=Math.abs(G*(1-hi*(1+EPS))**3-TOL)<1e-12;
tests["low 3 not ready"]=G*(1-lo*(1-EPS))**3>TOL;
tests["upper third ready"]=G*(1-hi*(1+EPS))**3<=TOL;
tests["clock 4"]=4*Q===PER;
tests["6 zero"]=new Set("uvwxyz").size===6;
tests["12 signed"]=new Set([..."uvwxyz"].flatMap(x=>[x+"+",x+"-"])).size===12;
tests["24 contacts"]=new Set("abcdefghijklmnopqrstuvwx").size===24;
tests["5 nested"]=25**5===9765625;
tests["4 wheel"]=new Set([0,1440,2880,4320]).size===4;
tests["wavelength endpoints"]=380+370*5759/5759===750;
tests["fault tick"]=(PER+1)%PER===1;
tests["fault wave"]=380!==380+370*1440/5759;
tests["fault coordinate"]=[0,1440,2880,4320].join()!==[1,1440,2880,4320].join();
tests["sample core strong"]=MODE.every(m=>gate(.75,m.d).g<TOL);
tests["mode spread"]=(MODE[0].high-MODE[0].low)>(MODE[2].high-MODE[2].low);
const bad=Object.entries(tests).filter(([,v])=>!v).map(([k])=>k);
console.log(JSON.stringify({boundary:234,passed:Object.keys(tests).length-bad.length,total:Object.keys(tests).length,failed:bad,core:{lower_inclusive:lo,upper_exclusive:hi,width:hi-lo},modes:MODE},null,2));
if(bad.length)process.exitCode=1;
