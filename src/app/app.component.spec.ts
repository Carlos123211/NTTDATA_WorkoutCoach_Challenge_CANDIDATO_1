import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { appConfig } from './app.config';

/** Smoke test con la configuración real de la app (zoneless + infraestructura mock). */
describe('AppComponent', () => {
  it('renders the workout page with the mock exercises', async () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('h1')?.textContent?.trim()).toBe('Workout Coach');
    expect(host.querySelectorAll('app-exercise-item').length).toBe(3);
    fixture.destroy();
  });
});
