import {EventEmitter} from 'events';
import { unreachable } from '../common/utils';
import { Voice } from './comps';

type VoiceEvent = 'start' | 'stop';

type VoiceEventData = {
  voice: VoiceData;
  event: VoiceEvent;
  time: number;
}

export class ParamProxy {
  ps: Set<AudioParam> = new Set();

  addParam(p: AudioParam): () => void {
    this.ps.add(p);
    return () => {
      this.ps.delete(p);
    }
  } 

  cancel(t: number): void {
    this.ps.forEach((p) => {
      if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t);
      else p.cancelScheduledValues(t);
    });
  }
  exponentialTo(value: number, endTime: number): void {
    this.ps.forEach((p) => p.exponentialRampToValueAtTime(value, endTime));
  }
  linearTo(value: number, endTime: number): void {
    this.ps.forEach((p) => p.linearRampToValueAtTime(value, endTime));
  }
  setTarget(target: number, startTime: number, timeConstant: number): void {
    this.ps.forEach((p) => p.setTargetAtTime(target, startTime, timeConstant));
  }
  setValue(value: number, t: number): void {
    this.ps.forEach((p) => p.setValueAtTime(value, t));
  }
  setValueCurve(values: number[] | Float32Array, startTime: number, duration: number): void {
    this.ps.forEach((p) => p.setValueCurveAtTime(values, startTime, duration));
  }
}

type NoteOnData = {
  time: number;
  note: number;
  vel: number;
}

type NoteOffData = {
  time: number;
  note: number;
  vel: number;
}

interface AnyInstr {
  noteOn(data: NoteOnData): void;
  noteOff(data: NoteOffData): void;
}

export class VoiceData extends EventEmitter implements AnyInstr {
  params: Map<string, ParamProxy> = new Map();
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
  
  getParam(name: string): ParamProxy {
    let ps = this.params.get(name);
    if (!ps) {
      ps = new ParamProxy();
      this.params.set(name, ps);
    }
    return ps;
  }

  addParam(name: string, param: AudioParam): () => void {
    const pp = this.getParam(name);
    pp.ps.add(param);
    return () => {
      pp.ps.delete(param);
    }
  }

  withParam(name: string, cb: (pp: ParamProxy) => void): void {
    cb(this.getParam(name));
  }

  getFreq(note: number) {
    return Math.pow(2, (note - 69) / 12) * 440; 
  }

  getDetune(note: number) {
    return (note - 69) * 100;
  }

  setNote(note: number, time: number) {
    this.withParam('freq', (pp) => {
      pp.setValue(this.getFreq(note), time);
    });
    this.withParam('detune', (pp) => {
      pp.setValue(this.getDetune(note), time);
    });
  }

  noteOn({note, time, vel}: NoteOnData) {
    this.setNote(note, time);
    this.withParam('vel', (pp) => {
      pp.setValue(vel, time);
    });
    this.start(time);
  }

  noteOff({note, time, vel}: NoteOffData) {
    this.withParam('relvel', (pp) => {
      pp.setValue(vel, time);
    });
    this.stop(time);
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

  noteOn(data: NoteOnData) {
    const {note, time, vel} = data;
    const cg = this.getChokeGroup(note);

    if (this.playing.has(cg)) {
      this.noteOff({time, note, vel: 0});
    }

    const v = this.allocVoice();

    if (!v) return;

    v.noteOn(data);
  }

  noteOff(data: NoteOffData) {
    const {note} = data;

    const cg = this.getChokeGroup(note);

    const v = this.playing.get(cg);

    if (!v) return;

    v.noteOff(data);
  }
}

export type NotePrio = 'low' | 'high' | 'last' | 'first';

export class MonoInstrData extends VoiceData {
  prevNote: number = 0;

  notePrio: NotePrio = 'high';

  noteOn(data: NoteOnData): void {
    const {note, time} = data;
    
    if (!this.isStarted()) {
      this.prevNote = note;
      return super.noteOn(data);
    }
    
    const prio = this.notePrio;
    switch (prio) {
      case 'first':
        return;
      case 'high':
        if (data.note < this.prevNote) return;
        break;
      case 'low':
        if (data.note > this.prevNote) return;
        break;
      case 'last':
        break;
      default:
        unreachable(prio);
    }

    this.prevNote = note;
    this.setNote(note, time);
  }
}

export class InstrProxy implements AnyInstr {
  set: Set<AnyInstr> = new Set();

  noteOn(data: NoteOnData): void {
    this.set.forEach((instr) => instr.noteOn(data));
  }
  noteOff(data: NoteOffData): void {
    this.set.forEach((instr) => instr.noteOff(data));
  }

  addInstr(instr: AnyInstr): () => void {
    this.set.add(instr);
    return () => {
      this.set.delete(instr);
    };
  }
}

export class BandData {
  band: Map<string, InstrProxy> = new Map();

  getInstrProxy(name: string): InstrProxy {
    const instr = this.band.get(name);
    if (instr) return instr;
    const ni = new InstrProxy();
    this.band.set(name, ni);
    return ni;
  }

  addInstr(name: string, instr: AnyInstr): () => void {
    const ip = this.getInstrProxy(name);
    return ip.addInstr(instr);
  }
}
