import {getCurrentPttrnContext} from './core';

import {PttrnId} from './types';


export function playIns(ins: string, note: number, vel: number = 100) {
  const ctx = getCurrentPttrnContext();
  ctx.put({ icmd: { ins, cmd: { on: {note, vel} }}});
}

export function playNote(ins: string, note: number, dur: number, vel: number = 100) {
  const ctx = getCurrentPttrnContext();
  ctx.put({ icmd: { ins, cmd: { on: {note, vel} }}});
  const t0 = ctx.t;
  ctx.updT(() => t0 + dur * 4);
  ctx.put({ icmd: { ins, cmd: { off: {note, vel} }}});
  ctx.updT(() => t0);
}

export function stopIns(ins: string, note: number, vel: number = 100) {
  const ctx = getCurrentPttrnContext();
  ctx.put({ icmd: { ins, cmd: { off: {note, vel} }}});
}

export function pttrnRepeat(id: PttrnId, count: number) {
  const ctx = getCurrentPttrnContext();
  ctx.put({ pttrn: { id, repeat: count } });
}

class InsApi {
  name: string;
  
  constructor(name: string) {
    this.name = name;
  }
  
  on(note: number, vel: number = 100): this {
    playIns(this.name, note, vel);
    return this;
  }
  
  off(note: number, vel: number = 100): this {
    stopIns(this.name, note, vel);
    return this;
  }

  note(note: number, dur: number, vel: number = 100): this {
    playNote(this.name, note, dur, vel);
    return this;
  }
}

type Skip = {
  (t: number): void;
  note: (t: number) => void;
}

function makeSkip(): Skip {
  const _skip = (dt: number) => {
    const ctx = getCurrentPttrnContext();
    ctx.updT(t => t + dt);
  };
  
  _skip.note = (t: number) => _skip(t * 4);

  return _skip;
}

export const skip = makeSkip();

export const I = new Proxy<Record<string, InsApi>>({}, {
  get(target, p, receiver) {
    if (typeof p === 'symbol') p = p.toString();
    return new InsApi(p);
  },
});
