import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TICKER, WORKOUT_REPOSITORY } from '../application/workout.tokens';
import { IntervalTicker } from './interval-ticker';
import { MockWorkoutRepository } from './mock-workout.repository';
import { provideWorkoutInfrastructure } from './workout.providers';

describe('provideWorkoutInfrastructure', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideWorkoutInfrastructure()],
    });
  });

  it('binds WORKOUT_REPOSITORY to the mock adapter', () => {
    expect(TestBed.inject(WORKOUT_REPOSITORY)).toBeInstanceOf(MockWorkoutRepository);
  });

  it('binds TICKER to the interval adapter', () => {
    expect(TestBed.inject(TICKER)).toBeInstanceOf(IntervalTicker);
  });
});
