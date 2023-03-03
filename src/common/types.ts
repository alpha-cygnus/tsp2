import { EventEmitter } from "events";

export type Time = number;

export type Timed<V> = [Time, V];

export type Ratio = [number, number];

export class ItemSet<I> {
  set: Set<I> = new Set();

  onChange?: ((action: string) => void);
  
  add(item: I): () => void {
    this.set.add(item);
    if (this.onChange) this.onChange('add');
    return () => {
      this.set.delete(item);
      if (this.onChange) this.onChange('delete');
    }
  }

  forEach(cb: (item: I) => void) {
    this.set.forEach(cb);
  }
}

export class NamedMap<I, NI extends ItemSet<I>> {
  createItem: (name: string) => NI;
  map: Map<string, NI> = new Map();
  events = new EventEmitter();

  constructor(createItem: (name: string) => NI) {
    this.createItem = createItem;
  }

  emitChange(name: string) {
    this.events.emit('change', name);
  }

  onChange(cb: (name: string) => void): () => void {
    this.events.on('change', cb);
    return () => {
      this.events.off('change', cb);
    };
  }

  get(name: string): NI {
    const i = this.map.get(name);
    if (i) return i;
    const ni = this.createItem(name);
    this.map.set(name, ni);
    return ni;
  }

  add(name: string, i: I): () => void {
    const ip = this.get(name);
    const fin = ip.add(i);
    this.emitChange(name);
    return () => {
      fin();
      this.emitChange(name);
    };
  }

  getNames() {
    return [...this.map.keys()].filter((key) => this.map.get(key)!.set.size > 0);
  }

  withEach(name: string, cb: (i: I) => void) {
    this.get(name).forEach(cb);
  }
}

export interface WithParam {
  withParam(name: string, cb: (p: AudioParam) => void): void;
}

