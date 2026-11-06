import { Exercise } from './exercise';
import { InvalidExerciseError } from './workout.errors';

export interface Workout {
  /** Puede estar vacía: la sesión no se podrá iniciar (D8). */
  readonly exercises: readonly Exercise[];
}

/** Crea un entrenamiento. Los `id` deben ser únicos (la UI los usa para `track`). */
export function createWorkout(exercises: readonly Exercise[]): Workout {
  const seen = new Set<string>();
  for (const exercise of exercises) {
    if (seen.has(exercise.id)) {
      throw new InvalidExerciseError('id', exercise.id, 'must be unique within a workout');
    }
    seen.add(exercise.id);
  }
  return { exercises: [...exercises] };
}
