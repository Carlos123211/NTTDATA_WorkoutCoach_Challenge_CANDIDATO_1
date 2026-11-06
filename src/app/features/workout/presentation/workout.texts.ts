import { Exercise } from '../domain/exercise';
import { ExerciseStatus } from '../domain/exercise-status';
import { Phase, SessionEvent } from '../domain/workout-session';

/** Textos de UI centralizados (D11). Punto único para una futura i18n. */
export const TEXTS = {
  title: 'Workout Coach',
  loading: 'Cargando entrenamiento…',
  loadError: 'No se pudo cargar el entrenamiento.',
  retry: 'Reintentar',
  empty: 'Este entrenamiento no tiene ejercicios.',
  start: 'Iniciar',
  pause: 'Pausar',
  reset: 'Reiniciar',
  completedRepetitions: 'Repeticiones completadas',
  finished: 'Finalizado',
  exercises: 'Ejercicios',
} as const;

export const PHASE_LABELS: Readonly<Record<Phase, string>> = {
  exercise: 'Ejercicio',
  rest: 'Descanso',
};

export const STATUS_LABELS: Readonly<Record<ExerciseStatus, string>> = {
  pending: 'Pendiente',
  'in-progress': 'En curso',
  completed: 'Completado',
};

export function exerciseDetail(exercise: Exercise): string {
  const rest = exercise.restTime > 0 ? `descanso ${exercise.restTime} s` : 'sin descanso';
  return `${exercise.repetitions} × ${exercise.repetitionTime} s · ${rest}`;
}

/** Mensaje de la notificación para el último evento. `current` es el ejercicio actual de la sesión. */
export function eventMessage(event: SessionEvent | null, current: Exercise | null): string | null {
  switch (event) {
    case null:
      return null;
    case 'rest-started':
      return 'Tiempo de descanso';
    case 'repetition-started':
      return '¡De vuelta al ejercicio!';
    case 'exercise-completed':
      return current === null ? 'Ejercicio completado' : `Ejercicio completado. Siguiente: ${current.name}`;
    case 'workout-completed':
      return '¡Entrenamiento completado!';
  }
}
