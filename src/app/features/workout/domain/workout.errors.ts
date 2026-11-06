export type ExerciseField = 'id' | 'name' | 'repetitions' | 'repetitionTime' | 'restTime';

/** Se lanza cuando los datos de un ejercicio violan las invariantes del dominio. */
export class InvalidExerciseError extends Error {
  constructor(
    readonly field: ExerciseField,
    readonly value: unknown,
    reason: string,
  ) {
    super(`Invalid exercise ${field} (${String(value)}): ${reason}`);
    this.name = 'InvalidExerciseError';
  }
}
