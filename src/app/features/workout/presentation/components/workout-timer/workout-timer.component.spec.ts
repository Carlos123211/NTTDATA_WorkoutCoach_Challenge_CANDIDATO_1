import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkoutTimerComponent } from './workout-timer.component';

describe('WorkoutTimerComponent', () => {
  let fixture: ComponentFixture<WorkoutTimerComponent>;
  let host: HTMLElement;

  async function render(inputs: Record<string, unknown> = {}): Promise<void> {
    const defaults: Record<string, unknown> = {
      exerciseName: 'Squats',
      phase: 'exercise',
      remainingSeconds: 5,
      completedRepetitions: 0,
      totalRepetitions: 3,
      canStart: true,
      canPause: false,
      finished: false,
    };
    for (const [name, value] of Object.entries({ ...defaults, ...inputs })) {
      fixture.componentRef.setInput(name, value);
    }
    await fixture.whenStable();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    fixture = TestBed.createComponent(WorkoutTimerComponent);
    host = fixture.nativeElement as HTMLElement;
  });

  const text = (selector: string) => host.querySelector(selector)?.textContent?.trim();
  const button = (label: string) =>
    Array.from(host.querySelectorAll('button')).find((b) => b.textContent?.trim() === label) ?? null;

  it('renders name, phase, mm:ss clock and counter', async () => {
    await render({ remainingSeconds: 75, completedRepetitions: 1 });
    expect(text('.exercise-name')).toBe('Squats');
    expect(text('.phase')).toBe('Ejercicio');
    expect(text('.clock')).toBe('01:15');
    expect(text('.counter')).toBe('Repeticiones completadas: 1 / 3');
  });

  it('shows the rest phase', async () => {
    await render({ phase: 'rest' });
    expect(text('.phase')).toBe('Descanso');
    expect(host.querySelector('.timer')?.getAttribute('data-phase')).toBe('rest');
  });

  it('shows Iniciar (enabled) and no Pausar when it can start', async () => {
    await render();
    expect(button('Iniciar')?.disabled).toBeFalse();
    expect(button('Pausar')).toBeNull();
  });

  it('shows Pausar instead of Iniciar while running', async () => {
    await render({ canStart: false, canPause: true });
    expect(button('Pausar')).not.toBeNull();
    expect(button('Iniciar')).toBeNull();
  });

  it('disables Iniciar when finished (CA-8)', async () => {
    await render({ canStart: false, finished: true, remainingSeconds: 0 });
    expect(text('.phase')).toBe('Finalizado');
    expect(text('.clock')).toBe('00:00');
    expect(button('Iniciar')?.disabled).toBeTrue();
  });

  it('emits the control outputs on click', async () => {
    const start = jasmine.createSpy('start');
    const pause = jasmine.createSpy('pause');
    const reset = jasmine.createSpy('reset');
    fixture.componentInstance.startClick.subscribe(start);
    fixture.componentInstance.pauseClick.subscribe(pause);
    fixture.componentInstance.resetClick.subscribe(reset);

    await render();
    button('Iniciar')?.click();
    button('Reiniciar')?.click();
    await render({ canStart: false, canPause: true });
    button('Pausar')?.click();

    expect(start).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledTimes(1);
    expect(pause).toHaveBeenCalledTimes(1);
  });

  it('does not emit start when Iniciar is disabled', async () => {
    const start = jasmine.createSpy('start');
    fixture.componentInstance.startClick.subscribe(start);
    await render({ canStart: false });
    button('Iniciar')?.click();
    expect(start).not.toHaveBeenCalled();
  });
});
