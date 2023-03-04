import React, {useEffect, useMemo, ReactElement, useState} from 'react';

import {useACtx} from '../root/ctx';
import {useAddParam} from '../param/ctx';

import {AudioOut, AudioIn, WithIn, WithOut, WithInChildren, AParamProp, AParamCB, NoiseType, BusData} from './types';
import {getNodeId, doDisconnect, doConnect, asArray, setNodeId} from './utils';
import {BusContext, NodeInContext, useBus, useNodeIn} from './ctx';
import {useConst, useDelay, useFilter, useGain, useNoise, useOsc, usePan, useSimpleReverb} from './hooks';
import { notNull } from '../common/utils';


type ConnProps = {
  from?: AudioOut | null;
  to?: AudioIn | null;
};

function Conn({from, to}: ConnProps) {
  useEffect(() => {
    if (!from) return;
    if (!to) return;
    // console.log('connect', getNodeId(from), '->', getNodeId(to));
    doConnect(from, to);
    return () => {
      doDisconnect(from, to);
      // console.log('disconnect', from, to);
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

type SendProps = {
  node: AudioOut;
  to: string;
};

export function Send({node, to}: SendProps) {
  const bus = useBus();

  useEffect(() => {
    return bus.add(to, node);
  }, [bus, to, node]);

  return null;
}

type NodeOutProps = WithOut & {
  node: AudioOut;
}

export function NodeOut({node, nodeRef, send}: NodeOutProps) {
  const nodeIn = useNodeIn();
  const actx = useACtx();

  useEffect(() => {
    if (nodeRef) nodeRef.current = node;
  }, [nodeRef, node]);

  const sendNodes: Array<{node: AudioOut, to: string}> = useMemo(() => {
    if (!send) return [];
    
    const sends = Array.isArray(send) ? send : [send];

    return sends.filter(notNull).map((s) => {
      const m = s.match(/^(.*?):([+-]?\d+(\.\d+)?)$/);
      let name: string;
      let sendNode: AudioOut | GainNode;
      if (m) {
        name = m[1];
        const gain = actx.createGain();
        gain.gain.value = parseFloat(m[2]);
        sendNode = gain;
      } else {
        name = s;
        sendNode = node;
      }

      return {to: name, node: sendNode};
    });
  }, [send]);

  return <>
    {makeConn(node, nodeIn)}
    {sendNodes.map(({node: n, to}) => <Send node={n} to={to} key={to} />)}
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

export function Bus({children}: BusProps) {
  const [bus] = useState(() => new BusData());
  return <BusContext.Provider value={bus}>
    {children}
  </BusContext.Provider>
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

export function Echo({children, time, feedback}: EchoProps) {
  return <Bus>
    <Gain send="src" gain={1}>{children}</Gain>
    <Gain send="del" gain={feedback || 0.5}>
      <DelayWet time={time}>
        <Recv from="src" />
        <Recv from="del" />
      </DelayWet>
    </Gain>
  </Bus>;
}

type PingPongProps = WithIn & WithOut & {
  time: AParamProp;
  feedback?: AParamProp;
}

export function PingPong({children, time, feedback}: PingPongProps) {
  return <Bus>
    <Gain send="src" gain={1}>{children}</Gain>
    <Pan pan={-0.5}>
      <Gain send="left" gain={feedback || 0.5}>
        <DelayWet time={time}>
          <Recv from="right" />
          <Recv from="src" />
        </DelayWet>
      </Gain>
    </Pan>
    <Pan pan={0.5}>
      <Gain send="right" gain={feedback || 0.5}>
        <DelayWet time={time}>
          <Recv from="left" />
        </DelayWet>
      </Gain>
    </Pan>
  </Bus>;
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
  return <Bus>
    <Gain send="src" gain={1}>{children}</Gain>
    <SimpleReverbWet {...rest}>
      <Recv from="src" />
    </SimpleReverbWet>
  </Bus>
}
