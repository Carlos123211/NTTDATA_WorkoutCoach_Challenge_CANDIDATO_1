import { ExerciseDto } from '../dto/exercise.dto';

/** Respuesta simulada del backend. El primer ejercicio es el del baseline legacy. */
export const MOCK_EXERCISES: readonly ExerciseDto[] = [
  { id: 'squats', exercise_name: 'Squats', repetitions_number: 3, repetition_time: 5, rest_time: 3 },
  { id: 'push-ups', exercise_name: 'Push-ups', repetitions_number: 2, repetition_time: 4, rest_time: 2 },
  { id: 'lunges', exercise_name: 'Lunges', repetitions_number: 2, repetition_time: 5, rest_time: 3 },
];
