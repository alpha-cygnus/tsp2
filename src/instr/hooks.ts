import { useEffect, useMemo, useState } from 'react';
import { AParamCB } from '../audio/types';
import { useVoice } from './ctx';
import { ParamProxy } from './types';

export function useAdsrCb(a: number, d: number, s: number, r: number): AParamCB {
  const v = useVoice();
  const [pp] = useState(() => new ParamProxy());
  
  useEffect(() => {
    const unsubs = [
      v.onStart(({time}) => {
        pp.cancel(time);
        pp.setTarget(1, time, a / 4);
        pp.setTarget(s, time + a, d / 4);
      }),
      v.onStop(({time}) => {
        pp.cancel(time);
        pp.setTarget(0, time, r / 4);
      }),
    ]
    return () => {
      unsubs.forEach((u) => u());
    }
  }, [pp]);

  return useMemo(() => (p) => pp.addParam(p), [pp]);
}
