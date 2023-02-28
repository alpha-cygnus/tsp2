import {createContext, useContext, useEffect} from 'react';

import {AudioIn} from './types';


export const defAudioCtx = new AudioContext({
  latencyHint: "playback",
});

export const NodeInContext = createContext<AudioIn | null>(null);

export const useNodeIn = () => useContext(NodeInContext);

