export class LoopParam {
  set(params: Record<string, number | ((t: number) => number) | null>) {

  }
}

export class LoopIns extends LoopParam {
  play(note?: number, vel?: number) {

  }
  stop(note?: number, vel?: number) {

  }
}

export class LoopTrk extends LoopParam {

}

export class LoopLoop {
  play() {

  }
  stop() {

  }
}

export type LoopSkip = {
  (n: number): void;
  bar: (n?: number) => void;
  beat: (n?: number) => void;
  note: (n?: number) => void;
}

export type LoopCtx = {
  ins: Record<string | number, LoopIns>;
  track: Record<string | number, LoopTrk>;
  loop: Record<string, LoopLoop>;
  skip: LoopSkip;
}

export type LoopDef = (ctx: {count: number} & LoopCtx) => void;

const test: LoopDef = ({ ins, track, skip }) => {
  ins.test.play(60);
  track.main.set({pan: -1});
  skip(1);
  skip.bar();
  skip.note();
}
