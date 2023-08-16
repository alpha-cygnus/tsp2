export class ParseError extends Error {
  subs: ParseError[];
  input: ParserInput;

  constructor(code: string, input: ParserInput, subs: ParseError[] = []) {
    super(code);
    this.subs = subs;
    this.input = input;
  }
}

export class ParserInput {
  s: string;
  i: number = 0;

  constructor (s: string, i: number = 0) {
    this.s = s;
    this.i = i;
  }

  toString(): string {
    return this.s.slice(this.i);
  }

  slice(n: number) {
    return new ParserInput(this.s, this.i + n);
  }
}

export class Parser<D> {
  parse(input: ParserInput): {res: D, tail: ParserInput} {
    throw new ParseError('ABSTRACT', input);
  }
  map<B>(fn: (d: D) => B): Parser<B> {
    return new ParserMap(this, fn);
  }
  opt(): Parser<D | null> {
    return new ParserOpt(this);
  }
  many(min = 0, max = 0): Parser<D[]> {
    return new ParserMany(this, min, max);
  }
  or<PD extends ParseDef>(other: PD) {
    return new ParserOr(this, make(other));
  }
  error(code: string) {
    return new ParserError(this, code);
  }
  parseString(s: string) {
    const {res, tail} = this.parse(new ParserInput(s));
    if (tail.toString() !== '') {
      // throw new ParseError('EOF expected', tail);
      return tail;
    }
    return res
  }
}

export class ParserMap<A, B> extends Parser<B> {
  src: Parser<A>;
  fn: (a: A) => B;
  constructor(src: Parser<A>, fn: (a: A) => B) {
    super();
    this.src = src;
    this.fn = fn;
  }

  parse(input: ParserInput) {
    const {res, tail} = this.src.parse(input);
    return {res: this.fn(res), tail};
  }
}

export class ParserEq extends Parser<string> {
  ptn: string;

  constructor (ptn: string) {
    super();
    this.ptn = ptn;
  }

  parse(input: ParserInput) {
    const s = this.ptn;

    if (input.toString().slice(0, s.length) === s) {
      return {res: s, tail: input.slice(s.length)};
    }

    throw new ParseError(`${s} expected`, input);
  }
}

export class ParserOpt<A> extends Parser<A | null> {
  sub: Parser<A>;

  constructor (sub: Parser<A>) {
    super();
    this.sub = sub;
  }

  parse(input: ParserInput) {
    try {
      return this.sub.parse(input);
    } catch (e) {
      return {res: null, tail: input};
    }
  }
}

export class ParserMany<A> extends Parser<A[]> {
  sub: Parser<A>;
  min: number;
  max: number;

  constructor (sub: Parser<A>, min = 0, max = 0) {
    super();
    this.sub = sub;
    this.min = min;
    this.max = max;
  }

  parse(input: ParserInput) {
    const {min, max, sub} = this;
    const result: A[] = [];
    let inp = input;
    const le: ParseError[] = [];

    while (!max || result.length < max) {
      try {
        const {res, tail: ni} = sub.parse(inp);
        result.push(res);
        inp = ni;
      } catch (e) {
        if (e instanceof ParseError) {
          le.push(e);
          break;
        }
        else throw e;
      }
    }

    if (result.length < min) {
      throw new ParseError('MIN', input, le);
    }

    return {res: result, tail: inp};
  }
}

export class ParserOr<A, B> extends Parser<A | B> {
  pa: Parser<A>;
  pb: Parser<B>;

  constructor(pa: Parser<A>, pb: Parser<B>) {
    super();
    this.pa = pa;
    this.pb = pb;
  }

  parse(input: ParserInput) {
    try {
      return this.pa.parse(input);
    } catch(e) {
      return this.pb.parse(input);
    }
  }
}

export class ParserError<A> extends Parser<A> {
  org: Parser<A>;
  err: string;

  constructor(org: Parser<A>, err: string) {
    super();
    this.org = org;
    this.err = err;
  }

  parse(input: ParserInput) {
    try {
      return this.org.parse(input);
    } catch (e) {
      if (e instanceof ParseError) throw new ParseError(this.err, input, [e])

      throw e;
    }
  }
}

