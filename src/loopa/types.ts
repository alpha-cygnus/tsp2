import { InstrCmd } from '../instr/types';

export type LoopFunc = (runCount: number) => void;

export type CookedLCItem =
| { icmd: { i: string | number, cmd: InstrCmd } }

export type LCItem =
| CookedLCItem
| { bpm: number }
| { loop: { func: LoopFunc, tmul?: number, count?: number, tmax?: number }}
| { loopStart: { func: LoopFunc, tmul?: number }}
| { loopEnd: { func: LoopFunc }}
;

export type LCSeq = Array<[number, LCItem]>;

export class LoopContext {
  t: number = 0;
  tmax: number = 0;
  items: LCSeq = [];

  updT(upd: (t: number) => number) {
    this.t = upd(this.t);
    if (this.t > this.tmax) this.tmax = this.t;
  }

  put(item: LCItem) {
    this.items.push([this.t, item]);
  }
}

export type RawLoop = {
  tmax: number;
  seq: LCSeq;
};

export type CookedLoop = {
  bpm: number;
  len: number;
  seq: [number, CookedLCItem][];
};
