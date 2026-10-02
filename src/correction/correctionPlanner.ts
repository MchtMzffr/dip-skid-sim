import {An,M,Pt} from '../analysis/geometryAnalysis'
export type Eng={E:number;Fy:number|null;B:number|null;H:number|null;t:number|null;span:number;sb:number}
export const sectionProps=(e:Eng)=>{ if(!(e.B&&e.H&&e.t))return {I:null,Z:null}
 const I=(e.B*e.H**3-(e.B-2*e.t)*(e.H-2*e.t)**3)/12; return {I,Z:I/(e.H/2)}}
export function planCorrection(a:An,eng:Eng,factor:number){
 const {I,Z}=sectionProps(eng); const missing:string[]=[]
 let kind:'none'|'bow'|'twist'='none',problem='Geometri tolerans içinde',press:Pt[]=[],sup:Pt[]=[],target=0
 if(!a.pass){
  const s=Math.abs(a.lb)>=Math.abs(a.rb)?'left':'right', bow=s==='left'?a.lb:a.rb, nm=s==='left'?'Sol':'Sağ'
  if(Math.abs(bow)>=Math.abs(a.twist)/2&&Math.abs(bow)>0){kind='bow';target=Math.abs(bow)
   if(bow>0){problem=`${nm} ray orta bölge yukarı muzlanmış`;press=[{s,i:1}];sup=[{s,i:0},{s,i:2}]}
   else{problem=`${nm} ray orta bölge düşük (ters eğme: uçlar bastırılır, orta destek)`;press=[{s,i:0},{s,i:2}];sup=[{s,i:1}]}}
  else if(Math.abs(a.twist)>0){kind='twist';target=Math.abs(a.twist)/2
   if(a.twist>0){problem='Saat yönü twist (sol ön + sağ arka yüksek)';press=[{s:'left',i:0},{s:'right',i:2}];sup=[{s:'right',i:0},{s:'left',i:2}]}
   else{problem='Saat yönü tersi twist (sağ ön + sol arka yüksek)';press=[{s:'right',i:0},{s:'left',i:2}];sup=[{s:'left',i:0},{s:'right',i:2}]}}
 }
 const stroke=kind==='none'?null:factor*target/(1-eng.sb)
 let k:number|null=null,elastic:number|null=null,yieldF:number|null=null
 if(kind==='bow'){
  if(I&&eng.E){k=48*eng.E*1000*I/eng.span**3/1000; elastic=k*stroke} else missing.push('Atalet momenti I (kesit ölçüleri B,H,t)')
  if(Z&&eng.Fy)yieldF=4*eng.Fy*Z/eng.span/1000; else missing.push(Z?'Akma dayanımı Fy':'Mukavemet momenti Z')
 }
 if(kind==='twist')missing.push('Torsiyonel rijitlik GJ / kalibrasyon')
 const model=kind==='bow'&&k!==null?'ANALYTICAL ESTIMATE':'GEOMETRY ONLY'
 return {kind,problem,press,sup,dir:'DOWN',target,stroke,k,elastic,yieldF,model,missing}}
export type Plan=ReturnType<typeof planCorrection>
export const geometricSimModel=(m:M,pl:Plan,s:number):M=>{const n={left:[...m.left],right:[...m.right]};pl.press.forEach(p=>n[p.s][p.i]-=s);return n}