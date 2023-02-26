import {CookedLCItem, CookedLoop, LCItem, LCSeq, LoopContext, LoopFunc, RawLoop} from './types';

const loopContextStack: LoopContext[] = [];

export function rawLoop(loop: LoopFunc, runCount: number, ctx: LoopContext = new LoopContext): RawLoop {
  loopContextStack.push(ctx);

  const started = new Map<LoopFunc, {start: number, tmul?: number}>();

  try {
    loop(runCount);
    const { items } = ctx;
    const seq: LCSeq = [];
    for (const [t, item] of items) {
      if ('loopStart' in item) {
        const {func, tmul} = item.loopStart;
        if (!started.has(func)) {
          started.set(func, {start: t, tmul});
        }
        continue;
      }
      if ('loopEnd' in item) {
        const {func} = item.loopEnd;
        const sl = started.get(func);
        if (sl) {
          const {start, tmul} = sl;
          seq.push([start, { loop: {func, tmul, tmax: t} }])
        }
        continue;
      }
      seq.push([t, item]);
    }
    return {tmax: ctx.tmax, seq};
  } finally {
    loopContextStack.pop();
  }
}

export function getCurrentLoopContext(): LoopContext {
  if (!loopContextStack.length) {
    throw new Error('No Loop Context!');
  }

  return loopContextStack.at(-1)!;
}

export function cookLoop(loop: LoopFunc, startBpm: number, runCount: number = 0): CookedLoop {
  const {seq: rawSeq, tmax: tickMax} = rawLoop(loop, runCount);

  const tpb = 96;

  for (const [tick, item] of rawSeq) {
    if ('loop' in item) {
      const {func, tmul = 1, count, tmax: slTmax = 0} = item.loop;
      const cnt = slTmax > tick ? count || 1 : 0;
      let t0 = tick;
      for (let i = 0; ; i++) {
        if (cnt && i >= cnt) break;
        if (slTmax && t0 >= slTmax) break;

        const { tmax, seq } = rawLoop(func, i);

        let toAdd = seq.map(([t, it]) => {
          const nt = t * tmul + t0;
          return [nt, it] as [number, LCItem];
        });
        if (slTmax) {
          toAdd.filter(([t]) => !slTmax || t < slTmax)
        }
        rawSeq.push(...toAdd);

        t0 += tmax * tmul;
      }
    }
  }

  let ct = 0;
  let pt = 0;
  let bpm = startBpm;
  let seq: [number, CookedLCItem][] = [];

  const sorted = rawSeq.sort(([a], [b]) => a - b);

  const toSec = (dt: number) => dt * 60 / tpb / bpm;

  for (const [tick, item] of sorted) {
    if (tick > tickMax) break;

    if ('bpm' in item) bpm = item.bpm;

    ct += toSec(tick - pt);

    if ('bpm' in item) continue;
    if ('loop' in item) continue;
    if ('loopStart' in item) continue;
    if ('loopEnd' in item) continue;

    seq.push([ct, item]);

    pt = tick;
  }

  return {
    bpm,
    seq,
    len: ct + toSec(tickMax - pt),
  }
}
