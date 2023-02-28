import { ItemSet, Timed } from '../common/types';
import { InstrCmd } from '../instr/types';
import { NamedMap } from '../common/types';

export type PttrnFunc = (runCount: number) => void;

export type PttrnId = string | number;

export type ICmd = { icmd: { ins: string, cmd: InstrCmd } };
export type Bpm = { bpm: number };
export type Pttrn = { pttrn: { id: PttrnId, repeat?: number, stop?: number }};
export type PttrnStart = { pttrnStart: { id: PttrnId }};
export type PttrnEnd = { pttrnEnd: { id: PttrnId }};
export type ParamSetDest = 'ins' | 'trk';
export type ParamSetConst = number | null;
export type ParamSetFunc = ((t: number) => number);
export type ParamSetVal = ParamSetConst | ParamSetFunc;
export type ParamSetName = `${ParamSetDest}.${string}.${string}`;
export type ParamSetRaw = { param: { name: ParamSetName, val: ParamSetVal } };
export type ParamSetPrecooked =
| { param: { name: ParamSetName, val: ParamSetConst, lin?: boolean } }
| { paramFunc: { name: ParamSetName, func: ParamSetFunc, stop: number } };
export type ParamSetCooked = { param: { name: ParamSetName, val: ParamSetConst, lin?: boolean } };

export type RawItem = ICmd | Bpm | Pttrn | PttrnStart | PttrnEnd | ParamSetRaw;
export type PrecookedItem = ICmd | Bpm | Pttrn | ParamSetPrecooked;
export type CookedItem = ICmd | ParamSetCooked;

export class PttrnRunContext {
  t: number = 0;
  tmax: number = 0;
  items: Timed<RawItem>[] = [];

  updT(upd: (t: number) => number) {
    this.t = upd(this.t);
    if (this.t > this.tmax) this.tmax = this.t;
  }

  put(item: RawItem) {
    this.items.push([this.t, item]);
  }
}

export type PrecookedPttrn = {
  tmax: number;
  seq: Timed<PrecookedItem>[];
};

export type CookedPttrn = {
  bpm: number;
  len: number;
  seq: Timed<CookedItem>[];
};

export class PttrnData {
  func: PttrnFunc;
  name: string;
  
  constructor(name: string, func: PttrnFunc) {
    this.name = name;
    this.func = func;
  }
}

export class PttrnProxy extends ItemSet<PttrnData> {
}

export class PttrnsData extends NamedMap<PttrnData, PttrnProxy> {
  constructor() {
    super(() => new PttrnProxy());
  }
}

