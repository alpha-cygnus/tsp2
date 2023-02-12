import {createContext, useCallback, useContext} from 'react';


export type RootContextData = {
  actx: BaseAudioContext;
  lag: number;
}

export const RootCtx = createContext<RootContextData | null>(null);

export function useRootCtx(): RootContextData {
  const ctx = useContext(RootCtx);
  if (!ctx) throw new Error('Root context expected');
  return ctx;
}

export function useACtx() {
  const {actx} = useRootCtx();
  return actx;
}

export function useGetTime() {
  const {actx, lag} = useRootCtx();
  return useCallback(() => actx.currentTime + lag, [actx, lag]);
}
