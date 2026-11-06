import { Workout } from '../domain/workout';
import { WorkoutRepository } from '../domain/workout.repository';
import { ExerciseDto } from './dto/exercise.dto';
import { toWorkout } from './mappers/exercise.mapper';
import { MOCK_EXERCISES } from './mock/workout.mock';

/**
 * Adaptador en memoria del puerto `WorkoutRepository`.
 * Un `HttpWorkoutRepository` futuro sustituiría solo esta clase.
 */
export class MockWorkoutRepository implements WorkoutRepository {
  constructor(private readonly data: readonly ExerciseDto[] = MOCK_EXERCISES) {}

  // async: un error de mapeo se convierte en Promise rechazada, no en excepción síncrona.
  async getWorkout(): Promise<Workout> {
    return toWorkout(this.data);
  }
}
