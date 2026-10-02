import {describe,it,expect} from 'vitest'
import {analyze} from '../analysis/geometryAnalysis'
import {planCorrection} from '../correction/correctionPlanner'
import {isOvershoot} from '../correction/autoCorrection'
import {recommend,CalRec,keyOf} from '../correction/calibrationModel'
const eng={E:210,Fy:null,B:null,H:null,t:null,span:5100,sb:.3}
const P=(l:number[],r:number[])=>{const a=analyze({left:l,right:r},.5);return {a,pl:planCorrection(a,eng,.5)}}
describe('logic',()=>{
 it('1 left center high',()=>{const {a,pl}=P([0,3,0],[0,0,0]);expect(a.primary).toBe('LEFT_RAIL_CENTER_HIGH');expect(pl.press).toEqual([{s:'left',i:1}]);expect(pl.sup).toEqual([{s:'left',i:0},{s:'left',i:2}])})
 it('2 right center high',()=>expect(P([0,0,0],[0,4,0]).a.primary).toBe('RIGHT_RAIL_CENTER_HIGH'))
 it('3 twist diagonal',()=>{const {a,pl}=P([3,2,0],[0,1,3]);expect(a.primary).toContain('TWIST');expect(pl.press).toEqual([{s:'left',i:0},{s:'right',i:2}]);expect(pl.sup).toEqual([{s:'right',i:0},{s:'left',i:2}])})
 it('4 flat',()=>{const {a,pl}=P([0,0,0],[0,0,0]);expect(a.pass).toBe(true);expect(pl.press).toEqual([])})
 it('5 rigid offset is not deformation',()=>{const {a,pl}=P([2,2,2],[0,0,0]);expect(a.pass).toBe(true);expect(a.primary).toBe('FLAT');expect(pl.kind).toBe('none')})
 it('6 middle cross tilt alone is not twist',()=>{const a=analyze({left:[0,3,0],right:[0,0,0]},.5);expect(a.twist).toBeCloseTo(0);expect(a.primary).toBe('LEFT_RAIL_CENTER_HIGH');expect(a.secondary).toContain('MIDDLE_CROSS_TILT')})
 it('7 overshoot',()=>{expect(isOvershoot(1,-.6)).toBe(true);expect(isOvershoot(1,.4)).toBe(false)})
 it('8 force cap recomputes permanent correction and final error',()=>{
  const pl={kind:'bow',press:[{s:'left' as const,i:1}],sup:[{s:'left' as const,i:0},{s:'left' as const,i:2}]}
  const key=keyOf(pl), before={left:[0,4,0],right:[0,0,0]}, after={left:[0,2,0],right:[0,0,0]}
  const samples=[[20,.8],[50,2],[100,4]]
  const recs:CalRec[]=samples.map(([force,stroke],i):CalRec=>({id:String(i),skidNo:String(i),ts:'2026-01-01T00:00:00Z',key,kind:'bow',press:pl.press,sup:pl.sup,before,after,err0:4,err1:4-stroke,force,stroke,hold:1,perm:stroke,sb:0}))
  const r=recommend(recs,pl,4,1,25)
  expect(r.ok).toBe(true);expect(r.capped).toBe(true);expect(r.force).toBeCloseTo(25);expect(r.stroke).toBeCloseTo(1);expect(r.perm).toBeCloseTo(1);expect(r.springback).toBeCloseTo(0);expect(r.final).toBeCloseTo(3)
 })
})