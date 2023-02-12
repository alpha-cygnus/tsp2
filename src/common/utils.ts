export function unreachable(x: never): never {
  throw new Error(`unreachable! ${x}`);
}
