import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Exercise } from '../../../domain/exercise';
import { ExerciseStatus } from '../../../domain/exercise-status';
import { STATUS_LABELS, exerciseDetail } from '../../workout.texts';

/** Presentacional: un ejercicio con su estado. Sin dependencias inyectadas. */
@Component({
  selector: 'app-exercise-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-status]': 'status()' },
  template: `
    <div class="info">
      <span class="name">{{ exercise().name }}</span>
      <span class="detail">{{ detail() }}</span>
    </div>
    <span class="badge">{{ statusLabel() }}</span>
  `,
  styles: `
    :host {
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
      padding: .75rem 1rem; border: 1px solid var(--border); border-radius: 10px;
    }
    :host([data-status='in-progress']) { border-color: var(--accent); background: var(--accent-soft); }
    :host([data-status='completed']) { opacity: .7; }
    .info { display: flex; flex-direction: column; }
    .name { font-weight: 700; }
    .detail { font-size: .85rem; color: var(--muted); }
    .badge {
      flex-shrink: 0; padding: .15rem .6rem; border-radius: 999px; font-size: .8rem; font-weight: 700;
      background: var(--border); color: var(--muted);
    }
    :host([data-status='in-progress']) .badge { background: var(--accent); color: #fff; }
    :host([data-status='completed']) .badge { background: var(--done-soft); color: var(--done); }
  `,
})
export class ExerciseItemComponent {
  readonly exercise = input.required<Exercise>();
  readonly status = input.required<ExerciseStatus>();

  protected readonly statusLabel = computed(() => STATUS_LABELS[this.status()]);
  protected readonly detail = computed(() => exerciseDetail(this.exercise()));
}
