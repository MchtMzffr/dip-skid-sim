import {useMemo,useState} from 'react'
import SkidScene from './components/SkidScene'
import {analyze, M} from './analysis/geometryAnalysis'
import {planCorrection} from './correction/correctionPlanner'

const initial:M={left:[0,0,0],right:[0,0,0]}
const eng={E:210,Fy:null,B:null,H:null,t:null,span:5100,sb:.3}

export default function App(){
 const [m,setM]=useState<M>(initial)
 const [tol,setTol]=useState(.5)
 const [vis,setVis]=useState(20)
 const [view,setView]=useState('persp')
 const a=useMemo(()=>analyze(m,tol),[m,tol])
 const pl=useMemo(()=>planCorrection(a,eng,.5),[a])
 const set=(side:'left'|'right',i:number,v:string)=>{
  const n={left:[...m.left],right:[...m.right]}
  n[side][i]=Number(v)||0
  setM(n)
 }
 return <div className="app">
  <div className="p">
   <h3>ÖLÇÜMLER (mm)</h3>
   <div className="card">
    <table><thead><tr><th></th><th>L1</th><th>L2</th><th>L3</th></tr></thead>
    <tbody>
     <tr><td>Sol</td>{m.left.map((v,i)=><td key={i}><input type="number" step=".1" value={v} onChange={e=>set('left',i,e.target.value)}/></td>)}</tr>
     <tr><td>Sağ</td>{m.right.map((v,i)=><td key={i}><input type="number" step=".1" value={v} onChange={e=>set('right',i,e.target.value)}/></td>)}</tr>
    </tbody></table>
   </div>
   <div className="card">
    Tolerans <input type="number" step=".1" value={tol} onChange={e=>setTol(Number(e.target.value)||0)}/> mm
   </div>
   <div className="card">
    Görsel çarpan <input type="number" min="1" max="100" value={vis} onChange={e=>setVis(Number(e.target.value)||1)}/>x
   </div>
   <div className="card">
    <button onClick={()=>setM(initial)}>Sıfırla</button>
    <button onClick={()=>setView('persp')}>3D</button>
    <button onClick={()=>setView('top')}>Üst</button>
    <button onClick={()=>setView('front')}>Ön</button>
    <button onClick={()=>setView('side')}>Yan</button>
   </div>
  </div>

  <div style={{position:'relative'}}>
   <SkidScene m={m} vis={vis} plan={pl} s={0} view={view} showArrows={!a.pass}/>
   <div style={{position:'absolute',left:10,bottom:10,background:'#0009',padding:8,fontSize:11}}>
    Animasyon = geometrik simülasyon
   </div>
  </div>

  <div className="p">
   <h3>GEOMETRİ ANALİZİ</h3>
   <div className="card">
    <div className={a.pass?'g':'r'}><b>{a.pass?'PASS':'FAIL'}</b></div>
    <div>Primary: {a.primary}</div>
    {a.secondary.length>0&&<div>Secondary: {a.secondary.join(', ')}</div>}
   </div>
   <div className="card">
    <div>Sol bow: {a.lb.toFixed(3)} mm</div>
    <div>Sağ bow: {a.rb.toFixed(3)} mm</div>
    <div>Twist: {a.twist.toFixed(3)} mm</div>
    <div>Middle cross tilt: {a.midTw.toFixed(3)} mm</div>
    <div>Max +: {a.maxPos.toFixed(3)} mm</div>
    <div>Max -: {a.maxNeg.toFixed(3)} mm</div>
    <div>P2P: {a.p2p.toFixed(3)} mm</div>
    <div>RMS: {a.rms.toFixed(3)} mm</div>
   </div>
   <h3>DÜZELTME PLANI</h3>
   <div className="card">
    <div>{pl.problem}</div>
    <div>Model: {pl.model}</div>
    <div>Hedef: {pl.target.toFixed(3)} mm</div>
    <div>Geometrik stroke: {pl.stroke==null?'-':pl.stroke.toFixed(3)+' mm'}</div>
    {pl.elastic!=null&&<div>Elastic reaction estimate: {pl.elastic.toFixed(2)} kN</div>}
    {pl.missing.length>0&&<div className="w">Eksik: {pl.missing.join(', ')}</div>}
   </div>
  </div>
 </div>
}