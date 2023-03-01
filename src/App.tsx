import { useEffect, useState } from 'react';
import './App.css';
import {Filter, Osc, Cut, Destination, Gain, Pan, Noise} from './audio/comps';
import {useNodeRef} from './audio/hooks';
import { ADSR, MonoInstr, PolyInstr } from './instr/comps';
import { I, skip, T } from './pttrn/api';
import { Play, Pttrn } from './pttrn/comps';
import { TSPRoot } from './root/comps';
import { Keys, Scope } from './ui/comps';


export function TestSyn({freq = 440}: {freq?: number}) {
  const lfo = useNodeRef();

  return (
    <ADSR name="env" a={0.01} d={0.1} s={0.9} r={0.5} max={0.3}>
      <Filter type="lowpass" detune={<ADSR a={0.1} d={0.6} s={0} r={0.5} max={10000} />}>
        <Osc name="saw" type="sawtooth" frequency={freq - 3} detune={[lfo, "detune"]} />
        <Osc name="saw" type="sawtooth" frequency={freq + 3} detune={[lfo, "detune"]} />
      </Filter>
      <Cut>
        <ADSR name="lfo" a={0.5} d={1} s={1} r={0.5} max={30} delay={0.7} nodeRef={lfo}>
          <Osc type="sine" frequency={4} />
        </ADSR>
      </Cut>
    </ADSR>
  );
}

export function NoiseTest() {
  return (
    <Filter type="highpass" frequency={10000} Q={10}>
      <ADSR name="e" a={0.001} d={0.1} s={0} r={0.1} max={0.3}>
        <Noise type="white" />
      </ADSR>
    </Filter>
  )
}

function App() {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    document.addEventListener('keydown', (e) => {
      // console.log(e.key);
      if (e.key == ' ') {
        setPlaying(v => !v);
      }
    });
  }, []);

  return (
    <>
      <TSPRoot>
        <Destination>
          <Scope>
            <Gain gain={0.2}>
              <Pan pan="pan">
                <PolyInstr name="test" voices={8}>
                  <TestSyn />
                </PolyInstr>
              </Pan>
            </Gain>
            <MonoInstr name="nTest" notePrio="last">
              <NoiseTest />
            </MonoInstr>
          </Scope>
        </Destination>
        <Keys instrName="nTest" />
        <Pttrn name="test">
          {() => {
            T.main.param.pan = (t) => Math.sin(t*10);
            for (let i = 0; i < 16; i++) {
              I.test.note(60 + i, 1/5);
              skip(0.25);
            }
          }}
        </Pttrn>
        <Pttrn name="test2">
          {() => {
            for (let i = 0; i < 16; i++) {
              I.nTest.note(60 - i, 1/32, i % 4 ? 0.3 : 1);
              skip.note(1/16);
            }
          }}
        </Pttrn>
        {playing && <>
          Playing...
          <Play name="test2" />
        </>}
      </TSPRoot>
    </>
  );
}

export default App;
