# Workout Coach — Reto Frontend NTT DATA

Evolución de la app legacy `Workout Coach` (Angular 20) a una arquitectura limpia, **sin romper su comportamiento**:

- Clean Architecture en 4 capas, con inversión de dependencias.
- Patrón Container / Presentational.
- Signals y modo zoneless.
- Entrenamiento completo con varios ejercicios.
- 117 tests.

Todo el trabajo se guio por una spec versionada: **[`docs/spec/workout-refactor.md`](docs/spec/workout-refactor.md)**.

| | |
|---|---|
| Enunciado del reto | [`docs/CHALLENGE.md`](docs/CHALLENGE.md) |
| Spec (diseño, decisiones, criterios, evidencia) | [`docs/spec/workout-refactor.md`](docs/spec/workout-refactor.md) |
| Diseño de microfrontends y NgRx | [Spec §10](docs/spec/workout-refactor.md#10-extensión-microfrontends-y-gestión-de-estado-diseño) |

---

## Requisitos

- Node.js `^20.19`, `^22.12` o `^24` (requisito de Angular 20). Verificado con Node 24.16 y npm 11.13.
- Google Chrome, para ejecutar los tests con Karma.

## Ejecución

```bash
npm ci        # instala exactamente lo fijado en package-lock.json
npm start     # http://localhost:4200
```

## Build y tests

```bash
npm run build   # salida en dist/workout-coach
npm test        # Karma + Jasmine en Chrome, una sola pasada
```

---

## Qué hace la app

1. Carga un entrenamiento de **3 ejercicios** (mock) y muestra la lista completa, todos en estado **Pendiente**. No arranca sola.
2. **Iniciar** pone en marcha el primer ejercicio. Cada repetición tiene un tiempo de ejercicio y luego uno de descanso. La repetición cuenta como completada al acabar el descanso.
3. Al completar las repeticiones, el ejercicio pasa a **Completado** y el siguiente arranca automáticamente.
4. Tras el último ejercicio, el entrenamiento **finaliza**: el reloj queda en `00:00` e Iniciar se deshabilita.
5. **Pausar** conserva el progreso y **Reiniciar** vuelve al estado inicial. Una notificación anuncia cada cambio de fase.

## Arquitectura

```text
presentation ──► application ──► domain
                      ▲             ▲
infrastructure ───────┴─────────────┘   (implementa los puertos)

app.config.ts (composition root) ──► infrastructure
```

| Capa | Responsabilidad | Piezas principales |
|---|---|---|
| [`domain/`](src/app/features/workout/domain) | Reglas del negocio en **TypeScript puro**, sin Angular ni RxJS | `Exercise` y `Workout` con sus invariantes; máquina de estados inmutable `start`/`pause`/`reset`/`tick`; `exerciseStatus`; puerto `WorkoutRepository` |
| [`application/`](src/app/features/workout/application) | Orquestación | `LoadWorkoutUseCase`; `WorkoutSessionStore` (Signals); puerto `Ticker`; tokens DI |
| [`infrastructure/`](src/app/features/workout/infrastructure) | Adaptadores | DTO en `snake_case`, mapper, `MockWorkoutRepository`, `IntervalTicker`, `provideWorkoutInfrastructure()` |
| [`presentation/`](src/app/features/workout/presentation) | UI | Container `WorkoutPageComponent`; presentacionales `WorkoutTimer`, `ExerciseList`, `ExerciseItem` y `WorkoutToast` |

**Cómo fluyen los datos.** Un clic en Iniciar llega al container, que llama a `store.start()`. El store aplica `start()` del dominio sobre un `signal` y arranca el `Ticker`. Cada segundo, el store aplica `tick()` del dominio. Los `computed()` se recalculan y los componentes `OnPush` se refrescan, sin necesidad de zone.js.

### Decisiones clave

- **Dominio puro e inmutable.** Cada transición es una función de estado a estado y, si no aplica, devuelve la misma referencia. Es fácil de testear, y sería directamente reutilizable como reducer de NgRx.
- **El estado de cada ejercicio se deriva, no se guarda.** Así no puede desincronizarse con la sesión.
- **`canStart` y `canPause` se calculan reutilizando el dominio** (`start(s) !== s`). Las reglas existen en un único sitio.
- **El reloj es un puerto (`Ticker`).** Los tests avanzan el tiempo a mano, sin `setTimeout` reales, y el temporizador se libera al pausar, reiniciar, terminar o destruir la página.
- **Los DTO en `snake_case` no salen de infrastructure.** El mapper solo renombra campos; la validación la hace el dominio.
- **Zoneless.** Se eliminó `zone.js`, y el bundle inicial bajó de 143 kB a 128 kB.

Las 11 decisiones de comportamiento (D1–D11), como el descanso tras la última repetición o la lista vacía, están justificadas en la [§3 de la spec](docs/spec/workout-refactor.md#3-decisiones-de-comportamiento).

## Tests

| Capa | Tests | Enfoque |
|---|---|---|
| domain | 49 | Los 7 criterios del reto, casos límite, inmutabilidad (`deepFreeze`) y reproducción segundo a segundo de la traza del legacy |
| infrastructure | 15 | Mapper, repositorio (Promise rechazada ante datos inválidos), `IntervalTicker` con `jasmine.clock` y providers |
| application | 18 | Store con `FakeTicker` y repositorio fake: carga, error, lista vacía, flujo completo y liberación del ticker (incluida la destrucción) |
| presentation | 34 | Componentes presentacionales con `setInput` y outputs, más una integración container + store que recorre un entrenamiento completo por la UI |
| app | 1 | Smoke test con el `appConfig` real |

La calidad de los tests se comprobó introduciendo errores a propósito en el dominio y en el store: los tests detectaron los 5. Detalle en la [§9 de la spec](docs/spec/workout-refactor.md#9-evidencia-de-build-y-tests).

## Evidencia

| Comprobación | Resultado |
|---|---|
| `npm ci && npm run build` en un clon limpio | ✅ 127.91 kB (38.28 kB comprimido) |
| `npm test` en un clon limpio | ✅ 117 / 117 |
| Reglas de capas, sin `any`, sin DI en presentacionales, sin sintaxis legacy | ✅ 0 violaciones |
| Recorrido completo en navegador, sin zone.js | ✅ |

Comandos y trazas completas en la [§9.5 de la spec](docs/spec/workout-refactor.md#95-tras-ws5-presentation-zoneless--estado-final).

## Historial

El trabajo está dividido en workstreams. Cada uno es un commit con Conventional Commits y deja build y tests en verde.

| WS | Commit | Contenido |
|---|---|---|
| WS0 | `fix(build)` | La base no compilaba: faltaban `index.html`, `@types/jasmine` y la configuración de `serve`, y no había zone.js |
| WS1 | `docs(spec)` | Spec |
| WS2 | `feat(workout-domain)` | Dominio + tests |
| WS3 | `feat(workout-infra)` | Infrastructure + tests |
| WS4 | `feat(workout-app)` | Application + tests |
| WS5 | `refactor(workout-ui)` | Presentation, modo zoneless y eliminación del código legacy |
| WS6 | `docs` | Este README y el cierre de la spec |

## Fuera de alcance

- Backend real (bastaría un `HttpWorkoutRepository` que implemente el puerto).
- Persistencia del progreso.
- i18n con librería (los textos ya están centralizados).
- Tests E2E.
- Reglas ESLint de límites entre capas (hoy se verifican con los comandos de la spec).
- Implementación de Native Federation y NgRx (solo diseño, en la [§10 de la spec](docs/spec/workout-refactor.md#10-extensión-microfrontends-y-gestión-de-estado-diseño)).
