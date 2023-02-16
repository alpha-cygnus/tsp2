import { useEffect, useState } from "react";
import { Gain, Pan } from "../audio/comps";
import { WithIn, WithOut } from "../audio/types";
import { ParamContext } from "../param/ctx";
import { useStage } from "./ctx";
import { TrackData } from "./types";

type TrackProps = WithIn & WithOut & {
  name: string;
  gain?: number;
  pan?: number;
}

export function Track({name, gain, pan, children}: TrackProps) {
  const [td] = useState(() => new TrackData());

  const sd = useStage();

  useEffect(() => sd.tracks.add(name, td), [name, td]);

  return (
    <ParamContext.Provider value={td.pcd}>
      <Gain gain={[gain, "gain"]}>
        <Pan pan={[pan, "pan"]}>
          {children}
        </Pan>
      </Gain>
    </ParamContext.Provider>
  );
}
