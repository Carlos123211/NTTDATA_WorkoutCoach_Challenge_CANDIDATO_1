import { PUSH_UPS, anExercise } from '../domain/testing/workout.fixtures';
import { eventMessage, exerciseDetail } from './workout.texts';

describe('workout.texts', () => {
  describe('eventMessage', () => {
    it('has no message without event', () => {
      expect(eventMessage(null, PUSH_UPS)).toBeNull();
    });

    it('announces the next exercise when one is completed', () => {
      expect(eventMessage('exercise-completed', PUSH_UPS)).toBe(
        'Ejercicio completado. Siguiente: Push-ups',
      );
    });

    it('has a message for every other event', () => {
      expect(eventMessage('rest-started', PUSH_UPS)).toBe('Tiempo de descanso');
      expect(eventMessage('repetition-started', PUSH_UPS)).toBe('¡De vuelta al ejercicio!');
      expect(eventMessage('workout-completed', PUSH_UPS)).toBe('¡Entrenamiento completado!');
    });
  });

  describe('exerciseDetail', () => {
    it('describes repetitions, time and rest', () => {
      expect(exerciseDetail(PUSH_UPS)).toBe('2 × 4 s · descanso 2 s');
    });

    it('says when there is no rest', () => {
      expect(exerciseDetail(anExercise({ restTime: 0 }))).toBe('3 × 5 s · sin descanso');
    });
  });
});
