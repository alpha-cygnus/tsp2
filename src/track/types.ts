import { ItemSet, NamedMap, WithParam } from "../common/types";
import { ParamContextData } from "../param/types";

export class TrackData {
  pcd: ParamContextData = new ParamContextData();
}

export class TrackProxy extends ItemSet<TrackData> implements WithParam {
  withParam(name: string, cb: (p: AudioParam) => void): void {
    this.forEach((td) => td.pcd.withEach(name, cb));
  }
}

export class StageData {
  tracks = new NamedMap<TrackData, TrackProxy>(() => new TrackProxy());
}
