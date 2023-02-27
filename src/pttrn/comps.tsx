import { useEffect, useState } from 'react';
import { useBand } from '../instr/ctx';
import { useGetTime } from '../root/ctx';
import { cookPttrn } from './core';
import { usePttrns } from './ctx';
import { PttrnData, PttrnFunc } from './types';

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

  useEffect(() => {
    const res = cookPttrn(pttrns, name, 120);
    console.log('COOKED', name, res);
    const t0 = gt();
    const played = new Set<string>();
    for (const [t, item] of res.seq) {
      if ('icmd' in item) {
        const {cmd, ins} = item.icmd;
        played.add(ins);
        band.withEach(ins, (instr) => {
          instr.cmd(t + t0, cmd);
        });
      }
    }

    return () => {
      for (const ins of played) {
        const t = gt();
        band.withEach(ins, (instr) => {
          instr.cmd(t, {cut: {}});
        });
      }
    };
  }, [pttrns, name]);

  return null;
}