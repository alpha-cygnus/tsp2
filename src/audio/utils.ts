import {AudioAny, AudioOut, AudioIn} from './types';

const theNodeIds = new WeakMap<AudioAny, string>();

let theLastId = 0;

// utils

export function setNodeId(node: AudioAny, id: string) {
  theNodeIds.set(node, id);
}

export function getNodeId(node?: AudioAny | null, name?: string): string {
  if (!node) return '';
  let id = theNodeIds.get(node);
  if (id) return id;
  id = `${name || node.constructor.name}-${++theLastId}`;
  setNodeId(node, id);
  return id;
}

export function doConnect(from: AudioOut, to: AudioIn) {
  // @ts-ignore
  from.connect(to);
}

export function doDisconnect(from: AudioOut, to: AudioIn) {
  // @ts-ignore
  from.disconnect(to);
}

export function asArray<T>(v: T | T[] | null | undefined): T[] {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  return [v];
}

