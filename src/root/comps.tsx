import {useEffect, useMemo, useRef, useState} from 'react';
import { Track } from '../track/comps';

import {RootContextData, RootCtx} from './ctx';


type TSPRootProps = {
  actx?: BaseAudioContext;
  lag?: number;
  children: any;
}

export function TSPRoot({actx: a, lag: l, children}: TSPRootProps) {
  const actxRef = useRef(a || new AudioContext({
    latencyHint: 'playback',
  }));

  const lag: number = l != null && l >= 0 ? l : 0.01;

  const data: RootContextData = useMemo((): RootContextData => {
    return {
      actx: actxRef.current,
      lag,
    };
  }, [lag, ]);

  const [aState, setAState] = useState(actxRef.current.state);

  useEffect(() => {
    const actx = actxRef.current;
    const stateChange = () => {
      setAState(actx.state);
    }
    actx.addEventListener('statechange', stateChange);
    return () => {
      actx.removeEventListener('statechange', stateChange);
    };
  }, []);

  useEffect(() => {
    const actx = actxRef.current;

    console.log('actx', actx, aState);

    if (!(actx instanceof AudioContext)) return;

    if (aState !== 'suspended') return;

    const resume = () => {
      actx.resume();
      console.log('resuming');
    };

    document.addEventListener('mousedown', resume);
    document.addEventListener('keydown', resume);

    return () => {
      document.removeEventListener('mousedown', resume);
      document.removeEventListener('keydown', resume);
    }
  }, [aState]);

  const lagRef = useRef(lag);
  useEffect(() => {
    lagRef.current = lag;
  }, [lag]);

  return (
    <RootCtx.Provider value={data}>
      <Track name="main">
        {children}
      </Track>
    </RootCtx.Provider>
  );
}
