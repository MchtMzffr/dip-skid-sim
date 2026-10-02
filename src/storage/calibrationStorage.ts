const K='dipskid.calibration.v1'
export const loadRecs=():any[]=>{try{return JSON.parse(localStorage.getItem(K)||'[]')}catch{return []}}
export const saveRecs=(r:any[])=>{try{localStorage.setItem(K,JSON.stringify(r))}catch{}}