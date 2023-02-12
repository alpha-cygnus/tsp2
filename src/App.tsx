// import React, { useCallback, useState } from 'react';
import { useCallback } from 'react';
import './App.css';
import {Filter, Osc, Cut, ADSR, Scope, Destination} from './audio/comps';
import {useNodeRef} from './audio/hooks';
import { useSListen } from './hs/hooks';
import { TSPRoot } from './root/comps';
import { useBeatEvents, useMidiEvents } from './root/ctx';
import {Piano} from './midi/comps';

import {Part} from './score/comps';
import { useDetuneFromNotes } from './midi/hs';

// import {Key} from '@tonaljs/tonal';


export function TestSyn({freq = 440}: {freq?: number}) {
  const lfo = useNodeRef();
  const midi$ = useMidiEvents();
  const detune$ = useDetuneFromNotes(midi$);

  return (
    <ADSR name="env" a={0.01} d={0.1} s={0.9} r={0.5} max={0.3}>
      <Filter type="lowpass" detune={<ADSR a={0.1} d={0.6} s={0} r={0.5} max={10000} />}>
        <Osc name="saw" type="sawtooth" frequency={freq - 3} detune={[lfo, detune$]} />
        <Osc name="saw" type="sawtooth" frequency={freq + 3} detune={[lfo, detune$]} />
      </Filter>
      <Cut>
        <ADSR name="lfo" a={0.5} d={1} s={1} r={0.5} max={30} delay={0.7} nodeRef={lfo}>
          <Osc type="sine" frequency={4} />
        </ADSR>
      </Cut>
    </ADSR>
  );
}

// function TestSyn1({freq}: {freq: number}) {
//   const lfo = useNodeRef();

//   return (
//     <Gain gain={<ADSR a={0.01} d={0.1} s={0.1} r={0.5} />}>
//       <Filter type="lowpass">
//         <Osc type="sawtooth" frequency={freq + 3} detune={[lfo, noteToDetune]} />
//         <Osc type="sawtooth" frequency={freq - 3} detune={[noteToDetune]} />
//       </Filter>
//     </Gain>
//   );
// }

export function Debug() {
  const beats = useBeatEvents();
  
  useSListen(beats, useCallback((e) => {
    console.log('BEAT', e);
  }, []));

  return null;
}

function App() {
  // const [playing, setPlaying] = useState(false);

  // const btnClk = useCallback(() => {
  //   setPlaying(p => !p);
  // }, []);

  return (
    <>
      <Part>kb3 s4/4 A5 r10 C4. ^5. ABCDEFG
        | s6/8 t8 A'A'A,BB</Part>
      <TSPRoot>
        <Piano from={24} to={71} />
        <Destination>
          <Scope>
            <TestSyn />
          </Scope>
        </Destination>
      </TSPRoot>
    </>
  );
  /*
    <MidiRoot lag={0.01}>
      <div className="App">
        <button onClick={btnClk}>{playing ? 'STOP' : 'PLAY'}</button>
        {playing && <>
          <Destination>
            <Gain gain={0.3}>
              {/* <MidiFilter filter={midiChannel(0)}>
                <MidiFilter filter={randomDelay(0.5)}>
                  <TestSyn freq={440} />
                </MidiFilter>
              </MidiFilter> *}
              <MidiChannel ch={0}>
                <TestSyn freq={440} />
              </MidiChannel>
              <MidiChannel ch={1}>
                <TestSyn freq={440} />
              </MidiChannel>
              <MidiChannel ch={2}>
                <TestSyn freq={440} />
              </MidiChannel>
              <MidiChannel ch={3}>
                <TestSyn freq={440} />
              </MidiChannel>
              <MidiChannel ch={4}>
                <TestSyn freq={440} />
              </MidiChannel>
              <MidiChannel ch={5}>
                <TestSyn freq={440} />
              </MidiChannel>
            </Gain>
          </Destination>
          <ChordSender chs={[0, 1, 2]} chord="CM" className="test-sender" /> 
          <ChordSender chs={[3, 4, 5]} chord="Cmin" className="test-sender" /> 
        </>}
      </div>
      <Ptn d={`
        |c-4|

        |c-5|
      `}
      >
        <p>This is a text</p>
        {'some value'}
        {3.14}
        text line
        What is it?
      </Ptn>
    </MidiRoot>
  );
  */
}

export default App;
