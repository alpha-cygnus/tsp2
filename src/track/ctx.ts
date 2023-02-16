import { createContext, useCallback, useContext } from "react";
import { StageData } from "./types";

export const StageContext = createContext<StageData | null>(null);

export function useStage(): StageData {
  const tsd = useContext(StageContext);
  if (!tsd) throw new Error('No stage. Forgot Song wrapper?');
  return tsd;
}
