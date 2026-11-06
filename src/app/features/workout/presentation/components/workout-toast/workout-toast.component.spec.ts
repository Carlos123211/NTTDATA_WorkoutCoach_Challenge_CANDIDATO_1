import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { WorkoutToastComponent } from './workout-toast.component';

describe('WorkoutToastComponent', () => {
  it('renders nothing but keeps the live region when there is no message', async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(WorkoutToastComponent);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('[role="status"]')).not.toBeNull();
    expect(host.querySelector('.toast')).toBeNull();
  });

  it('renders the message', async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(WorkoutToastComponent);
    fixture.componentRef.setInput('message', 'Tiempo de descanso');
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.toast')?.textContent?.trim()).toBe('Tiempo de descanso');
  });
});
