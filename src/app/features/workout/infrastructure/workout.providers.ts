import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { TICKER, WORKOUT_REPOSITORY } from '../application/workout.tokens';
import { IntervalTicker } from './interval-ticker';
import { MockWorkoutRepository } from './mock-workout.repository';

/** Registra los adaptadores de la feature. Se usa solo en el composition root (app.config.ts). */
export function provideWorkoutInfrastructure(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: WORKOUT_REPOSITORY, useFactory: () => new MockWorkoutRepository() },
    { provide: TICKER, useFactory: () => new IntervalTicker() },
  ]);
}
