import { createContext, useContext } from 'react';
import { StageData } from './types';

export const StageContext = createContext<StageData>(new StageData());

export function useStage(): StageData {
  return useContext(StageContext);
}
