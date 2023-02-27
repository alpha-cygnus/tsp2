import { BandData } from '../instr/types';
import { StageData } from '../track/types';

export class LoopsData {
  song: SongData;

  constructor(song: SongData) {
    this.song = song;
  }
}

export class SongData {
  band = new BandData();
  stage = new StageData();
}

