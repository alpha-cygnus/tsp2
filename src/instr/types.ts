import {EventEmitter} from 'events';
import { ItemSet, NamedMap, WithParam } from '../common/types';
import { unreachable } from '../common/utils';
import { ParamContextData, ParamProxy } from '../param/types';

type VoiceEvent = 'start' | 'stop';

type VoiceEventData = {
  voice: VoiceData;
  event: VoiceEvent;
  time: number;
}

export type InstrCmd = 
| {on: {note: number, vel: number}}
| {off: {note: number, vel: number}}
| {omniOff: {vel?: number}};

export interface AnyInstr extends WithParam {
  cmd(time: number, ic: InstrCmd): void;
}

export class VoiceData extends EventEmitter implements AnyInstr {
  pcd: ParamContextData = new ParamContextData();

  startedAt: number = 0;
  stoppedAt: number = 0;

  emitEvent(d: VoiceEventData) {
    this.emit(d.event, d);
  }

  start(time: number): void {
    this.startedAt = time;
    this.emitEvent({
      event: 'start',
      voice: this,
      time,
    });
  }
  
  stop(time: number): void {
    this.stoppedAt = time;
    this.emitEvent({
      event: 'stop',
      voice: this,
      time,
    });
  }

  isStarted(): boolean {
    return this.startedAt > this.stoppedAt;
  }

  onStart(cb: (e: VoiceEventData) => void): () => void {
    this.on('start', cb);
    return () => {
      this.off('start', cb);
    }
  }
  
  onStop(cb: (e: VoiceEventData) => void): () => void {
    this.on('stop', cb);
    return () => {
      this.off('stop', cb);
    }
  }
  
  getFreq(note: number) {
    return Math.pow(2, (note - 69) / 12) * 440; 
  }

  getDetune(note: number) {
    return (note - 69) * 100;
  }

  withParam(name: string, cb: (p: AudioParam) => void) {
    this.pcd.withEach(name, cb);
  }

  setNote(note: number, time: number) {
    this.withParam('freq', (pp) => {
      pp.setValueAtTime(this.getFreq(note), time);
    });
    this.withParam('detune', (pp) => {
      pp.setValueAtTime(this.getDetune(note), time);
    });
  }

  cmd(time: number, ic: InstrCmd): void {
    if ('on' in ic) {
      const {note, vel} = ic.on;
      this.setNote(note, time);
      this.withParam('vel', (pp) => {
        pp.setValueAtTime(vel, time);
      });
      this.start(time);
      return;
    }
    if ('off' in ic) {
      const {vel} = ic.off;
      this.withParam('relvel', (pp) => {
        pp.setValueAtTime(vel, time);
      });
      this.stop(time);
      return;
    }
    if ('omniOff' in ic) {
      this.stop(time);
      return;
    }

    unreachable(ic);
  }
}

export class PolyInstrData implements AnyInstr {
  voices: Set<VoiceData> = new Set();
  playing: Map<number, VoiceData> = new Map();

  addVoice(voice: VoiceData): () => void {
    this.voices.add(voice);

    return () => {
      this.voices.delete(voice);
    };
  }

  getChokeGroup(note: number) {
    return Math.floor(note);
  }

  allocVoice(): VoiceData | null {
    const vs = [...this.voices].sort((a, b) => {
      const ais = a.isStarted();
      const bis = b.isStarted();
      if (a.isStarted()) {
        if (b.isStarted()) {
          return a.startedAt - b.startedAt;
        }
        return 1;
      } else {
        if (b.isStarted()) return -1;
        return a.stoppedAt - b.stoppedAt;
      }
    });
    return vs[0] || null;
  }

  cmdVoices(time: number, ic: InstrCmd): VoiceData[] {
    if ('on' in ic) {
      const {note} = ic.on;
      const cg = this.getChokeGroup(note);
  
      if (this.playing.has(cg)) {
        this.cmd(time, {off: {note, vel: 0}});
      }
  
      const v = this.allocVoice();
  
      console.log('nom', cg, v);
  
      if (!v) return [];
  
      this.playing.set(cg, v);
  
      return [v];
    }
    if ('off' in ic) {
      const {note} = ic.off;

      const cg = this.getChokeGroup(note);
  
      const v = this.playing.get(cg);
  
      console.log('noff', cg, v);
  
      if (!v) return [];
  
      return [v];
    }
    if ('omniOff' in ic) {
      return [...this.playing.values()];
    }

    unreachable(ic);
  }

  cmd(time: number, ic: InstrCmd): void {
    const vs = this.cmdVoices(time, ic);

    for (const v of vs) v.cmd(time, ic);
  }

  paramVoices(name: string): VoiceData[] {
    return [...this.playing.values()];
  }

  withParam(name: string, cb: (p: AudioParam) => void): void {
    const vs = this.paramVoices(name);
    vs.forEach((v) => v.withParam(name, cb));
  }
}

export type NotePrio = 'low' | 'high' | 'last' | 'first';

export class MonoInstrData extends VoiceData {
  prevNote: number = 0;

  notePrio: NotePrio = 'high';

  cmd(time: number, ic: InstrCmd): void {
    if ('on' in ic) {
      const {note} = ic.on;
      if (!this.isStarted()) {
        this.prevNote = note;
        return super.cmd(time, ic);
      }
    
      const prio = this.notePrio;
      switch (prio) {
        case 'first':
          return;
        case 'high':
          if (note < this.prevNote) return;
          break;
        case 'low':
          if (note > this.prevNote) return;
          break;
        case 'last':
          break;
        default:
          unreachable(prio);
      }

      this.prevNote = note;
      this.setNote(note, time);
      return;
    }

    super.cmd(time, ic);
  }
}

export class InstrProxy extends ItemSet<AnyInstr> implements AnyInstr {
  set: Set<AnyInstr> = new Set();

  name: string;

  constructor (name: string) {
    super();
    this.name = name;
  }

  cmd(time: number, ic: InstrCmd): void {
    console.log('CMD', this.name, ic, this);
    this.set.forEach((instr) => instr.cmd(time, ic));
  }

  withParam(name: string, cb: (p: AudioParam) => void): void {
    this.set.forEach((instr) => instr.withParam(name, cb));
  }
}

export class BandData extends NamedMap<AnyInstr, InstrProxy> {
  constructor() {
    super((name) => new InstrProxy(name));
  }
}
