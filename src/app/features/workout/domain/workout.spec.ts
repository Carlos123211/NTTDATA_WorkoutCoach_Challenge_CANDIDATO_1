import { PUSH_UPS, SQUATS } from './testing/workout.fixtures';
import { createWorkout } from './workout';
import { InvalidExerciseError } from './workout.errors';

describe('createWorkout', () => {
  it('keeps exercises in order', () => {
    expect(createWorkout([SQUATS, PUSH_UPS]).exercises).toEqual([SQUATS, PUSH_UPS]);
  });

  it('accepts an empty list (D8)', () => {
    expect(createWorkout([]).exercises).toEqual([]);
  });

  it('does not share the input array', () => {
    const input = [SQUATS];
    const workout = createWorkout(input);
    input.push(PUSH_UPS);
    expect(workout.exercises.length).toBe(1);
  });

  it('rejects duplicated ids', () => {
    expect(() => createWorkout([SQUATS, { ...PUSH_UPS, id: SQUATS.id }])).toThrowError(
      InvalidExerciseError,
    );
  });
});
