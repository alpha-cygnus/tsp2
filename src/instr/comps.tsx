import { Children, useEffect, useMemo, useState } from 'react';
import { Const, Gain } from '../audio/comps';
import { ParamNameContext } from '../audio/ctx';
import { WithIn, WithInChildren, WithOut } from '../audio/types';
import {PolyInstrContext, useBand, usePolyInstr, VoiceContext} from './ctx';
import { useAdsrCb } from './hooks';
import { MonoInstrData, NotePrio, PolyInstrData, VoiceData } from './types';

type VoiceProps = {
  children: JSX.Element | JSX.Element[];
}

export function Voice({children}: VoiceProps) {
  const [v] = useState(new VoiceData());

  const pi = usePolyInstr();

  useEffect(() => pi.addVoice(v), [pi, v]);
  
  return (
    <VoiceContext.Provider value={v}>
      <ParamNameContext.Provider value={v}>
        {children}
      </ParamNameContext.Provider>
    </VoiceContext.Provider>
  );
}

type ADSRProps = WithOut & {
  name?: string;
  a: number;
  d: number;
  s: number;
  r: number;
  max?: number;
  delay?: number;
  children?: WithInChildren,
}

export function ADSR({
  name,
  a, d, s, r,
  max = 1,
  delay = 0,
  children,
  ...without
}: ADSRProps) {
  const adsrCb = useAdsrCb(a, d, s, r, max, delay);

  if (children) {
    return <Gain name={name} gain={[0, adsrCb]} {...without}>
      {children}
    </Gain>;
  } else {
    return <Const name={name} value={[0, adsrCb]} {...without} />;
  }
}

const MAX_VOICES = 256;

type PolyInstrProps = {
  name: string;
  voices: number;
  children: any;
};

export function PolyInstr({name, voices, children}: PolyInstrProps) {
  const [pi] = useState(() => new PolyInstrData());

  const vs = useMemo(() => {
    const res: any[] = [];
    let vc = voices;
    if (vc < 1) vc = 1;
    if (vc > MAX_VOICES) vc = MAX_VOICES;
    for (let i = 0; i < vc; i++) res.push(<Voice key={i}>{children}</Voice>);
    return res;
  }, [voices, children]);

  const band = useBand();
  useEffect(() => band.addInstr(name, pi), [band, name, pi]);
  
  return (
    <PolyInstrContext.Provider value={pi}>
      {vs}
    </PolyInstrContext.Provider>
  );
}

type MonoInstrProps = {
  name: string;
  children: any;
  notePrio: NotePrio;
};

export function MonoInstr({name, notePrio, children}: MonoInstrProps) {
  const [mi] = useState(() => new MonoInstrData());

  const band = useBand();
  useEffect(() => band.addInstr(name, mi), [band, name, mi]);

  useEffect(() => {
    mi.notePrio = notePrio;
  }, [mi, notePrio]);
  
  return (
    <VoiceContext.Provider value={mi}>
      <ParamNameContext.Provider value={mi}>
        {children}
      </ParamNameContext.Provider>
    </VoiceContext.Provider>
  );
}
