import { useEffect, useMemo, useRef, useState } from 'react';
import { NodeInOut } from '../audio/comps';
import { useAnalyser } from '../audio/hooks';
import { WithIn, WithOut } from '../audio/types';
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
    return band.get(instrName);
  }, [band, instrName]);

  useEffect(() => () => {
    instr.cmd(getTime(), {cut: {}});
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
        instr.cmd(getTime(), {cut: {}});
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

type ScopeProps = WithIn & WithOut & {
};

export function Scope({...rest}: ScopeProps) {
  const node = useAnalyser();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [paused, setPaused] = useState(false);

  const width = 1200;
  const height = 800;

  useEffect(() => {
    if (paused) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const res = new Uint8Array(node.fftSize);
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    let id: number;
    const draw = () => {
      node.getByteTimeDomainData(res);

      canvasCtx.fillStyle = 'rgb(0, 0, 0)';
      canvasCtx.fillRect(0, 0, width, height);

      canvasCtx.lineWidth = 3;
      canvasCtx.strokeStyle = 'rgb(0, 255, 0)';
      canvasCtx.beginPath();

      const sliceWidth = 1; //width * 1.0 / res.length;
      let i0 = 0;
      for (let i = 1; i < res.length; i++) {
        if (res[i] >= 128 && res[i - 1] < 128) {
          i0 = res[i] - 128 < 128 - res[i - 1] ? i : i - 1;
          break;
        }
      }
      let x = 0;
      for (let i = 0; i <= width / sliceWidth; i++) {
        const v = res[i + i0] / 128.0;
        const y = v * height / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }
      // canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();

      id = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(id);
    }
  }, [node, paused]);

  return <>
    <NodeInOut node={node} {...rest} />
    <div className="scope">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: width / 2,
          height: height / 2,
        }}
        onClick={() => setPaused(x => !x)}
      />
    </div>
  </>;
}
