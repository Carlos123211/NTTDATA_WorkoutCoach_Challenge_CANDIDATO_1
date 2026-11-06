import { InvalidExerciseError } from '../../domain/workout.errors';
import { ExerciseDto } from '../dto/exercise.dto';
import { toExercise, toWorkout } from './exercise.mapper';

describe('exercise.mapper', () => {
  const dto: ExerciseDto = {
    id: 'squats',
    exercise_name: 'Squats',
    repetitions_number: 3,
    repetition_time: 5,
    rest_time: 3,
  };

  describe('toExercise', () => {
    it('maps snake_case DTO fields to the camelCase domain model', () => {
      expect(toExercise(dto)).toEqual({
        id: 'squats',
        name: 'Squats',
        repetitions: 3,
        repetitionTime: 5,
        restTime: 3,
      });
    });

    it('delegates validation to the domain (CA-11)', () => {
      let error: unknown;
      try {
        toExercise({ ...dto, repetition_time: 0 });
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(InvalidExerciseError);
      expect((error as InvalidExerciseError).field).toBe('repetitionTime');
    });
  });

  describe('toWorkout', () => {
    it('maps the list preserving order', () => {
      const workout = toWorkout([dto, { ...dto, id: 'lunges', exercise_name: 'Lunges' }]);
      expect(workout.exercises.map((e) => e.name)).toEqual(['Squats', 'Lunges']);
    });

    it('maps an empty list (D8)', () => {
      expect(toWorkout([]).exercises).toEqual([]);
    });

    it('rejects the whole list if one exercise is invalid (CA-11)', () => {
      expect(() => toWorkout([dto, { ...dto, id: 'bad', rest_time: -1 }])).toThrowError(
        InvalidExerciseError,
      );
    });

    it('rejects duplicated ids (CA-11)', () => {
      expect(() => toWorkout([dto, dto])).toThrowError(InvalidExerciseError);
    });
  });
});
