export type AudioAny = AudioNode | AudioParam;

export type AudioIn = AudioNode | AudioParam;

export type AudioOut = AudioNode;

export type NodeRef = {
  current: AudioOut | null;
}

export type WithOut = {
  nodeRef?: NodeRef;
};

export type WithInChild = React.ReactElement<WithOut> | AudioOut | NodeRef | null;

export type WithInChildren = WithInChild | WithInChild[];

export type WithIn = {
  children: WithInChildren;
}

export type AParamCB = (p: AudioParam) => () => void;

export type AParamValue = WithInChild | number | AParamCB | string | undefined;

export type AParamProp = AParamValue | AParamValue[];

export type NoiseType = 'white' | 'pink';