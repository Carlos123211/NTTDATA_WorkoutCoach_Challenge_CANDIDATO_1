import { InjectionToken } from '@angular/core';
import { WorkoutRepository } from '../domain/workout.repository';
import { Ticker } from './ports/ticker';

// Los tokens viven en application: una interface no existe en runtime y
// InjectionToken necesita @angular/core, que no puede entrar en domain.
export const WORKOUT_REPOSITORY = new InjectionToken<WorkoutRepository>('WORKOUT_REPOSITORY');
export const TICKER = new InjectionToken<Ticker>('TICKER');
