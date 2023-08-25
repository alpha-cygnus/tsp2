import {useEffect, useState} from 'react';

import { GLSL, SwissGL } from './swissgl';

export function TestSwiss() {
  const [cnv, setCnv] = useState<HTMLCanvasElement | null>(null);

  const [glsl, setGlsl] = useState<GLSL | null>(null);

  useEffect(() => {
    if (!cnv) return;

    setGlsl(() => SwissGL(cnv));
  }, [cnv]);

  useEffect(() => {
    if (!glsl) return;

    let stop = false;

    glsl.loop(({time}) => {
      if (stop) return 'stop';

      glsl({
        U: {time},
        Aspect:'cover',
        FP:`sin(length(XY)*vec3(30,30.5,31)
               -time+atan(XY.x,XY.y)*3.),1`});
    });

    return () => {
      stop = true;
    };
  }, [glsl]);

  return (
    <canvas ref={setCnv} width={100} height={100} />
  )
}