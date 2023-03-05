import React, {useEffect, useMemo, ReactElement, useState} from 'react';

import {useACtx} from '../root/ctx';
import {useAddParam} from '../param/ctx';

import {AudioOut, AudioIn, WithIn, WithOut, WithInChildren, AParamProp, AParamCB, NoiseType, BusData} from './types';
import {getNodeId, doDisconnect, doConnect, asArray, setNodeId} from './utils';
import {BusContext, NodeInContext, useBus, useNodeIn} from './ctx';
import {useConst, useDelay, useFilter, useGain, useNoise, useOsc, usePan, useSimpleReverb, useWaveShaper} from './hooks';


type ConnProps = {
  from?: AudioOut | null;
  to?: AudioIn | null;
};

function Conn({from, to}: ConnProps) {
  useEffect(() => {
    if (!from) return;
    if (!to) return;
    console.log('connect', getNodeId(from), '->', getNodeId(to));
    doConnect(from, to);
    return () => {
      doDisconnect(from, to);
      console.log('disconnect', from, to);
    };
  }, [from, to]);
  return null;
}

function makeConn(from?: AudioOut | null, to?: AudioIn | null) {
  return <Conn key={`${getNodeId(from)}--${getNodeId(to)}`} from={from} to={to} />;
}


type NodeInProps = WithIn & {
  node: AudioIn;
}

export function NodeIn({node, children}: NodeInProps) {
  const [nodes, subs] = useMemo(() => {
    const chs = asArray(children);
    const nodes: AudioOut[] = [];
    const subs: ReactElement[] = [];
    for (const ch of chs) {
      if (!ch) continue;
      if (ch instanceof AudioNode) {
        nodes.push(ch);
        continue;
      }
      if ('current' in ch && ch.current instanceof AudioNode) {
        nodes.push(ch.current);
        continue;
      }
      if (React.isValidElement(ch)) {
        subs.push(ch);
      }
    }
    return [nodes, subs];
  }, [children]);

  return <>
    {nodes.map((n) => makeConn(n, node))}
    <NodeInContext.Provider value={node}>{subs}</NodeInContext.Provider>
  </>
}

type SendNodeProps = {
  node: AudioOut;
  to: string;
  gain: AParamProp;
};

export function SendNode({node, to, gain}: SendNodeProps) {
  const bus = useBus();

  const actx = useACtx();

  const noGain = gain == null || gain === 1;

  const nodeSend = useMemo(() => {
    if (noGain) return null;

    const ns = actx.createGain();
    ns.gain.value = 0;

    return ns;
  }, [node, noGain]);

  useEffect(() => {
    console.log('BUS.add', to, getNodeId(nodeSend || node));
    return bus.add(to, nodeSend || node);
  }, [bus, to, node, nodeSend]);

  if (!nodeSend) return null;
  
  return <>
    <ParamIn name="gain" param={nodeSend.gain}>{gain}</ParamIn>
    {makeConn(node, nodeSend)}
  </>;
}

type NodeOutProps = WithOut & {
  node: AudioOut;
}

export function NodeOut({node, nodeRef, sendTo}: NodeOutProps) {
  const nodeIn = useNodeIn();

  useEffect(() => {
    if (nodeRef) nodeRef.current = node;
  }, [nodeRef, node]);

  const sends = useMemo((): Record<string, AParamProp> => {
    if (!sendTo) return {};
    if (typeof sendTo === 'string') return {[sendTo]: 1};
    return sendTo;
  }, [sendTo]);

  return <>
    {makeConn(node, nodeIn)}
    {Object.keys(sends).map((to) => <SendNode node={node} to={to} key={to} gain={sends[to]} />)}
  </>;
}

type NodeInOutProps = WithIn & WithOut & {
  node: AudioOut;
}

export function NodeInOut({node, children, ...rest}: NodeInOutProps) {
  return <>
    <NodeIn node={node}>{children}</NodeIn>
    <NodeOut node={node} {...rest} />
  </>;
}

type SendProps = WithIn & WithOut & {
  to: string;
  gain?: AParamProp;
};

export function Send({to, gain, children, ...rest}: SendProps) {
  const nodeSrc = useGain();

  return <>
    <NodeInOut node={nodeSrc} {...rest}>
      {children}
    </NodeInOut>
    <SendNode node={nodeSrc} to={to} gain={gain} />
  </>;
}

type RecvProps = {
  from: string;
};

export function Recv({from}: RecvProps) {
  const bus = useBus();
  const [nodes, setNodes] = useState<AudioOut[]>([]);

  const nodeIn = useNodeIn();

  useEffect(() => {
    const onChange = () => {
      const res: AudioOut[] = []
      bus.withEach(from, (node) => {
        res.push(node);
      });

      console.log('BUS.onChange', from, res.map((n) => getNodeId(n)), bus);
      setNodes(res);
    };

    onChange();

    return bus.onChange((name) => {
      if (name === from) onChange();
    });
  }, [bus, from]);

  return <>
    {nodes.map((out) => makeConn(out, nodeIn))}
  </>
}

type ParamCBProps = {
  param: AudioParam;
  cb: AParamCB;
}

