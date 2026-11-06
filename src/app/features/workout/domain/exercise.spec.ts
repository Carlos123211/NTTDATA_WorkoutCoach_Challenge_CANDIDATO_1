import { createExercise } from './exercise';
import { anExercise } from './testing/workout.fixtures';
import { InvalidExerciseError } from './workout.errors';

describe('createExercise', () => {
  it('returns the exercise when all invariants hold', () => {
    expect(createExercise(anExercise())).toEqual(anExercise());
  });

  it('trims id and name', () => {
    const exercise = createExercise(anExercise({ id: ' squats ', name: '  Squats ' }));
    expect(exercise.id).toBe('squats');
    expect(exercise.name).toBe('Squats');
  });

  it('accepts restTime = 0 (no rest, D7)', () => {
    expect(createExercise(anExercise({ restTime: 0 })).restTime).toBe(0);
  });

  const invalidCases: { field: InvalidExerciseError['field']; value: string | number }[] = [
    { field: 'id', value: '' },
    { field: 'id', value: '   ' },
    { field: 'name', value: '' },
    { field: 'name', value: '   ' },
    { field: 'repetitions', value: 0 },
    { field: 'repetitions', value: -1 },
    { field: 'repetitions', value: 1.5 },
    { field: 'repetitions', value: Number.NaN },
    { field: 'repetitionTime', value: 0 },
    { field: 'repetitionTime', value: Number.POSITIVE_INFINITY },
    { field: 'restTime', value: -1 },
    { field: 'restTime', value: 0.5 },
  ];

  for (const { field, value } of invalidCases) {
    it(`rejects ${field} = ${String(value)}`, () => {
      const props = anExercise({ [field]: value });

      let error: unknown;
      try {
        createExercise(props);
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(InvalidExerciseError);
      expect((error as InvalidExerciseError).field).toBe(field);
    });
  }
});
