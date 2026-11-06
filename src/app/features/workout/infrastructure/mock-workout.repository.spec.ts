import { InvalidExerciseError } from '../domain/workout.errors';
import { MockWorkoutRepository } from './mock-workout.repository';
import { MOCK_EXERCISES } from './mock/workout.mock';

describe('MockWorkoutRepository', () => {
  it('returns a list of exercises mapped to the domain', async () => {
    const workout = await new MockWorkoutRepository().getWorkout();
    expect(workout.exercises.length).toBe(MOCK_EXERCISES.length);
    expect(workout.exercises.length).toBeGreaterThan(1);
  });

  it('keeps the legacy baseline exercise first (Squats 3 × 5 s / 3 s)', async () => {
    const [first] = (await new MockWorkoutRepository().getWorkout()).exercises;
    expect(first).toEqual({
      id: 'squats',
      name: 'Squats',
      repetitions: 3,
      repetitionTime: 5,
      restTime: 3,
    });
  });

  it('rejects the promise (instead of throwing) when data is invalid (CA-11)', async () => {
    const repository = new MockWorkoutRepository([
      { id: 'x', exercise_name: '', repetitions_number: 1, repetition_time: 1, rest_time: 0 },
    ]);
    let result: Promise<unknown> | undefined;
    expect(() => (result = repository.getWorkout())).not.toThrow();
    await expectAsync(result).toBeRejectedWithError(InvalidExerciseError);
  });
});
