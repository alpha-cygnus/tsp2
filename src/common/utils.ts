export function unreachable(x: never): never {
  throw new Error(`unreachable! ${x}`);
}

export function notNull<T>(x: T | null): x is T {
  if (x == null) return false;
  return true;
}
