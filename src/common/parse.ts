import produce, {Immutable} from 'immer';

type Loc<D> = {
  i: number;
  l: number;
  c: number;
  data: D;
};

export type Parse<T, D> = (s: string, loc: Loc<D>) => [T, Loc<D>];

export class ParseError<D> extends Error {
  loc: Loc<D>;

  constructor(desc: string, loc: Loc<D>) {
    super(desc);
    this.loc = loc;
  }
}

function _locInc<D>(loc: Loc<D>, by: string): Loc<D> {
  const res = {...loc};
  res.i += by.length;
  for (const c of by) {
    switch (c) {
      case '\n':
        res.c = 0;
        res.l++;
        break;
      case '\r':
        res.c = 0;
        break;
      case '\t':
        res.c += 8;
        break;
      default:
        res.c++;
        break;
    }
  }
  return res;
}

export function opt<T, D>(p: Parse<T, D>): Parse<T | null, D> {
  return (s, loc) => {
    try {
      return p(s, loc);
    } catch {
      return [null, loc];
    }
  }
}

export function many<T, D>(p: Parse<T, D>): Parse<T[], D> {
  return (s, loc) => {
     const res: T[] = [];
     for (;;) {
       try {
         const [t, l] = p(s, loc);
         res.push(t);
         loc = l;
       } catch {
         break;
       }
     }
     return [res, loc];
   }
}

export function many1<T, D>(p: Parse<T, D>): Parse<T[], D> {
  return map(seq(p, many(p)), ([r, rs]) => [r, ...rs]);
}

export function eq<D = any>(str: string): Parse<string, D> {
  return (s, loc) => {
    if (s.slice(loc.i).startsWith(str)) {
      return [str, _locInc(loc, str)];
    }
    throw new ParseError(`${str} expected`, loc);
  }
}

export function match<D = any>(re: RegExp, desc: string): Parse<string, D> {
  return (s, loc) => {
    const m = s.slice(loc.i).match(re);
    if (!m || (m.index || 0) > 0) throw new ParseError(`Expected ${desc}`, loc);
    const res = m[0];
    return [res, _locInc(loc, res)];
  }
}
  
export const ews = <D>(): Parse<string, D> => match(/[ \r\n\t]*/, ' ');
  
type ParseList<TS extends [...any[]], D> = {[I in keyof TS]: Parse<TS[I], D>};

export function seq<TS extends [...any[]], D>(...ps: ParseList<TS, D>): Parse<TS, D> {
  return (s, loc) => {
    // @ts-ignore
    const rs: TS = ps.map((p) => {
      const [r, l] = p(s, loc);
      loc = l;
      return r;
    });
    return [rs, loc];
  }
}

type Upd<D> = (d: D) => void;

export function map<A, B, D>(p: Parse<A, D>, f: (a: A, data: D, setData: (u: Upd<D>) => void) => B): Parse<B, D> {
  return (s, loc) => {
    const [r, l] = p(s, loc);
    let resLoc = l;
    const setData = (u: Upd<D>) => {
      const newData = produce(u)(l.data as Immutable<D>);
      if (newData !== l.data) {
        resLoc = {...l, data: newData};
      }
    };
    const res = f(r, l.data, setData);
    return [res, resLoc];
  }
}

export function mapData<T, D>(p: Parse<T, D>, f: (data: D, t: T) => void): Parse<null, D> {
  return (s, loc) => {
    const [r, l] = p(s, loc);
    const resLoc = produce((l) => {
      f(l.data, r);
    })(l);
    return [null, resLoc];
  }
}

export function oneOf<T, D>(...ps: Parse<T, D>[]): Parse<T, D> {
  return (s, loc) => {
    const es: ParseError<D>[] = [];
    for (const p of ps) {
      try {
        return p(s, loc);
      } catch(e) {
        if (e instanceof ParseError) {
          es.push(e);
        } else {
          throw e;
        }
      }
    }
    throw new ParseError(`one of (${es.map((e) => e.message).join(',')})`, loc);
  }
}

export function trim<T, D>(p: Parse<T, D>): Parse<T, D> {
  return map(seq(ews(), p, ews()), ([, t,]) => t);
}

export const parseString = <T, D>(p: Parse<T, D>, data: D) => (s: string): T => {
  const [res, loc] = p(s, {i: 0, l: 0, c: 0, data});
  console.log(loc);
  if (loc.i < s.length) throw new ParseError('Smth wrong here', loc);
  return res;
}
