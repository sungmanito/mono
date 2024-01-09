export function sleep(timeout: number) {
  return new Promise((res) => {
    setTimeout(() => res(void 0), timeout);
  });
}

export async function* rateLimit(reqsPerSecond: number, signal?: AbortSignal) {
  // How long is the timeout for this many requests per second?
  const timeout = 1000 / reqsPerSecond;
  // Should we run?
  let run = true;
  // If we are passed a signal, we want to add the event listener
  if (signal) signal.addEventListener('abort', () => (run = false));
  // While we are running, yield the timeout value, sleep the given amount of time, and move
  while (run) {
    yield timeout;
    await sleep(timeout);
  }
}
