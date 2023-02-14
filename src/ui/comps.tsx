import { useEffect, useMemo, useState } from 'react';
import { useBand } from '../instr/ctx';
import { useGetTime, useRootCtx } from '../root/ctx';

const noteKeys = [
  'zsxdcvgbhnjm,l.;/',
  'q2w3er5t6y7ui9o0p',
];

const keyToNote: Record<string, number> = {};

noteKeys.forEach((ks, i) => {
  [...ks].forEach((k, j) => {
    keyToNote[k] = i * 12 + j;
  })
});

type KeysProps = {
  instrName: string;
};

export function Keys({instrName}: KeysProps) {
  const band = useBand();
  const getTime = useGetTime();
  
  const instr = useMemo(() => {
    return band.getInstr(instrName);
  }, [band, instrName]);

  useEffect(() => () => {
    instr.cmd(getTime(), {omniOff: {}});
  }, [instr]);

  const [baseNote, setBaseNote] = useState(48);

  const [pressed] = useState(() => new Set<number>());

  useEffect(() => {
    const onNoteKey = (e: KeyboardEvent, cb: (note: number, time: number) => void) => {
      if (e.key in keyToNote) {
        cb(baseNote + keyToNote[e.key], getTime());
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      onNoteKey(e, (note, time) => {
        if (pressed.has(note)) return;
        pressed.add(note);
        instr.cmd(time, {on: {note, vel: 100}});
      });
      if (e.key === '[') {
        setBaseNote(baseNote - 12);
      }
      if (e.key === ']') {
        setBaseNote(baseNote + 12);
      }
      if (e.key === 'Escape') {
        instr.cmd(getTime(), {omniOff: {}});
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      onNoteKey(e, (note, time) => {
        instr.cmd(time, {off: {note, vel: 100}});
        pressed.delete(note);
      });
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, [instr, getTime, baseNote]);

  return null;
}
