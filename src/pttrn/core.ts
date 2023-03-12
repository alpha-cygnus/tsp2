import { Timed } from '../common/types';
import { CookedItem, CookedPttrn, PrecookedItem, PrecookedPttrn, PttrnRunContext, PttrnFunc, PttrnId, PttrnsData, ParamSetName, ParamSetFunc, ParamSetDest } from './types';

const pttrnContextStack: PttrnRunContext[] = [];

export function precookPttrn(pttrn: PttrnFunc, runCount: number, ctx: PttrnRunContext = new PttrnRunContext): PrecookedPttrn {
  pttrnContextStack.push(ctx);

  const pttrnStarted = new Map<PttrnId, {start: number}>();
  const paramStarted = new Map<ParamSetName, {start: number, func: ParamSetFunc}>();

  try {
    pttrn(runCount);
    const { items } = ctx;
    const seq: Timed<PrecookedItem>[] = [];
    for (const [t, item] of items) {
      if ('pttrnStart' in item) {
        const {id} = item.pttrnStart;
        if (!pttrnStarted.has(id)) {
          pttrnStarted.set(id, {start: t});
        }
        continue;
      }
      if ('pttrnEnd' in item) {
        const {id} = item.pttrnEnd;
        const sl = pttrnStarted.get(id);
        if (sl) {
          const {start} = sl;
          seq.push([start, { pttrn: {id, stop: t} }]);
          pttrnStarted.delete(id);
        }
        continue;
      }
      if ('param' in item) {
        const { name, val } = item.param;
        if (typeof val === 'function') {
          if (!paramStarted.has(name)) {
            paramStarted.set(name, {start: t, func: val});
          }
          continue;
        }
        const pst = paramStarted.get(name);
        if (pst) {
          const {start, func} = pst;
          seq.push([start, { paramFunc: {name, func, stop: t} }]);
          pttrnStarted.delete(name);
        }
        seq.push([t, {param: {name, val}}]);
        continue;
      }
      seq.push([t, item]);
    }
    
    const {tmax} = ctx;
    
    for (const [id, sl] of pttrnStarted.entries()) {
      const {start} = sl;
      seq.push([start, { pttrn: {id, stop: tmax} }]);
    }
    
    for (const [name, pst] of paramStarted.entries()) {
      const {start, func} = pst;
      seq.push([start, { paramFunc: {name, func, stop: tmax} }]);
    }

    return {tmax, seq};
  } finally {
    pttrnContextStack.pop();
  }
}

export function cookPttrn(pttrns: PttrnsData, name: string, startBpm: number, startBeatLen = 1/4): CookedPttrn {
  const rawSeq: Timed<PrecookedItem>[] = [];
  let tickMax = 0;

  pttrns.withEach(name, (pttrn) => {
    const {seq, tmax} = precookPttrn(pttrn.func, 0);
    rawSeq.push(...seq);
    if (tickMax < tmax) tickMax = tmax;
  });

  for (let idx = 0; idx < rawSeq.length; idx++) {
    const [tick, item] = rawSeq[idx];

    if ('pttrn' in item) {
      const {id, repeat, stop} = item.pttrn;

      pttrns.withEach(String(id), ({func}) => {
        const stopAt = stop || tickMax;
        let t0 = tick;
        for (let i = 0; ; i++) {
          if (repeat && i >= repeat) break;
          if (t0 >= stopAt) break;
  
          const { tmax, seq: subSeq } = precookPttrn(func, i);
  
          const toAdd = subSeq.map(([t, it]) => {
            const nt = t + t0;
            return [nt, it] as Timed<PrecookedItem>;
          }).filter(([t]) => t < stopAt);
          
          rawSeq.push(...toAdd);
  
          t0 += tmax;
        }
      });
    }
  }

  for (let idx = 0; idx < rawSeq.length; idx++) {
    const [tick, item] = rawSeq[idx];

    if ('paramFunc' in item) {
      const {name, func, stop} = item.paramFunc;
      const dt = 0.01;
      rawSeq.push([tick, {param: {name, val: func(0)}}]);
      for (let tt = tick + dt; tt < stop; tt += dt) {
        rawSeq.push([tt, {param: {name, val: func(tt - tick), lin: true}}]);
      }
      rawSeq.push([stop - tick, {param: {name, val: func(stop - tick), lin: true}}]);
    }
  }

  let ct = 0;
  let pt = 0;
  let bpm = startBpm;
  let beatLen = startBeatLen;
  const seq: Timed<CookedItem>[] = [];

  const sorted = rawSeq.sort(([a], [b]) => a - b);

  const toSec = (dt: number) => dt * 60 / beatLen / bpm;

  for (const [tick, item] of sorted) {
    if (tick > tickMax) break;

    if ('bpm' in item) {
      bpm = item.bpm.bpm;
      beatLen = item.bpm.beatLen;
    }

    ct += toSec(tick - pt);

    if ('bpm' in item) continue;
    if ('pttrn' in item) continue;
    if ('paramFunc' in item) continue;

    seq.push([ct, item]);

    pt = tick;
  }

  return {
    bpm,
    beatLen,
    seq,
    len: ct + toSec(tickMax - pt),
  }
}

export function getCurrentPttrnContext(): PttrnRunContext {
  if (!pttrnContextStack.length) {
    throw new Error('No Pttrn Context!');
  }

  return pttrnContextStack.at(-1)!;
}

export function splitPName(psn: ParamSetName): [ParamSetDest, string, string] {
  const [dst, dn, ...pn] = psn.split('.');
  return [dst as ParamSetDest, dn, pn.join('.')];
}
