import { Timed } from '../common/types';
import { CookedItem, CookedPttrn, PrecookedItem, PrecookedPttrn, PttrnRunContext, PttrnFunc, PttrnId, PttrnsData } from './types';

const pttrnContextStack: PttrnRunContext[] = [];

export function precookPttrn(pttrn: PttrnFunc, runCount: number, ctx: PttrnRunContext = new PttrnRunContext): PrecookedPttrn {
  pttrnContextStack.push(ctx);

  const started = new Map<PttrnId, {start: number, tmul?: number}>();

  try {
    pttrn(runCount);
    const { items } = ctx;
    const seq: Timed<PrecookedItem>[] = [];
    for (const [t, item] of items) {
      if ('pttrnStart' in item) {
        const {id} = item.pttrnStart;
        if (!started.has(id)) {
          started.set(id, {start: t});
        }
        continue;
      }
      if ('pttrnEnd' in item) {
        const {id} = item.pttrnEnd;
        const sl = started.get(id);
        if (sl) {
          const {start} = sl;
          seq.push([start, { pttrn: {id, stop: t} }])
        }
        continue;
      }
      seq.push([t, item]);
    }
    return {tmax: ctx.tmax, seq};
  } finally {
    pttrnContextStack.pop();
  }
}

export function cookPttrn(pttrns: PttrnsData, name: string, startBpm: number): CookedPttrn {
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

  let ct = 0;
  let pt = 0;
  let bpm = startBpm;
  let seq: Timed<CookedItem>[] = [];

  const sorted = rawSeq.sort(([a], [b]) => a - b);

  const toSec = (dt: number) => dt * 60 / bpm;

  for (const [tick, item] of sorted) {
    if (tick > tickMax) break;

    if ('bpm' in item) bpm = item.bpm;

    ct += toSec(tick - pt);

    if ('bpm' in item) continue;
    if ('pttrn' in item) continue;

    seq.push([ct, item]);

    pt = tick;
  }

  return {
    bpm,
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
