import {M,Pt,lbl} from '../analysis/geometryAnalysis'
export interface CalRec{id:string;skidNo:string;ts:string;key:string;kind:string;press:Pt[];sup:Pt[];before:M;after:M;err0:number;err1:number;force:number;stroke:number;hold:number;perm:number;sb:number}
const bow=(m:M,s:'left'|'right')=>m[s][1]-(m[s][0]+m[s][2])/2
type PL={kind:string;press:Pt[];sup:Pt[]}
export const errOf=(m:M,pl:PL)=>{
 if(pl.kind==='bow'){const b=bow(m,pl.press[0].s);return pl.press.length===1?b:-b}
 if(pl.kind==='twist'){const tw=(m.right[2]-m.left[2])-(m.right[0]-m.left[0]);return (pl.press[0].s==='left'?tw:-tw)/2}
 return 0}
export const keyOf=(pl:PL)=>pl.kind+'|P:'+pl.press.map(lbl).sort().join('+')+'|S:'+pl.sup.map(lbl).sort().join('+')+'|DOWN'
export const makeRec=(pl:PL,before:M,after:M,force:number,stroke:number,hold:number,skidNo:string):CalRec=>{
 const e0=errOf(before,pl),e1=errOf(after,pl),perm=e0-e1
 const id=typeof crypto!=='undefined'&&'randomUUID' in crypto?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`
 return {id,skidNo,ts:new Date().toISOString(),key:keyOf(pl),kind:pl.kind,press:pl.press,sup:pl.sup,before,after,err0:e0,err1:e1,force,stroke,hold,perm,sb:stroke>0?1-perm/stroke:0}}
const rng=(v:number[])=>[Math.min(...v),Math.max(...v)]
export function recommend(recs:CalRec[],pl:PL,err0:number,factor:number,limit:number|null):any{
 const ms=recs.filter(r=>r.key===keyOf(pl)&&r.stroke>0&&r.force>=0&&Number.isFinite(r.perm)),n=ms.length
 const mode=n===0?'GEOMETRY ONLY':n<3?'CALIBRATION INSUFFICIENT':n<5?'INTERPOLATION MODE':'CALIBRATED REGRESSION'
 const base:any={mode,n,fr:n?rng(ms.map(r=>r.force)):null,sr:n?rng(ms.map(r=>r.stroke)):null,ok:false,outside:false}
 if(n<3||pl.kind==='none'||err0<=0)return base
 const target=factor*err0
 const w=ms.map(r=>1/(Math.abs(r.err0-err0)+.1)),W=w.reduce((x,y)=>x+y,0)
 const eff=ms.reduce((s,r,i)=>s+w[i]*(r.perm/r.stroke),0)/W
 const kF=ms.reduce((s,r,i)=>s+w[i]*(r.force/r.stroke),0)/W
 if(!Number.isFinite(eff)||eff<=0||!Number.isFinite(kF)||kF<=0)return base
 let predictPerm=(stroke:number)=>eff*stroke
 let stroke=target/eff
 if(n>=5){
  let s11=0,s12=0,s22=0,t1=0,t2=0
  ms.forEach(r=>{s11+=r.stroke**2;s12+=r.stroke*r.err0;s22+=r.err0**2;t1+=r.stroke*r.perm;t2+=r.err0*r.perm})
  const d=s11*s22-s12*s12
  if(Math.abs(d)>1e-9){
   const a=(t1*s22-t2*s12)/d,b=(t2*s11-t1*s12)/d
   if(a>0){
    predictPerm=(s:number)=>a*s+b*err0
    stroke=(target-b*err0)/a
   }
  }
 }
 if(!Number.isFinite(stroke)||stroke<=0)return base
 let force=kF*stroke
 if(force<base.fr[0]||force>base.fr[1])return {...base,outside:true,force,stroke}
 const capped=limit!=null&&force>limit
 if(capped){force=limit as number;stroke=force/kF}
 const rawPerm=predictPerm(stroke)
 const perm=Math.max(0,Math.min(err0,Number.isFinite(rawPerm)?rawPerm:0))
 const springback=stroke-perm
 const final=Math.max(0,err0-perm)
 return {...base,ok:true,force,stroke,perm,springback,final,capped,target}
}