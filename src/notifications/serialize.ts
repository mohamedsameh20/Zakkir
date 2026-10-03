/**
 * Wrap an async function so calls run one at a time, in call order. A call
 * that fails doesn't block the ones queued after it.
 */
export function serialize<A extends unknown[]>(fn: (...args: A) => Promise<void>): (...args: A) => Promise<void> {
  let tail: Promise<void> = Promise.resolve();
  return (...args: A) => {
    const run = tail.then(() => fn(...args));
    tail = run.catch(() => undefined);
    return run;
  };
}
