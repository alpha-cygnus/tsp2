import { createContext, useContext } from 'react';
import { PttrnsData } from './types';

export const PttrnsContext = createContext(new PttrnsData());

export function usePttrns(): PttrnsData {
  return useContext(PttrnsContext);
}
