import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Phase } from '../../../domain/workout-session';
import { formatSeconds } from '../../format-seconds';
import { PHASE_LABELS, TEXTS } from '../../workout.texts';

/** Presentacional: reloj, fase, contador y controles. Sin dependencias inyectadas. */
@Component({
  selector: 'app-workout-timer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="timer" [attr.data-phase]="finished() ? 'finished' : phase()">
      <h2 class="exercise-name">{{ exerciseName() }}</h2>
      <p class="phase">{{ phaseLabel() }}</p>
      <p class="clock" role="timer">{{ clock() }}</p>
      <p class="counter">
        {{ texts.completedRepetitions }}: {{ completedRepetitions() }} / {{ totalRepetitions() }}
      </p>
      <div class="controls">
        @if (canPause()) {
          <button type="button" class="primary" (click)="pauseClick.emit()">{{ texts.pause }}</button>
        } @else {
          <button type="button" class="primary" [disabled]="!canStart()" (click)="startClick.emit()">
            {{ texts.start }}
          </button>
        }
        <button type="button" (click)="resetClick.emit()">{{ texts.reset }}</button>
      </div>
    </section>
  `,
  styles: `
    .timer { text-align: center; }
    .exercise-name { margin: 0; font-size: 1.5rem; }
    .phase {
      display: inline-block; margin: .75rem 0 0; padding: .2rem .8rem; border-radius: 999px;
      font-weight: 700; background: var(--accent-soft); color: var(--accent);
    }
    [data-phase='rest'] .phase { background: var(--rest-soft); color: var(--rest); }
    [data-phase='finished'] .phase { background: var(--done-soft); color: var(--done); }
    .clock { margin: .5rem 0; font-size: 3.5rem; font-weight: 700; font-variant-numeric: tabular-nums; }
    .counter { margin: 0 0 1rem; color: var(--muted); }
    .controls { display: flex; gap: .5rem; justify-content: center; }
  `,
})
export class WorkoutTimerComponent {
  readonly exerciseName = input.required<string>();
  readonly phase = input.required<Phase>();
  readonly remainingSeconds = input.required<number>();
  readonly completedRepetitions = input.required<number>();
  readonly totalRepetitions = input.required<number>();
  readonly canStart = input(false);
  readonly canPause = input(false);
  readonly finished = input(false);

  readonly startClick = output<void>();
  readonly pauseClick = output<void>();
  readonly resetClick = output<void>();

  protected readonly texts = TEXTS;
  protected readonly clock = computed(() => formatSeconds(this.remainingSeconds()));
  protected readonly phaseLabel = computed(() =>
    this.finished() ? TEXTS.finished : PHASE_LABELS[this.phase()],
  );
}
