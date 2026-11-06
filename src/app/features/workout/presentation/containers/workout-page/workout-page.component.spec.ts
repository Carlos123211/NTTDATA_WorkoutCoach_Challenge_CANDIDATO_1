import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FakeTicker, failingRepository, fakeRepository } from '../../../application/testing/workout.fakes';
import { TICKER, WORKOUT_REPOSITORY } from '../../../application/workout.tokens';
import { PUSH_UPS, SQUATS, aWorkout } from '../../../domain/testing/workout.fixtures';
import { WorkoutRepository } from '../../../domain/workout.repository';
import { WorkoutPageComponent } from './workout-page.component';

/** Integración container + presentacionales + store, sin reloj real y sin zone.js. */
describe('WorkoutPageComponent', () => {
  let fixture: ComponentFixture<WorkoutPageComponent>;
  let host: HTMLElement;
  let ticker: FakeTicker;

  async function render(repository: WorkoutRepository): Promise<void> {
    ticker = new FakeTicker();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: WORKOUT_REPOSITORY, useValue: repository },
        { provide: TICKER, useValue: ticker },
      ],
    });
    fixture = TestBed.createComponent(WorkoutPageComponent);
    host = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  }

  const text = (selector: string) => host.querySelector(selector)?.textContent?.trim();
  const badges = () => Array.from(host.querySelectorAll('.badge')).map((b) => b.textContent?.trim());
  const button = (label: string) =>
    Array.from(host.querySelectorAll('button')).find((b) => b.textContent?.trim() === label) ?? null;

  async function tick(times = 1): Promise<void> {
    ticker.tick(times);
    await fixture.whenStable();
  }

  it('shows the full list, all pending, without starting (CA-1)', async () => {
    await render(fakeRepository(aWorkout(SQUATS, PUSH_UPS)));
    expect(text('.exercise-name')).toBe('Squats');
    expect(text('.clock')).toBe('00:05');
    expect(badges()).toEqual(['Pendiente', 'Pendiente']);
    expect(text('.toast')).toBeUndefined();
    expect(ticker.startCalls).toBe(0);
  });

  it('runs a session end to end through the UI (CA-2…CA-6)', async () => {
    await render(fakeRepository(aWorkout(SQUATS, PUSH_UPS)));

    button('Iniciar')?.click();
    await fixture.whenStable();
    expect(badges()).toEqual(['En curso', 'Pendiente']);
    expect(button('Pausar')).not.toBeNull();

    await tick();
    expect(text('.clock')).toBe('00:04'); // la vista se refresca sin zone.js

    await tick(4);
    expect(text('.phase')).toBe('Descanso');
    expect(text('.clock')).toBe('00:03');
    expect(text('.toast')).toBe('Tiempo de descanso');

    await tick(3);
    expect(text('.counter')).toBe('Repeticiones completadas: 1 / 3');

    await tick(16);
    expect(text('.exercise-name')).toBe('Push-ups');
    expect(badges()).toEqual(['Completado', 'En curso']);
    expect(text('.toast')).toBe('Ejercicio completado. Siguiente: Push-ups');

    await tick(12);
    expect(text('.phase')).toBe('Finalizado');
    expect(text('.clock')).toBe('00:00');
    expect(badges()).toEqual(['Completado', 'Completado']);
    expect(text('.toast')).toBe('¡Entrenamiento completado!');
    expect(button('Iniciar')?.disabled).toBeTrue();
  });

  it('pauses keeping progress and resets to the initial state (CA-7)', async () => {
    await render(fakeRepository(aWorkout(SQUATS, PUSH_UPS)));
    button('Iniciar')?.click();
    await tick(2);

    button('Pausar')?.click();
    await tick(5);
    expect(text('.clock')).toBe('00:03');
    expect(badges()).toEqual(['En curso', 'Pendiente']);

    button('Reiniciar')?.click();
    await fixture.whenStable();
    expect(text('.clock')).toBe('00:05');
    expect(badges()).toEqual(['Pendiente', 'Pendiente']);
    expect(button('Iniciar')?.disabled).toBeFalse();
  });

  it('shows an error with retry when loading fails (CA-11)', async () => {
    await render(failingRepository(new Error('boom')));
    expect(host.querySelector('[role="alert"]')?.textContent?.trim()).toBe(
      'No se pudo cargar el entrenamiento.',
    );
    expect(button('Reintentar')).not.toBeNull();
    expect(host.querySelector('app-workout-timer')).toBeNull();
  });

  it('shows an empty message for a workout without exercises (CA-10)', async () => {
    await render(fakeRepository(aWorkout()));
    expect(text('.state')).toBe('Este entrenamiento no tiene ejercicios.');
    expect(host.querySelector('app-workout-timer')).toBeNull();
  });

  it('stops the ticker when the page is destroyed (CA-12)', async () => {
    await render(fakeRepository(aWorkout(SQUATS)));
    button('Iniciar')?.click();
    expect(ticker.active).toBe(1);
    fixture.destroy();
    expect(ticker.active).toBe(0);
  });
});
