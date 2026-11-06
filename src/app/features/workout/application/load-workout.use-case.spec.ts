import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SQUATS, aWorkout } from '../domain/testing/workout.fixtures';
import { LoadWorkoutUseCase } from './load-workout.use-case';
import { failingRepository, fakeRepository } from './testing/workout.fakes';
import { WORKOUT_REPOSITORY } from './workout.tokens';

describe('LoadWorkoutUseCase', () => {
  const setup = (repository: ReturnType<typeof fakeRepository>) => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: WORKOUT_REPOSITORY, useValue: repository },
      ],
    });
    return TestBed.inject(LoadWorkoutUseCase);
  };

  it('returns the workout from the repository port', async () => {
    const workout = aWorkout(SQUATS);
    expect(await setup(fakeRepository(workout)).execute()).toBe(workout);
  });

  it('propagates repository errors', async () => {
    const error = new Error('network down');
    await expectAsync(setup(failingRepository(error)).execute()).toBeRejectedWith(error);
  });
});
