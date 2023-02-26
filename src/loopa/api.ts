import {getCurrentLoopContext} from './core';
import {LoopFunc} from './types';


export function skip(dt: number) {
  const ctx = getCurrentLoopContext();
  ctx.updT(t => t + dt);
}

export function play(ins: string | number, note: number, vel: number = 100) {
  const ctx = getCurrentLoopContext();
  ctx.put({ icmd: { i: ins, cmd: { on: {note, vel} }}});
}

export function stop(ins: string | number, note: number, vel: number = 100) {
  const ctx = getCurrentLoopContext();
  ctx.put({ icmd: { i: ins, cmd: { off: {note, vel} }}});
}

export function loopStart(func: LoopFunc, count: number = 1, tmul: number = 1) {
  const ctx = getCurrentLoopContext();
  ctx.put({ loop: { func, tmul: tmul || 1, count: count || 1 } });
}
