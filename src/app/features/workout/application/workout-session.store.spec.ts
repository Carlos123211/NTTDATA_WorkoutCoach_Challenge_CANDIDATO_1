import { EnvironmentInjector, createEnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PUSH_UPS, SQUATS, aWorkout } from '../domain/testing/workout.fixtures';
import { Workout } from '../domain/workout';
import { WorkoutRepository } from '../domain/workout.repository';
import { LoadWorkoutUseCase } from './load-workout.use-case';
import { FakeTicker, failingRepository, fakeRepository } from './testing/workout.fakes';
import { WorkoutSessionStore } from './workout-session.store';
import { TICKER, WORKOUT_REPOSITORY } from './workout.tokens';

describe('WorkoutSessionStore', () => {
  const SQUATS_DURATION = SQUATS.repetitions * (SQUATS.repetitionTime + SQUATS.restTime); // 24
  const PUSH_UPS_DURATION = PUSH_UPS.repetitions * (PUSH_UPS.repetitionTime + PUSH_UPS.restTime); // 12

  let ticker: FakeTicker;

  function createStore(repository: WorkoutRepository): WorkoutSessionStore {
    ticker = new FakeTicker();
    TestBed.configureTestingModule({
      providers: [
        WorkoutSessionStore,
        { provide: WORKOUT_REPOSITORY, useValue: repository },
        { provide: TICKER, useValue: ticker },
      ],
    });
    return TestBed.inject(WorkoutSessionStore);
  }

  async function loadedStore(workout: Workout = aWorkout(SQUATS, PUSH_UPS)) {
    const store = createStore(fakeRepository(workout));
    await store.load();
    return store;
  }

  const statuses = (store: WorkoutSessionStore) => store.exercises().map((e) => e.status);

  describe('before loading', () => {
    it('is loading with no session and cannot start', () => {
      const store = createStore(fakeRepository(aWorkout(SQUATS)));
      expect(store.loadState()).toBe('loading');
      expect(store.session()).toBeNull();
      expect(store.exercises()).toEqual([]);
      expect(store.currentExercise()).toBeNull();
      expect(store.canStart()).toBeFalse();
      expect(store.canPause()).toBeFalse();
    });
  });

  describe('load', () => {
    it('exposes an idle session with every exercise pending and does not auto-start (CA-1)', async () => {
      const store = await loadedStore();
      expect(store.loadState()).toBe('ready');
      expect(store.session()?.status).toBe('idle');
      expect(statuses(store)).toEqual(['pending', 'pending']);
      expect(store.currentExercise()).toEqual(SQUATS);
      expect(store.canStart()).toBeTrue();
      expect(store.canPause()).toBeFalse();
      expect(ticker.startCalls).toBe(0);
    });

    it('moves to error state when the repository fails, without throwing (CA-11)', async () => {
      const store = createStore(failingRepository(new Error('invalid data')));
      await expectAsync(store.load()).toBeResolved();
      expect(store.loadState()).toBe('error');
      expect(store.session()).toBeNull();
      expect(store.canStart()).toBeFalse();
    });

    it('cannot start an empty workout (CA-10)', async () => {
      const store = await loadedStore(aWorkout());
      expect(store.loadState()).toBe('ready');
      expect(store.canStart()).toBeFalse();
      store.start();
      expect(store.session()?.status).toBe('idle');
      expect(ticker.startCalls).toBe(0);
    });

    it('stops a running ticker when reloading', async () => {
      const store = await loadedStore();
      store.start();
      await store.load();
      expect(ticker.active).toBe(0);
      expect(store.session()?.status).toBe('idle');
    });
  });

  describe('start (CA-2)', () => {
    it('runs the first exercise and starts exactly one ticker', async () => {
      const store = await loadedStore();
      store.start();
      expect(store.session()?.status).toBe('running');
      expect(store.session()?.remainingSeconds).toBe(SQUATS.repetitionTime);
      expect(statuses(store)).toEqual(['in-progress', 'pending']);
      expect(store.canStart()).toBeFalse();
      expect(store.canPause()).toBeTrue();
      expect(ticker.active).toBe(1);
    });

    it('does not create a second ticker when called twice', async () => {
      const store = await loadedStore();
      store.start();
      store.start();
      expect(ticker.startCalls).toBe(1);
      ticker.tick();
      expect(store.session()?.remainingSeconds).toBe(SQUATS.repetitionTime - 1);
    });

    it('is ignored before loading', () => {
      const store = createStore(fakeRepository(aWorkout(SQUATS)));
      store.start();
      expect(ticker.startCalls).toBe(0);
    });
  });

  describe('ticking', () => {
    it('applies domain transitions on each tick (CA-3, CA-4)', async () => {
      const store = await loadedStore();
      store.start();

      ticker.tick(SQUATS.repetitionTime);
      expect(store.session()?.phase).toBe('rest');
      expect(store.session()?.remainingSeconds).toBe(SQUATS.restTime);

      ticker.tick(SQUATS.restTime);
      expect(store.session()?.phase).toBe('exercise');
      expect(store.session()?.completedRepetitions).toBe(1);
    });

    it('advances to the next exercise and updates statuses (CA-5)', async () => {
      const store = await loadedStore();
      store.start();
      ticker.tick(SQUATS_DURATION);
      expect(store.currentExercise()).toEqual(PUSH_UPS);
      expect(statuses(store)).toEqual(['completed', 'in-progress']);
      expect(store.session()?.lastEvent).toBe('exercise-completed');
    });

    it('finishes the workout and stops the ticker (CA-6, CA-12)', async () => {
      const store = await loadedStore();
      store.start();
      ticker.tick(SQUATS_DURATION + PUSH_UPS_DURATION);
      expect(store.session()?.status).toBe('finished');
      expect(statuses(store)).toEqual(['completed', 'completed']);
      expect(ticker.active).toBe(0);
      expect(store.canStart()).toBeFalse(); // CA-8
      expect(store.canPause()).toBeFalse();
    });
  });

  describe('pause (CA-7, CA-12)', () => {
    it('stops the ticker and keeps progress', async () => {
      const store = await loadedStore();
      store.start();
      ticker.tick(SQUATS.repetitionTime + 1);
      const before = store.session();

      store.pause();

      expect(ticker.active).toBe(0);
      expect(store.session()).toEqual(before === null ? null : { ...before, status: 'paused' });
      expect(statuses(store)).toEqual(['in-progress', 'pending']);
      expect(store.canStart()).toBeTrue();
      expect(store.canPause()).toBeFalse();
    });

    it('resumes from the same point with a new ticker', async () => {
      const store = await loadedStore();
      store.start();
      ticker.tick(2);
      store.pause();
      store.start();
      expect(ticker.startCalls).toBe(2);
      expect(ticker.active).toBe(1);
      ticker.tick();
      expect(store.session()?.remainingSeconds).toBe(SQUATS.repetitionTime - 3);
    });
  });

  describe('reset (CA-7, CA-12)', () => {
    it('returns to the initial state and stops the ticker', async () => {
      const store = await loadedStore();
      const initial = store.session();
      store.start();
      ticker.tick(SQUATS_DURATION + 3);

      store.reset();

      expect(ticker.active).toBe(0);
      expect(store.session()).toEqual(initial);
      expect(statuses(store)).toEqual(['pending', 'pending']);
      expect(store.canStart()).toBeTrue();
    });

    it('works after finishing', async () => {
      const store = await loadedStore();
      store.start();
      ticker.tick(1000);
      store.reset();
      expect(store.session()?.status).toBe('idle');
      expect(store.canStart()).toBeTrue();
    });
  });

  describe('destroy (CA-12)', () => {
    it('stops the ticker when its injector is destroyed', async () => {
      const fake = new FakeTicker();
      const injector = createEnvironmentInjector(
        [
          WorkoutSessionStore,
          LoadWorkoutUseCase, // providedIn root resolvería el repositorio en el injector raíz
          { provide: WORKOUT_REPOSITORY, useValue: fakeRepository(aWorkout(SQUATS)) },
          { provide: TICKER, useValue: fake },
        ],
        TestBed.inject(EnvironmentInjector),
      );
      const store = injector.get(WorkoutSessionStore);
      await store.load();
      store.start();
      expect(fake.active).toBe(1);

      injector.destroy();

      expect(fake.active).toBe(0);
    });
  });
});
