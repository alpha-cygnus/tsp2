import { NodeInOut, ParamIn, Recv, Send, SendRecv, SendRecvPop } from './core';
import { useDelay, useSimpleReverb } from './hooks';
import { Gain, Mul, Pan } from './basic';
import { AParamProp, WithIn, WithOut } from './types';
import { getNodeId, setNodeId } from './utils';

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
  spread?: AParamProp;
}

export function PingPong({children, time, feedback = 0.5, spread = 0.9}: PingPongProps) {
  return <SendRecv>
    <Gain sendTo={{left: feedback}}>
      <SendRecvPop>{children}</SendRecvPop>
    </Gain>
    <Pan pan={<Mul a={spread} b={-1} />}>
      <DelayWet time={time} sendTo={{right: feedback}}>
        <Recv from="left" />
      </DelayWet>
    </Pan>
    <Pan pan={spread}>
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
