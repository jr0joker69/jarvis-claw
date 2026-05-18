interface CircuitState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

const breakers = new Map<string, CircuitState>();
const THRESHOLD = 3;
const TIMEOUT = 60000; // 1 minute

export function getBreaker(name: string) {
  if (!breakers.has(name)) {
    breakers.set(name, { failures: 0, lastFailureTime: 0, state: 'CLOSED' });
  }
  return breakers.get(name)!;
}

export async function callWithBreaker<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const breaker = getBreaker(name);

  if (breaker.state === 'OPEN') {
    if (Date.now() - breaker.lastFailureTime > TIMEOUT) {
      breaker.state = 'HALF_OPEN';
      console.log(`[CIRCUIT] ${name}: HALF_OPEN, trying request...`);
    } else {
      throw new Error(`Circuit breaker OPEN for ${name}. Try again later.`);
    }
  }

  try {
    const result = await fn();
    breaker.failures = 0;
    breaker.state = 'CLOSED';
    return result;
  } catch (err: any) {
    breaker.failures++;
    breaker.lastFailureTime = Date.now();
    if (breaker.failures >= THRESHOLD) {
      breaker.state = 'OPEN';
      console.log(`[CIRCUIT] ${name}: OPEN after ${breaker.failures} failures`);
    }
    throw err;
  }
}
