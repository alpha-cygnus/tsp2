export function eu(k: number, n: number, d: number = 0): string {
  k = Math.round(k);
  n = Math.round(n);
  d = Math.round(d);
  if (n < 1) n = 1;
  if (k > n) k = n;
  if (k < 1) k = 1;
  if (Math.abs(d) >= n) {
    d = d > 0 ? n - 1 : 1 - n;
  }

  let a = k;
  let b = n - k;
  let sa: string = 'x';
  let sb: string = '.';

  while (b > 1) {
    [a, b, sa, sb] = a > b
      ? [b, a - b, sa + sb, sa]
      : [a, b - a, sa + sb, sb]
  }

  let res = sa.repeat(a) + sb.repeat(b);
  if (d) res = res.slice(-d) + res.slice(0, -d);
  return res;
}