function ParamCB({param, cb}: ParamCBProps) {
  useEffect(() => cb(param), [param, cb]);

  return null;
}

type ParamNameProps = {
  param: AudioParam;
  name: string;
}

function ParamName({param, name}: ParamNameProps) {
  useAddParam(name, param);

  return null;
}

type ParamInProps = {
  children: AParamProp;
  param: AudioParam;
  name: string;
}

export function ParamIn({param, children, name}: ParamInProps) {
  const chs = asArray(children);

  const {nodes, num, cbs, ns} = useMemo(() => {
    const cbs: Array<AParamCB> = [];
    let num: number | null = null;
    const nodes: WithInChildren = [];
    const ns: string[] = [];
    for (const child of chs) {
      if (child == null) continue;
      if (typeof child === 'number') {
        num = (num || 0) + child;
        continue;
      }
      if (typeof child === 'string') {
        ns.push(child);
        continue;
      }
      if (child instanceof AudioNode) {
        nodes.push(child);
        continue;
      }
      if ('current' in child) {
        nodes.push(child);
        continue;
      }
      if (React.isValidElement(child)) {
        nodes.push(child);
        continue;
      }
      if (typeof child === 'function') {
        cbs.push(child);
      }
    }
    return {cbs, num, nodes, ns};
  }, [chs]);

  useEffect(() => {
    if (num != null || cbs.length || ns.length) param.value = num || 0;
    else param.value = param.defaultValue;
    // console.log('setting', name, getNodeId(param), '=', param.value, num);
  }, [num, cbs.length, param, name, ns.length]);

  return <>
    <NodeIn node={param}>
      {nodes.concat(ns.map((child) => <Recv key={child} from={child} />))}
    </NodeIn>
    {cbs.map((child, i) => <ParamCB key={i} param={param} cb={child} />)}
    {ns.map((child, i) => <ParamName key={i} param={param} name={child} />)}
  </>
}

type BusProps = {
  children: any;
}

export function SendRecv({children}: BusProps) {
  const upBus = useBus();
  const [bus] = useState(() => new BusData(upBus));
  return <BusContext.Provider value={bus}>
    {children}
  </BusContext.Provider>;
}

export function SendRecvPop({children}: BusProps) {
  const bus = useBus();
  
  return <BusContext.Provider value={bus.parent || bus}>
    {children}
  </BusContext.Provider>;
}


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

export function Cut({children}: WithIn) {
  const chs = asArray(children);
  return <NodeInContext.Provider value={null}>{
    chs.filter((ch) => !(ch instanceof AudioNode))
  }</NodeInContext.Provider>;
}

type FromProps = {
  node: AudioOut;
}

export function From({node}: FromProps) {
  const nodeIn = useNodeIn();

  return makeConn(node, nodeIn);
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

type DelayWetProps = WithIn & WithOut & {
  name?: string;
  time: AParamProp;
}

export function DelayWet({name, time, ...rest}: DelayWetProps) {
  const node = useDelay();

  setNodeId(node.delayTime, `${getNodeId(node, name)}.time`);

  return <>
    <NodeInOut node={node} {...rest} />
    <ParamIn name="time" param={node.delayTime}>{time}</ParamIn>
  </>;
}

type EchoProps = WithIn & WithOut & {
  time: AParamProp;
  feedback?: AParamProp;
}

export function Echo({children, time, feedback = 0.5}: EchoProps) {
  return <SendRecv>
    <Gain sendTo={{del: feedback}}>
      <SendRecvPop>{children}</SendRecvPop>
    </Gain>
    <DelayWet time={time} sendTo={{del: feedback}}>
      <Recv from="del" />
    </DelayWet>
  </SendRecv>;
}

type PingPongProps = WithIn & {
  time: AParamProp;
  feedback?: AParamProp;
}

export function PingPong({children, time, feedback = 0.5}: PingPongProps) {
  return <SendRecv>
    <Gain sendTo={{left: feedback}}>
      <SendRecvPop>{children}</SendRecvPop>
    </Gain>
    <Pan pan={-0.9}>
      <DelayWet time={time} sendTo={{right: feedback}}>
        <Recv from="left" />
      </DelayWet>
    </Pan>
    <Pan pan={0.9}>
      <DelayWet time={time} sendTo={{left: feedback}}>
        <Recv from="right" />
      </DelayWet>
    </Pan>
  </SendRecv>;
}

type SimpleReverbProps = WithIn & WithOut & {
  name?: string;
  seconds: number;
  decay: number;
  reverse?: boolean;
}

export function SimpleReverbWet({name, seconds, decay, reverse, ...rest}: SimpleReverbProps) {
  const node = useSimpleReverb(seconds, decay, reverse);

  getNodeId(node, name);

  return <>
    <NodeInOut node={node} {...rest} />
  </>;
}

export function SimpleReverb({children, ...rest}: SimpleReverbProps) {
  return <SendRecv>
    <Send to="rev">
      <SendRecvPop>{children}</SendRecvPop>
    </Send>
    <SimpleReverbWet {...rest}>
      <Recv from="rev" />
    </SimpleReverbWet>
  </SendRecv>
}
