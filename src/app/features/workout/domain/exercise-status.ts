import { WorkoutSession } from './workout-session';

export type ExerciseStatus = 'pending' | 'in-progress' | 'completed';

/** Estado de un ejercicio derivado de la sesión (nunca se almacena). */
export function exerciseStatus(session: WorkoutSession, index: number): ExerciseStatus {
  switch (session.status) {
    case 'idle':
      return 'pending';
    case 'finished':
      return 'completed';
    case 'running':
    case 'paused':
      if (index < session.currentIndex) return 'completed';
      if (index === session.currentIndex) return 'in-progress';
      return 'pending';
  }
}
