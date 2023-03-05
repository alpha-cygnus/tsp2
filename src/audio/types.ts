import { ItemSet, NamedMap } from "../common/types";

export type AudioAny = AudioNode | AudioParam;

export type AudioIn = AudioNode | AudioParam;

export type AudioOut = AudioNode;

export type NodeRef = {
  current: AudioOut | null;
}

export type WithOut = {
  nodeRef?: NodeRef;
  sendTo?: string | string[];
};

export type WithInChild = React.ReactElement<any> | AudioOut | NodeRef | null;

export type WithInChildren = WithInChild | WithInChild[];

export type WithIn = {
  children: WithInChildren;
}

export type AParamCB = (p: AudioParam) => () => void;

export type AParamValue = WithInChild | number | AParamCB | string | undefined;

export type AParamProp = AParamValue | AParamValue[];

export type NoiseType = 'white' | 'pink';

export class NodeProxy extends ItemSet<AudioOut> {
  name: string;
  
  constructor(name: string) {
    super();
    this.name = name;
  }
}

export class BusData extends NamedMap<AudioOut, NodeProxy> {
  constructor() {
    super((name) => new NodeProxy(name));
  }
}
