import { Injectable, inject } from '@angular/core';
import { Workout } from '../domain/workout';
import { WORKOUT_REPOSITORY } from './workout.tokens';

/** Caso de uso: obtener el entrenamiento a ejecutar. Depende del puerto, no del adaptador. */
@Injectable({ providedIn: 'root' })
export class LoadWorkoutUseCase {
  private readonly repository = inject(WORKOUT_REPOSITORY);

  execute(): Promise<Workout> {
    return this.repository.getWorkout();
  }
}
