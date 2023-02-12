import {createContext, useContext} from 'react';

import {BandData, PolyInstrData, VoiceData} from './types';


export const VoiceContext = createContext<VoiceData | null>(null);

export function useVoice(): VoiceData {
  const v = useContext(VoiceContext);
  if (!v) throw new Error('No voice! Use <Voice> or <Instr> wrapper');
  return v;
}

export const PolyInstrContext = createContext<PolyInstrData | null>(null);

export function usePolyInstr(): PolyInstrData {
  const pi = useContext(PolyInstrContext);
  if (!pi) throw new Error('Voice with no Poly!');
  return pi;
}

export const BandContext = createContext<BandData>(new BandData());

export function useBand() {
  return useContext(BandContext);
}
