import { Exercise } from './exercise';
import { Workout } from './workout';

export type SessionStatus = 'idle' | 'running' | 'paused' | 'finished';
export type Phase = 'exercise' | 'rest';
export type SessionEvent =
  | 'rest-started'
  | 'repetition-started'
  | 'exercise-completed'
  | 'workout-completed';

/**
 * Estado inmutable de una sesión de entrenamiento.
 * Todas las transiciones devuelven un objeto nuevo, o la MISMA referencia si no aplican.
 */
export interface WorkoutSession {
  readonly workout: Workout;
  readonly status: SessionStatus;
  readonly currentIndex: number;
  readonly phase: Phase;
  readonly remainingSeconds: number;
  /** Repeticiones completadas del ejercicio actual. */
  readonly completedRepetitions: number;
  /** Último evento relevante; alimenta la notificación. */
  readonly lastEvent: SessionEvent | null;
}

/** Estado inicial (D6): idle, primer ejercicio, sin notificación. */
export function createSession(workout: Workout): WorkoutSession {
  return {
    workout,
    status: 'idle',
    currentIndex: 0,
    phase: 'exercise',
    remainingSeconds: workout.exercises[0]?.repetitionTime ?? 0,
    completedRepetitions: 0,
    lastEvent: null,
  };
}

export function currentExercise(session: WorkoutSession): Exercise | null {
  return session.workout.exercises[session.currentIndex] ?? null;
}

export function start(session: WorkoutSession): WorkoutSession {
  const canStart =
    (session.status === 'idle' || session.status === 'paused') &&
    session.workout.exercises.length > 0;
  return canStart ? { ...session, status: 'running' } : session;
}

export function pause(session: WorkoutSession): WorkoutSession {
  return session.status === 'running' ? { ...session, status: 'paused' } : session;
}

export function reset(session: WorkoutSession): WorkoutSession {
  return createSession(session.workout);
}

/** Avanza la sesión un segundo. Solo tiene efecto en estado `running`. */
export function tick(session: WorkoutSession): WorkoutSession {
  const exercise = currentExercise(session);
  if (session.status !== 'running' || exercise === null) {
    return session;
  }

  const remainingSeconds = session.remainingSeconds - 1;
  if (remainingSeconds > 0) {
    return { ...session, remainingSeconds };
  }

  if (session.phase === 'exercise' && exercise.restTime > 0) {
    return {
      ...session,
      phase: 'rest',
      remainingSeconds: exercise.restTime,
      lastEvent: 'rest-started',
    };
  }

  // Fin del descanso, o fin del ejercicio cuando restTime = 0 (D7).
  return completeRepetition(session, exercise);
}

function completeRepetition(session: WorkoutSession, exercise: Exercise): WorkoutSession {
  const completedRepetitions = session.completedRepetitions + 1;

  if (completedRepetitions < exercise.repetitions) {
    return {
      ...session,
      phase: 'exercise',
      remainingSeconds: exercise.repetitionTime,
      completedRepetitions,
      lastEvent: 'repetition-started',
    };
  }

  const nextIndex = session.currentIndex + 1;
  const next = session.workout.exercises[nextIndex];
  if (next !== undefined) {
    return {
      ...session,
      currentIndex: nextIndex,
      phase: 'exercise',
      remainingSeconds: next.repetitionTime,
      completedRepetitions: 0,
      lastEvent: 'exercise-completed',
    };
  }

  return {
    ...session,
    status: 'finished',
    phase: 'exercise',
    remainingSeconds: 0,
    completedRepetitions,
    lastEvent: 'workout-completed',
  };
}
