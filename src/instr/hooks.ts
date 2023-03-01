import { useEffect, useMemo, useState } from 'react';
import { AParamCB } from '../audio/types';
import { ParamProxy } from '../param/types';

import { useVoice } from './ctx';

export function useAdsrCb(
  a: number, d: number, s: number, r: number,
  max: number = 1, del: number = 0,
  velSense: number = 1,
): AParamCB {
  const v = useVoice();
  const [pp] = useState(() => new ParamProxy());
  
  useEffect(() => {
    const unsubs = [
      v.onStart(({time, vel}) => {
        const vf = ((vel ?? 1 - 1) * velSense) + 1;
        console.log('start', vel, vf);
        pp.forEach(p => p
          .cancelAndHoldAtTime(time)
          .setTargetAtTime(max * vf, time + del, a / 4)
          .setTargetAtTime(s * vf, time + del + a, d / 4)
        );
      }),
      v.onStop(({time}) => {
        pp.forEach(p => p
          .cancelAndHoldAtTime(time)
          .setTargetAtTime(0, time, r / 4)
        );
      }),
      v.onCut(({time}) => {
        pp.forEach(p => p
          .cancelAndHoldAtTime(time)
          .linearRampToValueAtTime(0, time + 0.01)
        );
      }),
    ];
    
    return () => {
      unsubs.forEach((u) => u());
    }
  }, [pp]);

  return useMemo(() => (p) => pp.add(p), [pp]);
}
