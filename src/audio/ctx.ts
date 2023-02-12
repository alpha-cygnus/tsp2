import {createContext, useContext, useEffect} from 'react';

import {AudioIn} from './types';


export const defAudioCtx = new AudioContext({
  latencyHint: "playback",
});

export const NodeInContext = createContext<AudioIn | null>(null);

export const useNodeIn = () => useContext(NodeInContext);

export type ParamNameContextData = {
  addParam: (name: string, param: AudioParam) => () => void;
};

export const ParamNameContext = createContext<ParamNameContextData | null>(null);

export function useAddParam(name: string, param: AudioParam) {
  const cd = useContext(ParamNameContext);
  
  useEffect(() => {
    if (!cd) return;
    return cd.addParam(name, param);
  }, [cd, name, param]);
}
