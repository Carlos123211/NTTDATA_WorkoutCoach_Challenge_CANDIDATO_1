import {
  PUSH_UPS,
  SQUATS,
  aWorkout,
  anExercise,
  deepFreeze,
  tickTimes,
} from './testing/workout.fixtures';
import {
  WorkoutSession,
  createSession,
  currentExercise,
  pause,
  reset,
  start,
  tick,
} from './workout-session';

describe('WorkoutSession', () => {
  /** Squats: 3 reps × (5 s + 3 s descanso). Push-ups: 2 reps × (4 s + 2 s). */
  const twoExercises = () => createSession(aWorkout(SQUATS, PUSH_UPS));
  const started = () => start(twoExercises());

  describe('createSession (CA-1, D6)', () => {
    it('starts idle on the first exercise with its repetition time and no event', () => {
      expect(twoExercises()).toEqual({
        workout: aWorkout(SQUATS, PUSH_UPS),
        status: 'idle',
        currentIndex: 0,
        phase: 'exercise',
        remainingSeconds: SQUATS.repetitionTime,
        completedRepetitions: 0,
        lastEvent: null,
      });
    });

    it('does not start by itself', () => {
      const session = twoExercises();
      expect(tickTimes(session, 10)).toBe(session);
    });

    it('handles an empty workout (D8)', () => {
      const session = createSession(aWorkout());
      expect(session.remainingSeconds).toBe(0);
      expect(currentExercise(session)).toBeNull();
    });
  });

  describe('start', () => {
    it('activates the first exercise with its repetition_time (CA-2)', () => {
      const session = started();
      expect(session.status).toBe('running');
      expect(currentExercise(session)).toEqual(SQUATS);
      expect(session.phase).toBe('exercise');
      expect(session.remainingSeconds).toBe(SQUATS.repetitionTime);
    });

    it('is a no-op when already running', () => {
      const session = started();
      expect(start(session)).toBe(session);
    });

    it('is a no-op for an empty workout (CA-10)', () => {
      const session = createSession(aWorkout());
      expect(start(session)).toBe(session);
    });
  });

  describe('tick', () => {
    it('decrements the remaining seconds and keeps the last event', () => {
      const session = tick(started());
      expect(session.remainingSeconds).toBe(SQUATS.repetitionTime - 1);
      expect(session.lastEvent).toBeNull();
    });

    it('starts the rest with rest_time when the exercise time reaches zero (CA-3)', () => {
      const session = tickTimes(started(), SQUATS.repetitionTime);
      expect(session.phase).toBe('rest');
      expect(session.remainingSeconds).toBe(SQUATS.restTime);
      expect(session.completedRepetitions).toBe(0);
      expect(session.lastEvent).toBe('rest-started');
    });

    it('increments completed repetitions when the rest ends (CA-4)', () => {
      const session = tickTimes(started(), SQUATS.repetitionTime + SQUATS.restTime);
      expect(session.phase).toBe('exercise');
      expect(session.remainingSeconds).toBe(SQUATS.repetitionTime);
      expect(session.completedRepetitions).toBe(1);
      expect(session.lastEvent).toBe('repetition-started');
    });

    it('completes the exercise and starts the next one (CA-5, D1, D2)', () => {
      const squatsDuration = SQUATS.repetitions * (SQUATS.repetitionTime + SQUATS.restTime);

      const lastRest = tickTimes(started(), squatsDuration - 1);
      expect(lastRest.phase).toBe('rest'); // también hay descanso tras la última repetición (D1)
      expect(lastRest.currentIndex).toBe(0);

      const next = tick(lastRest);
      expect(next.status).toBe('running');
      expect(next.currentIndex).toBe(1);
      expect(currentExercise(next)).toEqual(PUSH_UPS);
      expect(next.phase).toBe('exercise');
      expect(next.remainingSeconds).toBe(PUSH_UPS.repetitionTime);
      expect(next.completedRepetitions).toBe(0);
      expect(next.lastEvent).toBe('exercise-completed');
    });

    it('finishes the workout after the last exercise (CA-6, D3)', () => {
      const total =
        SQUATS.repetitions * (SQUATS.repetitionTime + SQUATS.restTime) +
        PUSH_UPS.repetitions * (PUSH_UPS.repetitionTime + PUSH_UPS.restTime);

      const almost = tickTimes(started(), total - 1);
      expect(almost.status).toBe('running');

      const finished = tick(almost);
      expect(finished).toEqual(
        jasmine.objectContaining({
          status: 'finished',
          currentIndex: 1,
          remainingSeconds: 0,
          completedRepetitions: PUSH_UPS.repetitions,
          lastEvent: 'workout-completed',
        }),
      );
    });

    it('skips the rest when rest_time is 0 (CA-9, D7)', () => {
      const noRest = anExercise({ repetitions: 2, repetitionTime: 2, restTime: 0 });
      let session = start(createSession(aWorkout(noRest)));
      const phases: string[] = [];
      while (session.status === 'running') {
        session = tick(session);
        phases.push(session.phase);
      }
      expect(phases).not.toContain('rest');
      expect(phases.length).toBe(4); // 2 reps × 2 s
      expect(session.status).toBe('finished');
    });

    for (const status of ['idle', 'paused', 'finished'] as const) {
      it(`is a no-op when ${status}`, () => {
        const session: WorkoutSession = { ...started(), status };
        expect(tick(session)).toBe(session);
      });
    }
  });

  describe('finished (CA-8)', () => {
    const finished = () => tickTimes(started(), 1000);

    it('cannot be started again', () => {
      const session = finished();
      expect(session.status).toBe('finished');
      expect(start(session)).toBe(session);
    });

    it('ignores pause', () => {
      const session = finished();
      expect(pause(session)).toBe(session);
    });
  });

  describe('pause (CA-7)', () => {
    it('keeps all progress', () => {
      const running = tickTimes(started(), SQUATS.repetitionTime + SQUATS.restTime + 2);
      const paused = pause(running);
      expect(paused).toEqual({ ...running, status: 'paused' });
    });

    it('freezes the timer while paused', () => {
      const paused = pause(tickTimes(started(), 2));
      expect(tickTimes(paused, 5)).toBe(paused);
    });

    it('resumes from the same point', () => {
      const running = tickTimes(started(), 2);
      const resumed = start(pause(running));
      expect(resumed).toEqual(running);
      expect(tick(resumed).remainingSeconds).toBe(running.remainingSeconds - 1);
    });

    it('is a no-op when idle', () => {
      const session = twoExercises();
      expect(pause(session)).toBe(session);
    });
  });

  describe('reset (CA-7, D5)', () => {
    it('returns to the initial state from the middle of a rest', () => {
      const midRest = tickTimes(started(), SQUATS.repetitionTime + 1);
      expect(midRest.phase).toBe('rest');
      expect(reset(midRest)).toEqual(twoExercises());
    });

    it('returns to the initial state from finished', () => {
      expect(reset(tickTimes(started(), 1000))).toEqual(twoExercises());
    });
  });

  describe('immutability', () => {
    it('never mutates the previous state', () => {
      let session = deepFreeze(started());
      expect(() => {
        for (let i = 0; i < 100; i++) {
          session = deepFreeze(tick(session));
        }
        session = deepFreeze(pause(session));
        session = deepFreeze(start(session));
        reset(session);
      }).not.toThrow();
    });
  });

  describe('legacy baseline (spec §1.3)', () => {
    type Snapshot = Pick<WorkoutSession, 'status' | 'phase' | 'remainingSeconds' | 'completedRepetitions'>;
    const snap = (s: WorkoutSession): Snapshot => ({
      status: s.status,
      phase: s.phase,
      remainingSeconds: s.remainingSeconds,
      completedRepetitions: s.completedRepetitions,
    });

    it('reproduces the observed Squats trace second by second', () => {
      let session = start(createSession(aWorkout(SQUATS)));
      const trace: Snapshot[] = [snap(session)];
      for (let t = 1; t <= 24; t++) {
        session = tick(session);
        trace.push(snap(session));
      }

      const at = (t: number) => trace[t];
      expect(at(0)).toEqual({ status: 'running', phase: 'exercise', remainingSeconds: 5, completedRepetitions: 0 });
      expect(at(4)).toEqual({ status: 'running', phase: 'exercise', remainingSeconds: 1, completedRepetitions: 0 });
      expect(at(5)).toEqual({ status: 'running', phase: 'rest', remainingSeconds: 3, completedRepetitions: 0 });
      expect(at(7)).toEqual({ status: 'running', phase: 'rest', remainingSeconds: 1, completedRepetitions: 0 });
      expect(at(8)).toEqual({ status: 'running', phase: 'exercise', remainingSeconds: 5, completedRepetitions: 1 });
      expect(at(16)).toEqual({ status: 'running', phase: 'exercise', remainingSeconds: 5, completedRepetitions: 2 });
      expect(at(23)).toEqual({ status: 'running', phase: 'rest', remainingSeconds: 1, completedRepetitions: 2 });
      // Única diferencia intencionada con el legacy: el reloj queda en 0 (D3).
      expect(at(24)).toEqual({ status: 'finished', phase: 'exercise', remainingSeconds: 0, completedRepetitions: 3 });
    });
  });
});
