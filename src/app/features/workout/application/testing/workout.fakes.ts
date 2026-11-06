import { Workout } from '../../domain/workout';
import { WorkoutRepository } from '../../domain/workout.repository';
import { StopTicker, Ticker } from '../ports/ticker';

/** Solo para tests. Ticker manual: los ticks se disparan con `tick()`, sin reloj real. */
export class FakeTicker implements Ticker {
  private readonly subscribers = new Set<{ onTick: () => void }>();
  startCalls = 0;

  start(onTick: () => void): StopTicker {
    this.startCalls++;
    const subscriber = { onTick };
    this.subscribers.add(subscriber);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  /** Número de tickers activos (no detenidos). */
  get active(): number {
    return this.subscribers.size;
  }

  tick(times = 1): void {
    for (let i = 0; i < times; i++) {
      for (const subscriber of [...this.subscribers]) {
        subscriber.onTick();
      }
    }
  }
}

export function fakeRepository(workout: Workout): WorkoutRepository {
  return { getWorkout: () => Promise.resolve(workout) };
}

export function failingRepository(error: Error): WorkoutRepository {
  return { getWorkout: () => Promise.reject(error) };
}
