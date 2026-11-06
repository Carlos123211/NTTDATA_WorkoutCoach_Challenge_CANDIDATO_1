import { ChangeDetectionStrategy, Component } from '@angular/core';
import { WorkoutPageComponent } from './features/workout/presentation/containers/workout-page/workout-page.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WorkoutPageComponent],
  template: `<app-workout-page />`,
})
export class AppComponent {}
