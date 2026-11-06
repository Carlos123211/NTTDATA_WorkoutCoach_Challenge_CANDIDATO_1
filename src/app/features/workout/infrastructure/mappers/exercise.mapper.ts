import { Exercise, createExercise } from '../../domain/exercise';
import { Workout, createWorkout } from '../../domain/workout';
import { ExerciseDto } from '../dto/exercise.dto';

/** DTO → dominio. Solo renombra; las invariantes las valida el dominio. */
export function toExercise(dto: ExerciseDto): Exercise {
  return createExercise({
    id: dto.id,
    name: dto.exercise_name,
    repetitions: dto.repetitions_number,
    repetitionTime: dto.repetition_time,
    restTime: dto.rest_time,
  });
}

export function toWorkout(dtos: readonly ExerciseDto[]): Workout {
  return createWorkout(dtos.map(toExercise));
}
