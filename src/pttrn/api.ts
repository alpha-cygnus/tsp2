import {getCurrentPttrnContext} from './core';

import {PttrnFunc, PttrnId} from './types';


export function skip(dt: number) {
  const ctx = getCurrentPttrnContext();
  ctx.updT(t => t + dt);
}

export function play(ins: string, note: number, vel: number = 100) {
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

export function stop(ins: string, note: number, vel: number = 100) {
  const ctx = getCurrentPttrnContext();
  ctx.put({ icmd: { ins, cmd: { off: {note, vel} }}});
}

export function pttrn(id: PttrnId, count: number) {
  const ctx = getCurrentPttrnContext();
  ctx.put({ pttrn: { id, repeat: count } });
}
