import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideWorkoutInfrastructure } from './features/workout/infrastructure/workout.providers';

/**
 * Composition root: el único sitio fuera de infrastructure que la conoce.
 * Zoneless: el refresco de la vista lo disparan los Signals, no zone.js.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideWorkoutInfrastructure(),
  ],
};
