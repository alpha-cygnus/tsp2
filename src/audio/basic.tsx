import { useMemo } from 'react';

import { useACtx } from '../root/ctx';

import { NodeIn, NodeInOut, NodeOut, ParamIn } from './core';
import { useConst, useFilter, useGain, useNoise, useOsc, usePan, useWaveShaper } from './hooks';
import { AParamProp, NoiseType, WithIn, WithOut } from './types';
import { getNodeId, setNodeId } from './utils';

type OscProps = WithOut & {
  name?: string;
  type: OscillatorType,
  frequency?: AParamProp;
  detune?: AParamProp;
};

export function Osc({name, type, frequency, detune, ...rest}: OscProps) {
  const node = useOsc(type);

  setNodeId(node.frequency, `${getNodeId(node, name)}.frequency`);
  setNodeId(node.detune, `${getNodeId(node, name)}.detune`);

  return <>
    <NodeOut node={node} {...rest} />
    <ParamIn name="freq" param={node.frequency}>{frequency}</ParamIn>
    <ParamIn name="detune" param={node.detune}>{detune}</ParamIn>
  </>;
}


type ConstProps = WithOut & {
  name?: string;
  value: AParamProp;
};

export function Const({value, name, ...rest}: ConstProps) {
  const node = useConst();

  setNodeId(node.offset, `${getNodeId(node, name)}.offset`);

  return <>
    <NodeOut node={node} {...rest} />
    <ParamIn name="value" param={node.offset}>{value}</ParamIn>
  </>;
}


type FilterProps = WithOut & WithIn & {
  name?: string;
  type: BiquadFilterType;
  frequency?: AParamProp;
  detune?: AParamProp;
  Q?: AParamProp;
};

export function Filter({name, type, frequency, detune, Q, ...rest}: FilterProps) {
  const node = useFilter(type);

  setNodeId(node.frequency, `${getNodeId(node, name)}.frequency`);
  setNodeId(node.detune, `${getNodeId(node, name)}.detune`);
  setNodeId(node.Q, `${getNodeId(node, name)}.Q`);

  return <>
    <NodeInOut node={node} {...rest} />
    <ParamIn name="freq" param={node.frequency}>{frequency}</ParamIn>
    <ParamIn name="detune" param={node.detune}>{detune}</ParamIn>
    <ParamIn name="Q" param={node.Q}>{Q}</ParamIn>
  </>;
}


export function Destination(props: WithIn) {
  const ctx = useACtx();

  return <NodeIn node={ctx.destination} {...props} />;
}


type GainProps = WithIn & WithOut & {
  gain?: AParamProp;
  name?: string;
};

export function Gain({gain, name, ...rest}: GainProps) {
  const node = useGain();

  setNodeId(node.gain, `${getNodeId(node, name)}.gain`);

  return <>
    <NodeInOut node={node} {...rest} />
    <ParamIn name="gain" param={node.gain}>{gain}</ParamIn>
  </>;
}

type PanProps = WithOut & WithIn & {
  name?: string;
  pan?: AParamProp;
};

export function Pan({name, pan, ...rest}: PanProps) {
  const node = usePan();

  setNodeId(node.pan, `${getNodeId(node, name)}.pan`);

  return <>
    <NodeInOut node={node} {...rest} />
    <ParamIn name="pan" param={node.pan}>{pan}</ParamIn>
  </>;
}

type WaveShaperProps = WithOut & {
  curve?: Float32Array | null | ((x: number) => number);
  curveFuncDeltaX?: number;
  oversample?: OverSampleType;
};

export function WaveShaper({curve: pCurve, curveFuncDeltaX, oversample = "none", ...rest}: WaveShaperProps) {
  const curve = useMemo(() => {
    if (typeof pCurve !== 'function') return pCurve;
    let dx = curveFuncDeltaX || 0;
    if (!(dx > 0)) dx = 0.01;
    const len = Math.ceil(2 / dx);
    const res = new Float32Array(len);
    for (let i = 0; i < len - 1; i++) {
      res[i] = pCurve(dx * i - 1);
    }
    res[len - 1] = pCurve(1);
  }, [pCurve, curveFuncDeltaX]);

  const node = useWaveShaper(curve, oversample);

  return <NodeOut node={node} {...rest} />;
}

type NoiseProps = WithOut & {
  name?: string;
  type: NoiseType,
};

export function Noise({name, type, ...rest}: NoiseProps) {
  const node = useNoise(type);

  getNodeId(node, name);

  return <>
    <NodeOut node={node} {...rest} />
  </>;
}

type MulProps = WithOut & {
  a: AParamProp;
  b: AParamProp;
}

export function Mul({a, b, ...rest}: MulProps) {
  return <Gain gain={a} {...rest}><Const value={b} /></Gain>;
}