type DSOfPS<PS extends [...Parser<any>[]]> = {[K in keyof PS & number]: DOfParser<PS[K]>};

export class ParserOneOf<PS extends [...Parser<any>[]], DS = DSOfPS<PS>> extends Parser<DS[keyof DS]> {
  subs: PS;

  constructor(subs: PS) {
    super();
    this.subs = subs;
  }

  parse(input: ParserInput) {
    const es: ParseError[] = [];

    for (const sub of this.subs) {
      try {
        return sub.parse(input);
      } catch (e) {
        if (e instanceof ParseError) {
          es.push(e);
          continue;
        }
        throw e;
      }
    }

    throw new ParseError('NO VAR', input, es);
  }
}

type DOfParser<P> = P  extends Parser<infer D> ? D : never;

export class ParserSeq<AS extends [...Parser<any>[]]> extends Parser<{[I in keyof AS]: DOfParser<AS[I]>}> {
  subs: AS;

  constructor(subs: AS) {
    super();
    this.subs = subs;
  }

  // @ts-ignore
  parse(input: ParserInput) {
    const result = [];
    let inp = input;
    for (const sub of this.subs) {
      const {res: ri, tail} = sub.parse(inp);
      result.push(ri);
      inp = tail;
    }

    return {res: result, tail: inp};
  }
}

export class ParserSeqObj<AS extends Record<any, Parser<any>>> extends Parser<{[I in keyof AS]: DOfParser<AS[I]>}> {
  subs: AS;

  constructor(subs: AS) {
    super();
    this.subs = subs;
  }

  // @ts-ignore
  parse(input: ParserInput) {
    const result = {};
    let inp = input;
    for (const key of Object.keys(this.subs)) {
      const sub = this.subs[key];
      const {res: ri, tail} = sub.parse(inp);
      // @ts-ignore
      result[key] = ri;
      inp = tail;
    }

    return {res: result, tail: inp};
  }
}

type ParseFunc<D> = (input: ParserInput) => {res: D, tail: ParserInput};

export class ParserFunc<D> extends Parser<D> {
  func: ParseFunc<D>;

  constructor(func: ParseFunc<D>) {
    super();
    this.func = func;
  }

  parse(input: ParserInput) {
    return this.func(input);
  }
}

export function eq(s: string): Parser<string> {
  return new ParserEq(s);
}

export function re(exp: RegExp, name?: string): Parser<string> {
  return new ParserFunc((input: ParserInput) => {
    const m = input.toString().match(exp);
    if (!m || m.index !== 0 || m[0].length === 0) throw new ParseError(`${name || exp} expected`, input);
    const res = m[0];
    return {res, tail: input.slice(res.length)};
  });
}

type ParseDef = string | RegExp | Parser<any>;

type DOfPD<PD extends ParseDef> = PD extends Parser<infer D> ? D : string;

export function make(pd: string): Parser<string>;
export function make(pd: RegExp): Parser<string>;
export function make<V>(pd: Parser<V>): Parser<V>;
export function make<PD extends ParseDef>(pd: PD): Parser<DOfPD<PD>>;
export function make(pd: ParseDef): Parser<any> {
  if (pd instanceof Parser) return pd;
  if (typeof pd === 'string') {
    return eq(pd);
  }
  if (pd instanceof RegExp) {
    return re(pd);
  }
  return pd;
}

export function seq<AS extends [...ParseDef[]]>(...args: AS): Parser<{[K in keyof AS]: DOfPD<AS[K]>}> {
  return new ParserSeq(args.map(make)) as any;
}

export function oneOf<AS extends [...ParseDef[]], DS = {[K in keyof AS & number]: DOfPD<AS[K]>}>(...args: AS): Parser<DS[keyof DS]> {
  return new ParserOneOf(args.map(make)) as any;
}

export function list<PI extends ParseDef, PS extends ParseDef>(pi: PI, ps: PS) {
  return seq(pi, seq(ps, pi).many()).map(([a, tail]) => {
    return [a, ...tail.map(([, item]) => item)];
  });
}
