import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Exercise } from '../domain/exercise';
import { ExerciseStatus, exerciseStatus } from '../domain/exercise-status';
import {
  WorkoutSession,
  createSession,
  currentExercise,
  pause,
  reset,
  start,
  tick,
} from '../domain/workout-session';
import { LoadWorkoutUseCase } from './load-workout.use-case';
import { StopTicker } from './ports/ticker';
import { TICKER } from './workout.tokens';

export type LoadState = 'loading' | 'ready' | 'error';

export interface ExerciseWithStatus {
  readonly exercise: Exercise;
  readonly status: ExerciseStatus;
}

export const TICK_INTERVAL_MS = 1000;

/**
 * Estado de la sesión con Signals. Solo orquesta: las reglas viven en el dominio.
 * Se provee en el container (una instancia por página) y libera el ticker al destruirse.
 */
@Injectable()
export class WorkoutSessionStore {
  private readonly loadWorkout = inject(LoadWorkoutUseCase);
  private readonly ticker = inject(TICKER);

  private readonly _loadState = signal<LoadState>('loading');
  private readonly _session = signal<WorkoutSession | null>(null);
  private stopTicker: StopTicker | null = null;

  readonly loadState = this._loadState.asReadonly();
  readonly session = this._session.asReadonly();

  readonly exercises = computed<readonly ExerciseWithStatus[]>(() => {
    const session = this._session();
    if (session === null) return [];
    return session.workout.exercises.map((exercise, index) => ({
      exercise,
      status: exerciseStatus(session, index),
    }));
  });

  readonly currentExercise = computed(() => {
    const session = this._session();
    return session === null ? null : currentExercise(session);
  });

  // Se reutilizan las reglas del dominio: si la transición no cambia nada, no está permitida.
  readonly canStart = computed(() => {
    const session = this._session();
    return session !== null && start(session) !== session;
  });

  readonly canPause = computed(() => {
    const session = this._session();
    return session !== null && pause(session) !== session;
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.haltTicker());
  }

  async load(): Promise<void> {
    this.haltTicker();
    this._loadState.set('loading');
    try {
      const workout = await this.loadWorkout.execute();
      this._session.set(createSession(workout));
      this._loadState.set('ready');
    } catch {
      this._session.set(null);
      this._loadState.set('error');
    }
  }

  start(): void {
    this.apply(start);
    if (this._session()?.status === 'running' && this.stopTicker === null) {
      this.stopTicker = this.ticker.start(() => this.onTick(), TICK_INTERVAL_MS);
    }
  }

  pause(): void {
    this.apply(pause);
    this.haltTicker();
  }

  reset(): void {
    this.apply(reset);
    this.haltTicker();
  }

  private onTick(): void {
    this.apply(tick);
    if (this._session()?.status !== 'running') {
      this.haltTicker();
    }
  }

  private apply(transition: (session: WorkoutSession) => WorkoutSession): void {
    const session = this._session();
    if (session !== null) {
      this._session.set(transition(session));
    }
  }

  private haltTicker(): void {
    this.stopTicker?.();
    this.stopTicker = null;
  }
}
