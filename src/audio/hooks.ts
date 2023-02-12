import {useState, useEffect} from 'react';

import {useACtx} from '../root/ctx';

import {NodeRef, AudioOut} from './types';


export function useNodeRef(): NodeRef {
  const [node, setNode] = useState<AudioOut | null>(null);
  return {
    set current(n) { setNode(n); },
    get current() { return node; },
  };
}

export function useConst() {
  const actx = useACtx();
  const [node] = useState(actx.createConstantSource());
  
  useEffect(() => {
    node.start();
    return () => node.stop();
  }, [node]);
  
  return node;
}

export function useOsc(type: OscillatorType) {
  const actx = useACtx();
  const [node] = useState(actx.createOscillator());
  
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
  const [node] = useState(actx.createBiquadFilter());
  
  useEffect(() => {
    node.type = type;
  }, [node, type]);

  return node;
}

export function useGain() {
  const actx = useACtx();
  const [node] = useState(actx.createGain());

  return node;
}

export function useAnalyser() {
  const actx = useACtx();
  const [node] = useState(actx.createAnalyser());

  return node;
}
