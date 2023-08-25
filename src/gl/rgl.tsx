import {useEffect, useMemo, useState} from 'react';
import REGL from 'regl';

export function Rgl() {
  const [cnv, setCnv] = useState<HTMLCanvasElement | null>(null);

  const [regl, setRegl] = useState<REGL.Regl | null>(null);

  const draw = useMemo(() => {
    if (!regl) return null;

    return {
      tri: regl({
        frag: `
        precision highp float;
        varying vec3 pos;
        uniform float time;
        void main() {
          gl_FragColor = vec4((sin(pos + time) + 1.) / 2., 1);
        }`,

        vert: `
        precision highp float;
        attribute vec2 position;
        varying vec3 pos;
        void main() {
          gl_Position = vec4(position, 0, 1);
          pos = vec3(position, 0);
        }`,

        attributes: {
          position: [[-1, -1], [-1, 3], [3, -1]]
        },

        uniforms: {
          time: function(c) {
            return c.time;
          },
        },

        count: 3
      }),
    };
  }, [regl]);


  useEffect(() => {
    if (!cnv) return;

    const rgl = REGL(cnv);

    // console.log('RGL', rgl);

    setRegl(() => rgl);
  }, [cnv]);

  useEffect(() => {
    // console.log('RGL', {draw, regl});
    if (!draw) return;
    if (!regl) return;

    const tick = regl.frame((c) => {
      // console.log(c);
      draw.tri();
    });

    return () => {
      tick.cancel();
    }
  }, [draw, regl]);

  return (
    <canvas ref={setCnv} width={100} height={100} />
  )
}
