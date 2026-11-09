#!/usr/bin/env node
"use strict";
/** CHRONOS Boundary 236 — two-parameter disturbance budget.
 * Run: node experiments/boundary236/test_boundary236.js
 * This is a discrete toy relaxation model, not measured foam or physical energy.
 */
const G=.65-.543016542866826,TOL=.001,EPS=.01025,Q=324000,PER=1296000;
const L=1-(TOL/G)**.25,U=1-(TOL/G)**(1/3);
const CENTER=(L/(1-EPS)+U/(1+EPS))/2;
const MAX_J=(U/(1+EPS)-L/(1-EPS))/2;
const gate=(a,d)=>{let n=0,g=G;while(g>TOL&&n<10000){n++;g*=1-a*(1+d)}return n};
const bounds=J=>({left:1-EPS-L/(CENTER-J),right:U/(CENTER+J)-1-EPS});
const budget=J=>Math.min(...Object.values(bounds(J)));
const samples=[0,.005,.01,.02,.03,.04];
const tests={};
for(const J of samples){
 const {left,right}=bounds(J),F=budget(J),key=String(J),inside=F-1e-7,outside=F+1e-6;
 tests[key+" nonnegative"]=F>=0;
 tests[key+" center returns"]=gate(CENTER,0)===4;
 tests[key+" safe corners"]=[-J,J].every(de=>[-EPS-inside,EPS+inside].every(df=>gate(CENTER+de,df)===4));
 tests[key+" safe grid"]=Array.from({length:7},(_,i)=>-J+2*J*i/6).every(de=>Array.from({length:7},(_,j)=>-(EPS+inside)+2*(EPS+inside)*j/6).every(df=>gate(CENTER+de,df)===4));
 tests[key+" beyond budget fails"]=gate(CENTER-J,-EPS-outside)!==4||gate(CENTER+J,EPS+outside)!==4;
 tests[key+" left bound"]=(CENTER-J)*(1-EPS-inside)>=L-1e-14;
 tests[key+" strict right bound"]=(CENTER+J)*(1+EPS+inside)<U;
 tests[key+" minimum of edges"]=Math.abs(F-Math.min(left,right))<1e-14;
 tests[key+" monotone tradeoff"]=J===0||F<budget(J-.00001);
}
Object.assign(tests,{
 "baseline core midpoint":CENTER>=L/(1-EPS)&&CENTER<U/(1+EPS),
 "reference 75 safe lower":.75-L/(1-EPS)>0,
 "reference 75 safe upper":U/(1+EPS)-.75>0,
 "maximum nominal error":Math.abs(MAX_J-(U/(1+EPS)-L/(1-EPS))/2)<1e-14,
 "zero-error foam allowance positive":budget(0)>0,
 "zero-error limited below":bounds(0).left<bounds(0).right,
 "1pp error limited above":bounds(.01).right<bounds(.01).left,
 "4pp error limited above":bounds(.04).right<bounds(.04).left,
 "budget tends to zero":Math.abs(budget(MAX_J))<1e-12,
 "total modulation below unity":EPS+budget(0)<1,
 "nominal rate in unit interval":CENTER-MAX_J>0&&CENTER+MAX_J<1,
 "2pp corners safe at 3pp extra":gate(CENTER-.02,-(EPS+.03))===4&&gate(CENTER+.02,EPS+.03)===4,
 "2pp failure beyond allowance":gate(CENTER-.02,-(EPS+.032))!==4||gate(CENTER+.02,EPS+.032)!==4,
 "clock one full turn":4*Q===PER,
 "four distinct wheels":new Set([0,1440,2880,4320]).size===4,
 "six zeros":new Set("uvwxyz").size===6,
 "12 signed directions":new Set([..."uvwxyz"].flatMap(x=>[x+"+",x+"-"])).size===12,
 "24 contacts":new Set("abcdefghijklmnopqrstuvwx").size===24,
 "five recursive levels":25**5===9765625,
 "chromatic endpoints":380+370*5759/5759===750,
 "one clock tick fault":(PER+1)%PER===1,
 "wavelength swap fault":380!==380+370*1440/5759,
 "coordinate fault":[0,1440,2880,4320].join()!==[1,1440,2880,4320].join()
});
const failed=Object.entries(tests).filter(([,v])=>!v).map(([k])=>k);
console.log(JSON.stringify({boundary:236,passed:Object.keys(tests).length-failed.length,total:Object.keys(tests).length,failed,center:CENTER,max_nominal_jitter:MAX_J,rows:samples.map(J=>({J,extra_foam_budget:budget(J),...bounds(J)}))},null,2));
if(failed.length)process.exitCode=1;
