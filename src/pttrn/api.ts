import {getCurrentPttrnContext} from './core';

import {ParamSetDest, ParamSetName, ParamSetVal, PttrnId} from './types';


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

export function setParam(name: ParamSetName, val: ParamSetVal) {
  const ctx = getCurrentPttrnContext();
  ctx.put({ param: { name, val } });
}

function makeParamApi(dest: ParamSetDest, destName: string): Record<string, ParamSetVal> {
  return new Proxy<Record<string, ParamSetVal>>({}, {
    set(_, p, newValue) {
      if (typeof p === 'symbol') return false;
      if (typeof newValue !== 'number' && newValue !== null && typeof newValue !== 'function') {
        return false;
      }

      setParam(`${dest}.${destName}.${p}`, newValue);
      
      return true;
    },
  });
}

class InsApi {
  name: string;
  
  param: Record<string, ParamSetVal>;
  
  constructor(name: string) {
    this.name = name;
    this.param = makeParamApi('ins', name);
  }
  
  on(note: number, vel: number = 1): this {
    playIns(this.name, note, vel);
    return this;
  }
  
  off(note: number, vel: number = 1): this {
    stopIns(this.name, note, vel);
    return this;
  }

  note(note: number, dur: number, vel: number = 1): this {
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
  get(_, p) {
    if (typeof p === 'symbol') p = p.toString();
    return new InsApi(p);
  },
});

class TrkApi {
  name: string;
  
  param: Record<string, ParamSetVal>;
  
  constructor(name: string) {
    this.name = name;
    this.param = makeParamApi('trk', name);
  }
}

export const T = new Proxy<Record<string, TrkApi>>({}, {
  get(_, p) {
    if (typeof p === 'symbol') p = p.toString();
    return new TrkApi(p);
  },
});
