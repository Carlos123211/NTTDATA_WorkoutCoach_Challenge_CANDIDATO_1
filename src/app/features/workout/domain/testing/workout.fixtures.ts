import { Exercise } from '../exercise';
import { Workout, createWorkout } from '../workout';
import { WorkoutSession, tick } from '../workout-session';

/** Solo para tests. */
export function anExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'squats',
    name: 'Squats',
    repetitions: 3,
    repetitionTime: 5,
    restTime: 3,
    ...overrides,
  };
}

/** Ejercicio del baseline legacy (§1.3 de la spec). */
export const SQUATS: Exercise = anExercise();
export const PUSH_UPS: Exercise = anExercise({
  id: 'push-ups',
  name: 'Push-ups',
  repetitions: 2,
  repetitionTime: 4,
  restTime: 2,
});

export function aWorkout(...exercises: Exercise[]): Workout {
  return createWorkout(exercises);
}

export function tickTimes(session: WorkoutSession, times: number): WorkoutSession {
  let current = session;
  for (let i = 0; i < times; i++) {
    current = tick(current);
  }
  return current;
}

/** Congela recursivamente para detectar mutaciones (en strict mode lanzan TypeError). */
export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
  }
  return value;
}
