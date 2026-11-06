import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ExerciseWithStatus } from '../../../application/workout-session.store';
import { TEXTS } from '../../workout.texts';
import { ExerciseItemComponent } from '../exercise-item/exercise-item.component';

/** Presentacional: lista completa de ejercicios. Sin dependencias inyectadas. */
@Component({
  selector: 'app-exercise-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExerciseItemComponent],
  template: `
    <h3 class="title">{{ texts.exercises }}</h3>
    <ol class="list">
      @for (item of items(); track item.exercise.id) {
        <li [attr.aria-current]="item.status === 'in-progress' ? 'step' : null">
          <app-exercise-item [exercise]="item.exercise" [status]="item.status" />
        </li>
      }
    </ol>
  `,
  styles: `
    :host { display: block; margin-top: 1.5rem; }
    .title { margin: 0 0 .75rem; font-size: 1rem; color: var(--muted); }
    .list { display: grid; gap: .5rem; margin: 0; padding: 0; list-style: none; }
  `,
})
export class ExerciseListComponent {
  readonly items = input.required<readonly ExerciseWithStatus[]>();

  protected readonly texts = TEXTS;
}
