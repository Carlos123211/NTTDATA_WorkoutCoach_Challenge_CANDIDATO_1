import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExerciseStatus } from '../../../domain/exercise-status';
import { SQUATS } from '../../../domain/testing/workout.fixtures';
import { ExerciseItemComponent } from './exercise-item.component';

describe('ExerciseItemComponent', () => {
  let fixture: ComponentFixture<ExerciseItemComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    fixture = TestBed.createComponent(ExerciseItemComponent);
    host = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('exercise', SQUATS);
    fixture.componentRef.setInput('status', 'pending');
    await fixture.whenStable();
  });

  const text = (selector: string) => host.querySelector(selector)?.textContent?.trim();

  it('renders name and detail', () => {
    expect(text('.name')).toBe('Squats');
    expect(text('.detail')).toBe('3 × 5 s · descanso 3 s');
  });

  const labels: [ExerciseStatus, string][] = [
    ['pending', 'Pendiente'],
    ['in-progress', 'En curso'],
    ['completed', 'Completado'],
  ];

  for (const [status, label] of labels) {
    it(`shows "${label}" and data-status="${status}"`, async () => {
      fixture.componentRef.setInput('status', status);
      await fixture.whenStable();
      expect(text('.badge')).toBe(label);
      expect(host.getAttribute('data-status')).toBe(status);
    });
  }

  it('re-renders when its input changes (OnPush + signals)', async () => {
    fixture.componentRef.setInput('exercise', { ...SQUATS, name: 'Burpees' });
    await fixture.whenStable();
    expect(text('.name')).toBe('Burpees');
  });
});
