import { Workout } from './workout';

/**
 * Puerto de salida. Lo implementa infrastructure (mock, HTTP...).
 * Usa Promise para que el dominio no dependa de RxJS.
 */
export interface WorkoutRepository {
  getWorkout(): Promise<Workout>;
}
