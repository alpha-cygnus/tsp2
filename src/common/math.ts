import {Ratio} from './types';

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  if (b > a) [a, b] = [b, a];
  for (;;) {
      if (b === 0) return a;
      a %= b;
      if (a === 0) return b;
      b %= a;
  }
}

export function addRatio([a, b]: Ratio, [c, d]: Ratio): Ratio {
	if (b === d) return [a + c, b];
	return simplifyRatio([a * d + b * c, b * d]);
}

export const subRatio = (x: Ratio, [a, b]: Ratio): Ratio => addRatio(x, [-a, b]);

export const mulRatio = ([a, b]: Ratio, [c, d]: Ratio): Ratio => simplifyRatio([a * c, b * d]);

export const divRatio = ([a, b]: Ratio, [c, d]: Ratio): Ratio => simplifyRatio([a * d, b * c]);

export function simplifyRatio([a, b]: Ratio): Ratio {
  const d = gcd(a, b);
  return [Math.round(a / d), Math.round(b / d)];
}
