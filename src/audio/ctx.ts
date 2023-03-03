import {createContext, useContext} from 'react';

import {AudioIn, BusData} from './types';


export const defAudioCtx = new AudioContext({
  latencyHint: "playback",
});

export const NodeInContext = createContext<AudioIn | null>(null);

export const useNodeIn = () => useContext(NodeInContext);

export const BusContext = createContext(new BusData());

export const useBus = () => useContext(BusContext);
