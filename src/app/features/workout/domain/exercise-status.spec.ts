import { ExerciseStatus, exerciseStatus } from './exercise-status';
import { PUSH_UPS, SQUATS, aWorkout, anExercise } from './testing/workout.fixtures';
import { SessionStatus, WorkoutSession, createSession } from './workout-session';

describe('exerciseStatus (spec §4.4)', () => {
  const PLANK = anExercise({ id: 'plank', name: 'Plank' });
  const session = (status: SessionStatus, currentIndex: number): WorkoutSession => ({
    ...createSession(aWorkout(SQUATS, PUSH_UPS, PLANK)),
    status,
    currentIndex,
  });
  const statuses = (s: WorkoutSession): ExerciseStatus[] =>
    s.workout.exercises.map((_, i) => exerciseStatus(s, i));

  it('idle: all pending (CA-1)', () => {
    expect(statuses(session('idle', 0))).toEqual(['pending', 'pending', 'pending']);
  });

  it('running: previous completed, current in progress, next pending (CA-5)', () => {
    expect(statuses(session('running', 1))).toEqual(['completed', 'in-progress', 'pending']);
  });

  it('paused: same as running (CA-7)', () => {
    expect(statuses(session('paused', 1))).toEqual(['completed', 'in-progress', 'pending']);
  });

  it('running on the first exercise', () => {
    expect(statuses(session('running', 0))).toEqual(['in-progress', 'pending', 'pending']);
  });

  it('finished: all completed (CA-6)', () => {
    expect(statuses(session('finished', 2))).toEqual(['completed', 'completed', 'completed']);
  });
});
