import {skidConfig as C} from '../config/skidConfig'
export type Side='left'|'right'
export type M={left:number[];right:number[]}
export type Pt={s:Side;i:number}
export const lbl=(p:Pt)=>`${p.s==='left'?'Sol':'Sağ'} L${p.i+1}`
const det=(m:number[][])=>m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])-m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])+m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0])
export function fitPlane(m:M){
 const P:number[][]=[];(['left','right'] as Side[]).forEach(s=>[0,1,2].forEach(i=>P.push([C.longitudinalPoints[i],C.railY[s],m[s][i]])))
 let sxx=0,sxy=0,sx=0,syy=0,sy=0,sxz=0,syz=0,sz=0;const n=P.length
 P.forEach(([x,y,z])=>{sxx+=x*x;sxy+=x*y;sx+=x;syy+=y*y;sy+=y;sxz+=x*z;syz+=y*z;sz+=z})
 const A=[[sxx,sxy,sx],[sxy,syy,sy],[sx,sy,n]],b=[sxz,syz,sz],D=det(A)
 const rep=(k:number)=>A.map((r,i)=>r.map((v,j)=>j===k?b[i]:v))
 const a=det(rep(0))/D,bb=det(rep(1))/D,c=det(rep(2))/D
 const res=P.map(([x,y,z])=>z-(a*x+bb*y+c))
 return {a,b:bb,c,res}}
export function analyze(m:M,tol:number){
 const lb=m.left[1]-(m.left[0]+m.left[2])/2, rb=m.right[1]-(m.right[0]+m.right[2])/2
 const pl=fitPlane(m), r=pl.res
 const nm:M={left:[r[0],r[1],r[2]],right:[r[3],r[4],r[5]]}
 const cross=[0,1,2].map(i=>nm.right[i]-nm.left[i])
 const twist=cross[2]-cross[0], midTw=cross[1]-(cross[0]+cross[2])/2
 const rigid=Math.max(...m.left,...m.right)-Math.min(...m.left,...m.right)>tol
 const maxPos=Math.max(0,...r),maxNeg=Math.min(0,...r),rms=Math.sqrt(r.reduce((s,v)=>s+v*v,0)/r.length)
 const maxAbs=Math.max(...r.map(Math.abs))
 const pass=maxAbs<=tol&&Math.abs(lb)<=tol&&Math.abs(rb)<=tol&&Math.abs(midTw)<=tol
 const tags:string[]=[]
 const bowSig=Math.abs(lb)>tol||Math.abs(rb)>tol
 const twSig=Math.abs(twist)>tol
 if(Math.abs(lb)>tol)tags.push(lb>0?'LEFT_RAIL_CENTER_HIGH':'LEFT_RAIL_CENTER_LOW')
 if(Math.abs(rb)>tol)tags.push(rb>0?'RIGHT_RAIL_CENTER_HIGH':'RIGHT_RAIL_CENTER_LOW')
 if(Math.abs(twist)>tol)tags.push(twist>0?'CLOCKWISE_TWIST':'COUNTERCLOCKWISE_TWIST')
 if(Math.abs(midTw)>tol)tags.push('MIDDLE_CROSS_TILT')
 if(!tags.some(t=>t.includes('TWIST'))){if(Math.abs(cross[0])>tol)tags.push('FRONT_CROSS_TILT');if(Math.abs(cross[2])>tol)tags.push('REAR_CROSS_TILT')}
 let primary='FLAT'
 if(!pass){
  if(bowSig&&twSig)primary='COMBINED_BOW_AND_TWIST'
  else if(bowSig){
   primary=Math.abs(lb)>=Math.abs(rb)
    ?(lb>0?'LEFT_RAIL_CENTER_HIGH':'LEFT_RAIL_CENTER_LOW')
    :(rb>0?'RIGHT_RAIL_CENTER_HIGH':'RIGHT_RAIL_CENTER_LOW')
  }
  else if(twSig)primary=twist>0?'CLOCKWISE_TWIST':'COUNTERCLOCKWISE_TWIST'
  else if(tags.length>1)primary='COMPLEX_DEFORMATION'
  else primary=tags[0]||'FRONT/REAR_CROSS_TILT'
 }
 return {nm,rigid,lb,rb,cross,twist,midTw,plane:pl,maxPos,maxNeg,p2p:maxPos-maxNeg,rms,maxAbs,pass,primary,secondary:tags.filter(t=>t!==primary)}}
export type An=ReturnType<typeof analyze>