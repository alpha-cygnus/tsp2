import './App.css';
import {Filter, Osc, Cut, Destination, Gain} from './audio/comps';
import {useNodeRef} from './audio/hooks';
import { ADSR, MonoInstr, PolyInstr } from './instr/comps';
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

function App() {
  return (
    <>
      <TSPRoot>
        <Destination>
          <Scope>
            <Gain gain={0.2}>
              <PolyInstr name="test" voices={8}>
                <TestSyn />
              </PolyInstr>
            </Gain>
            {/* <MonoInstr name="test" notePrio="last">
              <TestSyn />
            </MonoInstr> */}
          </Scope>
        </Destination>
        <Keys instrName="test" />
      </TSPRoot>
    </>
  );
}

export default App;
