import {Canvas,useThree} from '@react-three/fiber'
import {OrbitControls,Html} from '@react-three/drei'
import {useEffect,useMemo} from 'react'
import * as THREE from 'three'
import {skidConfig as C} from '../config/skidConfig'
import {M,Pt,Side} from '../analysis/geometryAnalysis'
import {Plan} from '../correction/correctionPlanner'
const X=(x:number)=>(x-2550)/1000
const lag=(v:number[],x:number)=>{const [x0,x1,x2]=C.longitudinalPoints
 return v[0]*(x-x1)*(x-x2)/((x0-x1)*(x0-x2))+v[1]*(x-x0)*(x-x2)/((x1-x0)*(x1-x2))+v[2]*(x-x0)*(x-x1)/((x2-x0)*(x2-x1))}
function Rig({view}:{view:string}){const {camera}=useThree()
 useEffect(()=>{const v:any={persp:[3,2.5,5],top:[0,8,.01],front:[0,1.2,8],side:[8,1,0.01]}
  camera.position.set(...(v[view] as [number,number,number]));camera.lookAt(0,0,0)},[view]);return null}
function Rail({s,m,vis}:{s:Side;m:number[];vis:number}){
 const g=useMemo(()=>{const pts=[];for(let i=0;i<=40;i++){const x=C.length*i/40;pts.push(new THREE.Vector3(X(x),lag(m,x)*vis/1000+0.05,C.railY[s]/1000))}
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),80,0.035,8,false)},[m.join(),vis])
 return <mesh geometry={g}><meshStandardMaterial color={s==='left'?'#6a8fb8':'#8fb86a'}/></mesh>}
function Arrow({p,down,color,y}:{p:[number,number,number];down:boolean;color:string;y:number}){
 return <group position={[p[0],y,p[2]]} rotation={[down?Math.PI:0,0,0]}>
  <mesh position={[0,.3,0]}><cylinderGeometry args={[.025,.025,.5]}/><meshStandardMaterial color={color}/></mesh>
  <mesh position={[0,-.05,0]}><coneGeometry args={[.08,.2,12]}/><meshStandardMaterial color={color}/></mesh></group>}
export default function SkidScene({m,vis,plan,s,view,showArrows}:{m:M;vis:number;plan:Plan;s:number;view:string;showArrows:boolean}){
 const pos=(p:Pt):[number,number,number]=>[X(C.longitudinalPoints[p.i]),m[p.s][p.i]*vis/1000+0.05,C.railY[p.s]/1000]
 return <Canvas camera={{fov:45}} style={{background:'#10151b'}}>
  <Rig view={view}/><ambientLight intensity={.7}/><directionalLight position={[3,6,4]} intensity={1.2}/>
  <OrbitControls makeDefault/><gridHelper args={[10,20,'#345','#223']} position={[0,-.3,0]}/>
  <mesh rotation={[-Math.PI/2,0,0]}><planeGeometry args={[5.6,1.4]}/><meshStandardMaterial color="#888" transparent opacity={.25} side={2}/></mesh>
  <Rail s="left" m={m.left} vis={vis}/><Rail s="right" m={m.right} vis={vis}/>
  {[0,1,2].map(i=>{const a=pos({s:'left',i}),b=pos({s:'right',i});return <mesh key={i} position={[a[0],(a[1]+b[1])/2,0]} rotation={[Math.atan2(b[1]-a[1],.9),0,0]}><boxGeometry args={[.06,.06,.9]}/><meshStandardMaterial color="#aaa"/></mesh>})}
  {(['left','right'] as Side[]).flatMap(sd=>[0,1,2].map(i=>{const p=pos({s:sd,i});return <group key={sd+i} position={p}><mesh><sphereGeometry args={[.06]}/><meshStandardMaterial color="#3b82f6"/></mesh>
   <Html distanceFactor={8} style={{color:'#9cf',fontSize:12,pointerEvents:'none'}}>{(sd==='left'?'Sol':'Sağ')} L{i+1}: {m[sd][i].toFixed(1)}</Html></group>}))}
  {showArrows&&plan.press.map((p,k)=>{const q=pos(p);return <group key={'p'+k}><Arrow p={q} down color="#ef4444" y={q[1]+.15}/>
   <mesh position={[q[0],q[1]+.95,q[2]]}><cylinderGeometry args={[.08,.08,.8]}/><meshStandardMaterial color="#b91c1c"/></mesh></group>})}
  {showArrows&&plan.sup.map((p,k)=>{const q=pos(p);return <group key={'s'+k}><Arrow p={q} down={false} color="#22c55e" y={-.25}/>
   <mesh position={[q[0],-.15,q[2]]}><cylinderGeometry args={[.06,.09,.25]}/><meshStandardMaterial color="#16a34a"/></mesh></group>})}
  <mesh position={[0,-.35,0]}><boxGeometry args={[5.6,.1,1.5]}/><meshStandardMaterial color="#444"/></mesh>
 </Canvas>}