import { ADSR } from '../instr/comps';
import { Const, Filter, Gain, Noise, Osc } from './basic';
import { Cut, SendRecv } from './core';

export function TriSaw({freq = 440}: {freq?: number}) {
  return <SendRecv>
    <ADSR name="env" a={0.01} d={0.1} s={0.9} r={0.5} max={0.3}>
      <Filter type="lowpass" detune={<ADSR a={0.1} d={0.6} s={0} r={0.5} max={10000} />}>
        <Osc name="saw" type="sawtooth" frequency={freq - 3} detune={['lfo', 'detune']} />
        <Osc name="saw" type="sawtooth" frequency={freq + 3} detune={['lfo', 'detune']} />
      </Filter>
      <Cut>
        <ADSR name="lfo" a={0.5} d={1} s={1} r={0.5} max={30} delay={0.7} sendTo="lfo">
          <Osc type="sine" frequency={4} />
        </ADSR>
      </Cut>
    </ADSR>
  </SendRecv>;
}

export function NoisePing() {
  return (
    <ADSR name="e" a={0.001} d={0.1} s={0} r={0.1} max={0.3}>
      <Filter type="highpass" frequency={10000} detune="halfDetune" Q={10}>
        <Noise type="white" />
      </Filter>
      <Cut>
        <Gain gain={0.2} sendTo="halfDetune"><Const value="detune"/></Gain>
      </Cut>
      <Osc name="sgn" type="sine" detune="detune" />
    </ADSR>
  )
}
