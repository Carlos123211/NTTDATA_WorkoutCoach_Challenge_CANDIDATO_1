import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Presentacional: notificación del último evento. Sin dependencias inyectadas. */
@Component({
  selector: 'app-workout-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // La región live existe siempre para que los lectores de pantalla anuncien los cambios.
  template: `
    <div class="region" role="status" aria-live="polite">
      @if (message(); as text) {
        <p class="toast">{{ text }}</p>
      }
    </div>
  `,
  styles: `
    .toast { margin: 1rem 0 0; padding: .75rem 1rem; border-radius: 8px; background: var(--accent-soft); }
  `,
})
export class WorkoutToastComponent {
  readonly message = input<string | null>(null);
}
