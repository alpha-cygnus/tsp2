import { useEffect, useState } from 'react';
import { unreachable } from '../common/utils';
import { useBand } from '../instr/ctx';
import { useGetTime } from '../root/ctx';
import { useStage } from '../track/ctx';
import { cookPttrn, splitPName } from './core';
import { usePttrns } from './ctx';
import { ParamSetName, PttrnData, PttrnFunc } from './types';

type PttrnProps = {
  name: string;
  children: PttrnFunc;
}

export function Pttrn({name, children}: PttrnProps) {
  const [func] = useState(() => children);

  const pttrns = usePttrns();

  useEffect(() => pttrns.add(name, new PttrnData(name, func)), [name, func, pttrns]);

  return null;
}

export type PlayProps = {
  name: string;
}
  
export function Play({name}: PlayProps) {
  const band = useBand();

  const gt = useGetTime();

  const pttrns = usePttrns();

  const stage = useStage();

  useEffect(() => {
    const res = cookPttrn(pttrns, name, 120);
    console.log('COOKED', name, res);
    const t0 = gt();
    const played = new Set<string>();
    const pset = new Map<ParamSetName, {lin?: boolean}>();

    const applyParamSet = (psn: ParamSetName, setter: (p: AudioParam) => void) => {
      const [dest, dn, pn] = splitPName(psn);
    
      if (dest === 'ins') {
        band.withEach(dn, (instr) => {
          instr.withParam(pn, setter);
        });
        return;
      }
    
      if (dest === 'trk') {
        stage.tracks.withEach(dn, (trk) => {
          trk.pcd.withEach(pn, setter);
        });
        return;
      }
    
      unreachable(dest);
    };

    for (const [t, item] of res.seq) {
      if ('icmd' in item) {
        const {cmd, ins} = item.icmd;
        played.add(ins);
        band.withEach(ins, (instr) => {
          instr.cmd(t + t0, cmd);
        });
      }
      if ('param' in item) {
        const {name: psn, val, lin} = item.param;

        pset.set(psn, {lin});

        applyParamSet(psn, (p) => {
          if (lin) {
            p.linearRampToValueAtTime(val || 0, t + t0);
          } else {
            if (val == null) {
              p.cancelAndHoldAtTime(t + t0);
            } else {
              p.setValueAtTime(val, t + t0);
            }
          }
        });
      }
    }

    return () => {
      const t = gt();
      
      for (const ins of played) {
        band.withEach(ins, (instr) => {
          instr.cmd(t, {cut: {}});
        });
      }
      
      for (const psn of pset.keys()) {
        applyParamSet(psn, (p) => {
          p.cancelScheduledValues(t);
        });
      }
    };
  }, [pttrns, stage, name]);

  return null;
}