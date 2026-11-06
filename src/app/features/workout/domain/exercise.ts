import { InvalidExerciseError } from './workout.errors';

export interface Exercise {
  readonly id: string;
  readonly name: string;
  /** Entero ≥ 1. */
  readonly repetitions: number;
  /** Segundos por repetición. Entero ≥ 1. */
  readonly repetitionTime: number;
  /** Segundos de descanso tras cada repetición. Entero ≥ 0 (0 = sin descanso). */
  readonly restTime: number;
}

/** Crea un ejercicio validando sus invariantes. Lanza `InvalidExerciseError` si no se cumplen. */
export function createExercise(props: Exercise): Exercise {
  const id = props.id.trim();
  const name = props.name.trim();

  if (id === '') {
    throw new InvalidExerciseError('id', props.id, 'must not be empty');
  }
  if (name === '') {
    throw new InvalidExerciseError('name', props.name, 'must not be empty');
  }
  assertIntegerAtLeast('repetitions', props.repetitions, 1);
  assertIntegerAtLeast('repetitionTime', props.repetitionTime, 1);
  assertIntegerAtLeast('restTime', props.restTime, 0);

  return {
    id,
    name,
    repetitions: props.repetitions,
    repetitionTime: props.repetitionTime,
    restTime: props.restTime,
  };
}

function assertIntegerAtLeast(
  field: 'repetitions' | 'repetitionTime' | 'restTime',
  value: number,
  min: number,
): void {
  if (!Number.isInteger(value) || value < min) {
    throw new InvalidExerciseError(field, value, `must be an integer >= ${min}`);
  }
}
