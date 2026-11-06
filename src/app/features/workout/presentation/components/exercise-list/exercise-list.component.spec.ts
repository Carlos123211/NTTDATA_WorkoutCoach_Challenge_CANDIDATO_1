import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ExerciseWithStatus } from '../../../application/workout-session.store';
import { PUSH_UPS, SQUATS } from '../../../domain/testing/workout.fixtures';
import { ExerciseListComponent } from './exercise-list.component';

describe('ExerciseListComponent', () => {
  it('renders every exercise in order and marks the current step', async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(ExerciseListComponent);
    const items: ExerciseWithStatus[] = [
      { exercise: SQUATS, status: 'completed' },
      { exercise: PUSH_UPS, status: 'in-progress' },
    ];
    fixture.componentRef.setInput('items', items);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    const rows = Array.from(host.querySelectorAll('li'));
    expect(rows.map((li) => li.querySelector('.name')?.textContent?.trim())).toEqual([
      'Squats',
      'Push-ups',
    ]);
    expect(rows.map((li) => li.getAttribute('aria-current'))).toEqual([null, 'step']);
  });
});
