import { useEffect, useState } from 'react';
import './App.css';
import { Destination, Gain, Pan } from './audio/basic';
import { Recv, Send } from './audio/core';
import { PingPong, SimpleReverb } from './audio/fx';
import { NoisePing, TriSaw } from './audio/synth';
import { MonoInstr, PolyInstr } from './instr/comps';
import { I, skip, T } from './pttrn/api';
import { Play, Pttrn } from './pttrn/comps';
import { TSPRoot } from './root/comps';
import { Keys, Scope } from './ui/comps';
import { eu } from './pttrn/utils';


// @ts-ignore
window.E = eu;

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
                <PingPong time={0.4}>
                  <PolyInstr name="test" voices={8}>
                    <TriSaw />
                  </PolyInstr>
                </PingPong>
              </Pan>
            </Gain>
            <Gain name="noise-send-pp" sendTo="pingpong">
              <MonoInstr name="nTest" notePrio="last">
                <NoisePing />
              </MonoInstr>
            </Gain>
            <SimpleReverb seconds={5} decay={5}>
              <Recv from="reverb" />
            </SimpleReverb>
            <Send to="reverb">
              <PingPong time={0.4}>
                <Recv from="pingpong" />
              </PingPong>
            </Send>
          </Scope>
        </Destination>
        <Keys instrName="nTest" />
        <Pttrn name="test">
          {() => {
            T.main.param.pan = (t) => Math.sin(t*10);
            for (let i = 0; i < 16; i++) {
              I.test.note(60 + i, 1/32);
              skip(1/16);
            }
          }}
        </Pttrn>
        <Pttrn name="test2">
          {() => {
            for (let i = 0; i < 16; i++) {
              I.nTest.note(60 - i, 1/32, i % 4 ? 0.3 : 1);
              skip(1/16);
            }
          }}
        </Pttrn>
        {playing && <>
          Playing...
          <Play name="test" />
        </>}
      </TSPRoot>
    </>
  );
}

export default App;
