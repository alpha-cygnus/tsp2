import {make as p, seq, oneOf, list} from './pc';

export const WS = p(/[ \t]/).many(1);

export const Acc = oneOf(p('#').map(() => 1), p('b').map(() => -1), p('=').map(() => 0));

export const Int = seq(p('-').opt(), p(/[0-9]/).many(1)).map(([sgn, digs]) => (sgn ? -1 : 1) * parseInt(digs.join('')));

export const Pitch = Int;

export const Dur = oneOf(
  p('/').many(1, 2).map((s) => Math.pow(2, -s.length)),
  p('o').map(() => 2),
  p('O').map(() => 4),
);

function endot(n: number, dc: number): number {
	let res = n;
	let inc = n/2;
    for (let i = 0; i < dc; i++) {
      res += inc;
      inc /= 2;
    }
    return res;
}

export const Duration = seq(Dur.opt(), p('.').many()).map(([d, dd]) => endot(d || 1, dd.length))

export const Tie = seq(/[t~]/, Duration).map(([, d]) => ({_: 'tie' as const, dur: d}));

export const Rest = seq(/[prz]/, Duration).map(([, d]) => ({_: 'rest' as const, dur: d}));

const NOTES = 'CDEFGAB';

export const Note = seq(Acc.opt(), Pitch, Duration).map(([a, p, d]) => ({
  _: 'Note' as const,
  dur: d,
  note: {
    pitch: NOTES.at(p % 7),
    oct: Math.floor(p / 7) + 4,
    acc: a,
  },
}));

export const Key = seq('k:', Int, WS).map(([, i]) => ({
  _: 'Key' as const,
  key: i,
}));

export const BarPref = Key;

export const Bar = seq(BarPref.many(), list(oneOf(Note, Rest, Tie), WS.many(1))).map(([prefs, notes]) => ({
  _: 'Bar' as const,
  prefs,
  notes,
}));

export const BarSep = p(/[|\r\n]/).many(1);

function processBars(bars: any) {
  return bars;
}

export const Bars = list(Bar, seq(WS.many(), BarSep, WS.many()).many(1)).map((bars) => processBars(bars));

export {list};