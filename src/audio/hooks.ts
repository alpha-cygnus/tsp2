import {useState, useEffect} from 'react';
import { unreachable } from '../common/utils';

import {useACtx} from '../root/ctx';

import {NodeRef, AudioOut, NoiseType} from './types';


export function useNodeRef(): NodeRef {
  const [node, setNode] = useState<AudioOut | null>(null);
  return {
    set current(n) { setNode(n); },
    get current() { return node; },
  };
}

export function useConst() {
  const actx = useACtx();
  const [node] = useState(() => actx.createConstantSource());
  
  useEffect(() => {
    node.start();
    return () => node.stop();
  }, [node]);
  
  return node;
}

export function useOsc(type: OscillatorType) {
  const actx = useACtx();
  const [node] = useState(() => actx.createOscillator());
  
  useEffect(() => {
    node.type = type;
  }, [node, type]);

  useEffect(() => {
    node.start();
    return () => node.stop();
  }, [node]);
  
  return node;
}

export function useFilter(type: BiquadFilterType) {
  const actx = useACtx();
  const [node] = useState(() => actx.createBiquadFilter());
  
  useEffect(() => {
    node.type = type;
  }, [node, type]);

  return node;
}

export function useGain() {
  const actx = useACtx();
  const [node] = useState(() => actx.createGain());

  return node;
}

export function useAnalyser() {
  const actx = useACtx();
  const [node] = useState(() => actx.createAnalyser());

  return node;
}

export function usePan() {
  const actx = useACtx();
  const [node] = useState(() => actx.createStereoPanner());

  return node;
}

const noiseCache: Record<NoiseType, {actx: BaseAudioContext, buf: AudioBuffer} | null> = {
  white: null,
  pink: null,
};

function createNoiseData(type: NoiseType, out: Float32Array) {
  if (type === 'white') {
    for (let i = 0; i < out.length; i++) out[i] = Math.random() * 2 + 1;
    return;
  }

  if (type === 'pink') {
    let b0, b1, b2, b3, b4, b5, b6;
    
    b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
    
    for (var i = 0; i < out.length; i++) {
      var white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      out[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      out[i] *= 0.11; // (roughly) compensate for gain
      b6 = white * 0.115926;
    }
    return;
  }

  unreachable(type);
}

function getNoiseBuffer(type: NoiseType, actx: BaseAudioContext): AudioBuffer {
  let ch = noiseCache[type];
  
  if (!ch || ch.actx !== actx) {
    const bufSize = 2 * actx.sampleRate;

    const buf = actx.createBuffer(1, bufSize, actx.sampleRate);

    const out = buf.getChannelData(0);

    createNoiseData(type, out);

    noiseCache[type] = ch = {
      actx,
      buf,
    };
  }

  return ch.buf;
}

export function useNoise(type: NoiseType) {
  const actx = useACtx();

  const [node] = useState(() => actx.createBufferSource());

  useEffect(() => {
    node.buffer = getNoiseBuffer(type, actx);
  }, [node, type, actx]);

  useEffect(() => {
    node.start();
    return () => node.stop();
  }, [node]);
  
  return node;
}
