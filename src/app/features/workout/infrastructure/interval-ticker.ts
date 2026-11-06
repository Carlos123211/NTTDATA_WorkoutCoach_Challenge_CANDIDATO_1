import { StopTicker, Ticker } from '../application/ports/ticker';

/** Adaptador del puerto `Ticker` basado en `setInterval`. */
export class IntervalTicker implements Ticker {
  start(onTick: () => void, intervalMs: number): StopTicker {
    const id = setInterval(onTick, intervalMs);
    let stopped = false;
    return () => {
      if (!stopped) {
        clearInterval(id);
        stopped = true;
      }
    };
  }
}
