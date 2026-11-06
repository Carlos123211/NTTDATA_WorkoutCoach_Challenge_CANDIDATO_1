import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { WorkoutSessionStore } from '../../../application/workout-session.store';
import { ExerciseListComponent } from '../../components/exercise-list/exercise-list.component';
import { WorkoutTimerComponent } from '../../components/workout-timer/workout-timer.component';
import { WorkoutToastComponent } from '../../components/workout-toast/workout-toast.component';
import { TEXTS, eventMessage } from '../../workout.texts';

/** Container: único componente con dependencias. Conecta el store con los presentacionales. */
@Component({
  selector: 'app-workout-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [WorkoutSessionStore],
  imports: [WorkoutTimerComponent, WorkoutToastComponent, ExerciseListComponent],
  template: `
    <main class="card">
      <h1>{{ texts.title }}</h1>

      @switch (store.loadState()) {
        @case ('loading') {
          <p class="state" role="status">{{ texts.loading }}</p>
        }
        @case ('error') {
          <p class="state error" role="alert">{{ texts.loadError }}</p>
          <button type="button" (click)="reload()">{{ texts.retry }}</button>
        }
        @case ('ready') {
          @if (store.session(); as session) {
            @if (store.currentExercise(); as exercise) {
              <app-workout-timer
                [exerciseName]="exercise.name"
                [phase]="session.phase"
                [remainingSeconds]="session.remainingSeconds"
                [completedRepetitions]="session.completedRepetitions"
                [totalRepetitions]="exercise.repetitions"
                [canStart]="store.canStart()"
                [canPause]="store.canPause()"
                [finished]="session.status === 'finished'"
                (startClick)="store.start()"
                (pauseClick)="store.pause()"
                (resetClick)="store.reset()"
              />
              <app-workout-toast [message]="toastMessage()" />
              <app-exercise-list [items]="store.exercises()" />
            } @else {
              <p class="state" role="status">{{ texts.empty }}</p>
            }
          }
        }
      }
    </main>
  `,
  styles: `
    h1 { margin: 0 0 1.5rem; font-size: 1.25rem; color: var(--muted); text-align: center; }
    .state { text-align: center; }
    .error { color: var(--error); }
  `,
})
export class WorkoutPageComponent implements OnInit {
  protected readonly store = inject(WorkoutSessionStore);
  protected readonly texts = TEXTS;

  protected readonly toastMessage = computed(() => {
    const session = this.store.session();
    return session === null ? null : eventMessage(session.lastEvent, this.store.currentExercise());
  });

  ngOnInit(): void {
    void this.store.load();
  }

  protected reload(): void {
    void this.store.load();
  }
}
