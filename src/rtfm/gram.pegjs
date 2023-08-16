{
const NOTES='CDEFGAB';
function endot(n, dc) {
	let res = n;
	let inc = n/2;
    for (let i = 0; i < dc; i++) {
    	res += inc;
        inc /= 2;
    }
    return res;
}
const fifths = 'FCGDAEB';
const pitchToNum = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
}
const numPitches = ['C-', 'C#', 'D-', 'D#', 'E-', 'F-', 'F#', 'G-', 'G#', 'A-', 'A#', 'B-'];
function processBars(bars) {
	let keyRepitch = {};
	const applyPref = (pref) => {
		if (pref._ === 'Key') {
			const {key} = pref;
			const pitches = key < 0 ? fifths.slice(key) : fifths.slice(0, key);
			keyRepitch = {};
			for (const p of pitches) keyRepitch[p] = key < 0 ? -1: 1;
		}
	}

	const res = [];
    let at = 0;

	for (const bar of bars) {
		bar.prefs.map(applyPref);
		const repitch = {...keyRepitch};
		for (const note of bar.notes) {
			const {dur} = note;
            const t = at;
            at += dur * 4;
			if (note._ === 'Rest') {
				res[t] = '===';
				continue;
			}
            if (note._ === 'Tie') {
                continue;
            }
			const {note: {pitch, oct, acc}} = note;
			if (acc != null) {
				repitch[pitch] = acc;
			}
			const n = pitchToNum[pitch] + (repitch[pitch] || 0) + oct * 12;

			res[t] = numPitches[n % 12] + Math.floor(n / 12);
		}
	}
    res.length = at;

	return [...res].map((l, i) => i.toString(16).padStart(3, '0') + ' ' + (l || '...'));
}
}

S = WS* @Bars (WS* '|')? WS*
Bars = bs:(Bar |1.., WS* '|' WS*|) { return processBars(bs) }
Bar = p:BarPref* ns:((Note / Rest / Tie) |1.., WS|) {
	return {
    	_: 'Bar',
    	prefs: p,
      notes: ns,
    }
}
BarPref = Key
Key = 'k:' i:Int WS { return {
	_: 'Key',
	key: i,
}}
Note = a:(Acc?) i:Pitch d:Duration? {
	return {
		_: 'Note',
		dur: d || 1,
		note: {
			pitch: NOTES.at(i % 7),
			oct: Math.floor(i/7) + 4,
			acc: a,
    }
	}
}
Duration = d:(Dur?) dd:'.'* { return endot(d || 1, dd?.length || 0) }
Dur = d:('/'|1..2|) { return Math.pow(2, -d.length); }
	/ 'o' { return 2;}
    / 'O' { return 4; }

Rest = ('p'/'r'/'z') d:(Duration?) {
	return {
        _: 'Rest',
    	dur: d || 1,
	};
}
Tie = ('t'/'~') d:(Duration?) {
	return {
    	_: 'Tie',
        dur: d || 1,
    };
}
Pitch = Int
Int = n:$('-'? [0-9]+) { return parseInt(n) }
Acc = '#' {return 1;} / 'b' {return -1} / '=' { return 0}
WS = ' '
