import { createContext, useContext, useEffect } from "react";

import { ParamContextData } from './types';

export const ParamContext = createContext<ParamContextData | null>(null);

export function useAddParam(name: string, param: AudioParam) {
  const cd = useContext(ParamContext);
  
  useEffect(() => {
    if (!cd) return;
    return cd.add(name, param);
  }, [cd, name, param]);
}
