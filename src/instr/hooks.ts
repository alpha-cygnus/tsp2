import { useEffect, useMemo, useState } from 'react';
import { AParamCB } from '../audio/types';
import { ParamProxy } from '../param/types';

import { useVoice } from './ctx';

export function useAdsrCb(
  a: number, d: number, s: number, r: number,
  max: number = 1, del: number = 0,
): AParamCB {
  const v = useVoice();
  const [pp] = useState(() => new ParamProxy());
  
  useEffect(() => {
    const unsubs = [
      v.onStart(({time}) => {
        pp.forEach(p => p
          .cancelAndHoldAtTime(time)
          .setTargetAtTime(max, time + del, a / 4)
          .setTargetAtTime(s, time + del + a, d / 4)
        );
      }),
      v.onStop(({time}) => {
        pp.forEach(p => p
          .cancelAndHoldAtTime(time)
          .setTargetAtTime(0, time, r / 4)
        );
      }),
    ];
    
    return () => {
      unsubs.forEach((u) => u());
    }
  }, [pp]);

  return useMemo(() => (p) => pp.add(p), [pp]);
}
