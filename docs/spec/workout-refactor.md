# Spec — Refactor de la feature `workout`

| Campo | Valor |
|---|---|
| Versión | 1.1 |
| Estado | Aprobada para implementación |
| Autor | Carlos Gamarra |
| Fecha | 2026-11-06 |
| Reto | [`docs/CHALLENGE.md`](../CHALLENGE.md) |

> Esta spec es la fuente de verdad del refactor. Si el enfoque cambia durante la implementación, se actualiza esta spec **antes** del código y se registra en el [historial de cambios](#12-historial-de-cambios).

---

## 1. Contexto y problema

`Workout Coach` es una app Angular 20 con un único componente (`WorkoutTimerComponent`) que concentra carga de datos, máquina de estados del temporizador, notificaciones y renderizado.

### 1.1 Estado inicial de la base (antes del WS0)

La base **no compilaba**, contrario a lo indicado en el reto:

| Problema | Evidencia | Corregido en |
|---|---|---|
| `ng build` fallaba | `Failed to read index HTML file src/index.html` | WS0 |
| `ng test` no compilaba | `TS2593: Cannot find name 'describe'` (faltaba `@types/jasmine`) | WS0 |
| `ng serve` fallaba | `Data path "" must have required property 'buildTarget'` | WS0 |
| Sin `zone.js` ni modo zoneless | `bootstrapApplication` sin providers usa detección basada en zonas por defecto en Angular 20.3 (error `NG0908` si falta Zone) | WS0 (zone.js temporal) → WS5 (zoneless) |

### 1.2 Deuda técnica del código legacy

| # | Problema | Ubicación |
|---|---|---|
| P1 | `any` explícito (`exercise:any`, `timer:any`, `getWorkout(): any`) anula `strict: true` | `workout-timer.ts:6`, `workout.service.ts:4` |
| P2 | Inyección por constructor y presentación acoplada a la fuente de datos | `workout-timer.ts:7` |
| P3 | DTO `snake_case` usado directamente en el template | `workout-timer.html:3,6` |
| P4 | Máquina de estados imperativa dentro de un `setInterval` del componente | `workout-timer.ts:8` |
| P5 | Estado mutable en campos de clase (no reactivo; incompatible con zoneless) | `workout-timer.ts:6` |
| P6 | El intervalo no se limpia al destruir el componente (fuga) | `workout-timer.ts` (sin `ngOnDestroy`) |
| P7 | `*ngIf`, `[ngClass]`, `CommonModule`; sin `OnPush` | `workout-timer.html`, `workout-timer.ts:4` |
| P8 | Formato de tiempo con `00:` fijo (75 s → `00:75`) | `workout-timer.html:5` |
| P9 | Clase `rest` aplicada sin estilo asociado | `workout-timer.html:4`, `styles.css` |
| P10 | Un solo ejercicio; no existe el concepto de sesión con varios ejercicios | `workout.service.ts:5` |
| P11 | Único test: "creates the app" | `app.component.spec.ts` |

### 1.3 Comportamiento legacy observado (baseline)

Traza real en navegador (Squats, 3 reps, 5 s ejercicio, 3 s descanso):

| t (s) | Fase | Reloj | Reps | Toast | Botones |
|---|---|---|---|---|---|
| 0 | Exercise | 00:05 | 0/3 | — | Start, Reset |
| 1–4 | Exercise | 00:04 → 00:01 | 0/3 | — | Pause, Reset |
| 5–7 | Rest | 00:03 → 00:01 | 0/3 | Rest time | Pause, Reset |
| 8 | Exercise | 00:05 | **1/3** | Back to exercise | Pause, Reset |
| … | (se repite) | | | | |
| 24 | Exercise | **00:05** | 3/3 | Workout completed | **Start**, Reset |

**Defectos detectados en el baseline** (se corrigen, ver D3):
- Al finalizar, el reloj vuelve a `00:05` aunque no queda nada por hacer.
- Tras finalizar, `Start` vuelve a estar disponible y reanuda el conteo **más allá de 3/3**.

---

## 2. Alcance

### 2.1 Dentro de alcance
- Reorganizar la feature en `domain / application / infrastructure / presentation` con inversión de dependencias.
- Mock que devuelve una **lista de ejercicios** con DTO `snake_case` mapeado en infrastructure.
- Sesión que avanza automáticamente entre ejercicios con estado por ejercicio (Pendiente / En curso / Completado).
- Mantener temporizador repetición/descanso, notificación (toast), contador y controles Iniciar / Pausar / Reiniciar.
- Container / Presentational con `input()`, `output()`, `OnPush`.
- Angular moderno: standalone, Signals, `computed()`, `inject()`, `@if`/`@for`, zoneless, sin `any`, limpieza de timers.
- Tests unitarios de dominio, mapper, caso de uso/store y componentes presentacionales.
- Diseño (no implementación) de evolución a microfrontends + NgRx (§10).

### 2.2 Fuera de alcance
- Backend real / `HttpClient` (el puerto lo permite sin cambiar dominio ni UI).
- Persistencia del progreso, routing, autenticación, i18n con librería.
- Corrección de deriva del temporizador basada en timestamps (`setInterval` de 1 s es suficiente para el caso de uso).
- Implementación de Native Federation y NgRx.
- Tests E2E automatizados y reglas ESLint de límites entre capas (se verifica por inspección/grep, ver CA-13).

---

## 3. Decisiones de comportamiento

Ambigüedades del reto resueltas explícitamente:

| ID | Decisión | Justificación |
|---|---|---|
| D1 | **Hay descanso después de cada repetición, incluida la última** de cada ejercicio. La repetición cuenta como completada al terminar su descanso. | El reto lo exige ("Al terminar descanso se incrementa la repetición completada") y coincide con el baseline. |
| D2 | Al completar las repeticiones, el siguiente ejercicio **arranca inmediatamente** en fase ejercicio, con el contador a 0. | "La sesión avanza automáticamente entre ejercicios". |
| D3 | Al completar el último ejercicio: estado `finished`, reloj a `00:00`, **Iniciar deshabilitado**; solo Reiniciar. | Corrige los defectos del baseline (§1.3). |
| D4 | Pausar conserva ejercicio, fase, segundos restantes y repeticiones. Iniciar reanuda desde ahí. | CA-7. La fracción de segundo en curso se descarta (igual que el legacy). |
| D5 | Reiniciar devuelve **exactamente** el estado inicial (D6) sin volver a consultar el repositorio. | CA-7. Los datos no cambian durante la sesión. |
| D6 | Estado inicial: `idle`, todos los ejercicios `Pendiente`, reloj con el `repetition_time` del primer ejercicio, sin toast. **No arranca solo.** | CA-1 y baseline. |
| D7 | `rest_time = 0` es válido: se omite el descanso y la repetición se completa al acabar el tiempo de ejercicio. | Caso límite razonable; evita un "descanso de 0 s" visible. |
| D8 | Lista vacía: carga correcta, mensaje "No hay ejercicios", Iniciar deshabilitado. | Caso límite. |
| D9 | Datos inválidos (tiempos/reps no enteros o fuera de rango, `id`/nombre vacío, `id` duplicado): error de carga visible, sin crash. | Caso de error. El `id` único es necesario para `@for … track`. |
| D10 | Reloj en formato `mm:ss`. | Corrige P8. |
| D11 | Textos de UI en **español**, centralizados en presentation. | Coherencia con la terminología del reto (Iniciar/Pausar/Reiniciar, Pendiente/En curso/Completado). |

---

## 4. Diseño propuesto

### 4.1 Capas y regla de dependencias

```text
presentation ──► application ──► domain
                      ▲             ▲
infrastructure ───────┴─────────────┘   (implementa puertos)

app.config.ts (composition root) ──► infrastructure (solo para registrar providers)
```

| Capa | Puede depender de | Contenido | Angular |
|---|---|---|---|
| `domain` | nada | Modelos, invariantes, transiciones puras, puerto `WorkoutRepository`, errores | **No** (TS puro) |
| `application` | `domain` | Caso de uso `LoadWorkout`, `WorkoutSessionStore`, puerto `Ticker`, tokens DI | Sí: `signal`, `computed`, `inject`, `InjectionToken`. Sin UI ni HTTP |
| `infrastructure` | `domain`, `application` (puertos/tokens) | DTO, mapper, repositorio mock, `IntervalTicker`, `provideWorkoutInfrastructure()` | Sí |
| `presentation` | `application`, `domain` | Container + presentacionales, textos, formato de tiempo | Sí |

- **Por qué los tokens DI viven en `application`:** una `interface` TS no existe en runtime y `InjectionToken` requiere `@angular/core`, que no puede entrar en `domain`.
- **Composition root:** `src/app/app.config.ts` es el único sitio fuera de infrastructure que la importa, para registrar providers. Presentation nunca la importa.

### 4.2 Estructura de carpetas

```text
src/app/
├─ app.component.ts
├─ app.config.ts                         # zoneless + provideWorkoutInfrastructure()
└─ features/workout/
   ├─ domain/
   │  ├─ exercise.ts                     # Exercise + createExercise() (invariantes)
   │  ├─ workout.ts                      # Workout + createWorkout()
   │  ├─ workout-session.ts              # WorkoutSession + start/pause/reset/tick
   │  ├─ exercise-status.ts              # exerciseStatus() derivado
   │  ├─ workout.errors.ts               # InvalidExerciseError
   │  ├─ workout.repository.ts           # puerto
   │  └─ *.spec.ts
   ├─ application/
   │  ├─ ports/ticker.ts                 # puerto Ticker
   │  ├─ workout.tokens.ts               # WORKOUT_REPOSITORY, TICKER
   │  ├─ load-workout.use-case.ts
   │  ├─ workout-session.store.ts        # estado con Signals
   │  └─ *.spec.ts
   ├─ infrastructure/
   │  ├─ dto/exercise.dto.ts             # snake_case
   │  ├─ mappers/exercise.mapper.ts
   │  ├─ mock/workout.mock.ts
   │  ├─ mock-workout.repository.ts
   │  ├─ interval-ticker.ts
   │  ├─ workout.providers.ts
   │  └─ *.spec.ts
   └─ presentation/
      ├─ containers/workout-page/        # WorkoutPageComponent
      ├─ components/
      │  ├─ workout-timer/               # WorkoutTimerComponent
      │  ├─ exercise-list/               # ExerciseListComponent
      │  ├─ exercise-item/               # ExerciseItemComponent
      │  └─ workout-toast/               # WorkoutToastComponent
      ├─ format-seconds.ts
      └─ workout.texts.ts
```

Se eliminan `components/workout-timer/` (legacy) y `services/workout.service.ts`.

### 4.3 Modelo de dominio y contratos

```ts
// domain/exercise.ts
export interface Exercise {
  readonly id: string;
  readonly name: string;
  readonly repetitions: number;     // entero ≥ 1
  readonly repetitionTime: number;  // segundos, entero ≥ 1
  readonly restTime: number;        // segundos, entero ≥ 0  (D7)
}
export function createExercise(props: Exercise): Exercise; // lanza InvalidExerciseError (D9)

// domain/workout.ts
export interface Workout { readonly exercises: readonly Exercise[]; } // puede ser vacía (D8)
export function createWorkout(exercises: readonly Exercise[]): Workout; // ids únicos (track en @for)

// domain/workout-session.ts
export type SessionStatus = 'idle' | 'running' | 'paused' | 'finished';
export type Phase = 'exercise' | 'rest';
export type SessionEvent =
  | 'rest-started' | 'repetition-started' | 'exercise-completed' | 'workout-completed';

export interface WorkoutSession {
  readonly workout: Workout;
  readonly status: SessionStatus;
  readonly currentIndex: number;
  readonly phase: Phase;
  readonly remainingSeconds: number;
  readonly completedRepetitions: number;   // del ejercicio actual
  readonly lastEvent: SessionEvent | null; // alimenta el toast
}

export function createSession(workout: Workout): WorkoutSession; // D6
export function start(s: WorkoutSession): WorkoutSession;
export function pause(s: WorkoutSession): WorkoutSession;
export function reset(s: WorkoutSession): WorkoutSession;         // = createSession(s.workout)
export function tick(s: WorkoutSession): WorkoutSession;          // avanza 1 segundo

// domain/exercise-status.ts
export type ExerciseStatus = 'pending' | 'in-progress' | 'completed';
export function exerciseStatus(s: WorkoutSession, index: number): ExerciseStatus;

// domain/workout.repository.ts
export interface WorkoutRepository { getWorkout(): Promise<Workout>; }
```

- **`Promise` en el puerto** (no `Observable`): mantiene `domain` libre de dependencias (ni RxJS). Un adaptador HTTP puede usar `firstValueFrom`.
- **Estado inmutable:** todas las transiciones devuelven un objeto nuevo. Si una transición no aplica, devuelve **la misma referencia**, y el store no emite cambios innecesarios.

### 4.4 Máquina de estados

```text
            start                      pause
  idle ───────────► running ◄──────────────► paused
   ▲                   │        start
   │ reset (desde      │ tick (último descanso del último ejercicio)
   │  cualquier        ▼
   └──── estado) ── finished
```

| Transición | Precondición | Resultado |
|---|---|---|
| `start` | `idle` o `paused`, y ≥ 1 ejercicio | `status = running` |
| `start` | `running`, `finished` o lista vacía | sin cambio (misma referencia) |
| `pause` | `running` | `status = paused` |
| `pause` | otro estado | sin cambio |
| `reset` | cualquiera | `createSession(workout)` |
| `tick` | distinto de `running` | sin cambio |

**`tick` con `status = running`:**

1. `remaining = remainingSeconds - 1`. Si `remaining > 0`, actualiza solo los segundos restantes (`lastEvent` se mantiene).
2. Si `remaining === 0` y `phase = exercise`:
   - con `restTime > 0` → `phase = rest`, `remainingSeconds = restTime`, `lastEvent = 'rest-started'`;
   - con `restTime = 0` → **completar repetición** (paso 4).
3. Si `remaining === 0` y `phase = rest` → **completar repetición**.
4. **Completar repetición:** `completed = completedRepetitions + 1`.
   - Si `completed < repetitions` → `phase = exercise`, `remainingSeconds = repetitionTime`, `lastEvent = 'repetition-started'`.
   - Si no, y hay siguiente ejercicio → `currentIndex + 1`, `completedRepetitions = 0`, `phase = exercise`, `remainingSeconds = siguiente.repetitionTime`, `lastEvent = 'exercise-completed'`.
   - Si no → `status = finished`, `remainingSeconds = 0`, `completedRepetitions = repetitions`, `lastEvent = 'workout-completed'`.

**Estado de cada ejercicio** (`exerciseStatus`, derivado, nunca almacenado):

| Sesión | `index < currentIndex` | `index === currentIndex` | `index > currentIndex` |
|---|---|---|---|
| `idle` | — | pending | pending |
| `running` / `paused` | completed | in-progress | pending |
| `finished` | completed | completed | completed |

### 4.5 Application

```ts
// application/ports/ticker.ts
export type StopTicker = () => void;
export interface Ticker { start(onTick: () => void, intervalMs: number): StopTicker; }

// application/workout.tokens.ts
export const WORKOUT_REPOSITORY = new InjectionToken<WorkoutRepository>('WORKOUT_REPOSITORY');
export const TICKER = new InjectionToken<Ticker>('TICKER');

// application/load-workout.use-case.ts
@Injectable({ providedIn: 'root' })
export class LoadWorkoutUseCase { execute(): Promise<Workout>; }

// application/workout-session.store.ts  — provisto en el container (una instancia por página)
@Injectable()
export class WorkoutSessionStore {
  readonly loadState: Signal<'loading' | 'ready' | 'error'>;
  readonly session: Signal<WorkoutSession | null>;
  readonly exercises: Signal<readonly { exercise: Exercise; status: ExerciseStatus }[]>;
  readonly currentExercise: Signal<Exercise | null>;
  readonly canStart: Signal<boolean>;
  readonly canPause: Signal<boolean>;
  load(): Promise<void>;
  start(): void;
  pause(): void;
  reset(): void;
}
```

- **`Ticker` sin estado:** `start()` devuelve su propia función de parada, así que una única instancia en root sirve para cualquier número de stores.
- **El store solo orquesta:** aplica funciones de dominio sobre un `signal`, arranca el ticker en `start` y lo para en `pause`, `reset`, al pasar a `finished` y en `DestroyRef.onDestroy` (corrige P6).
- **Store a nivel de container:** el estado vive y muere con la página; nada de singletons globales mutables.

### 4.6 Infrastructure

```ts
// dto/exercise.dto.ts — contrato externo, se conserva snake_case
export interface ExerciseDto {
  id: string;
  exercise_name: string;
  repetitions_number: number;
  repetition_time: number;
  rest_time: number;
}
```

- **`exercise.mapper.ts`:** `toExercise(dto)` renombra campos y delega la validación en `createExercise` del dominio, así las invariantes viven en un solo sitio. `toWorkout(dtos)` mapea la lista.
- **`workout.mock.ts`:** el primer ejercicio es **Squats (3 reps, 5 s / 3 s)** para preservar el baseline, seguido de dos ejercicios más con tiempos cortos.
- **`MockWorkoutRepository`:** implementa `WorkoutRepository` y devuelve `Promise.resolve(toWorkout(MOCK))`.
- **`IntervalTicker`:** `setInterval` / `clearInterval`.
- **`provideWorkoutInfrastructure()`:** registra `{ provide: WORKOUT_REPOSITORY, useClass: MockWorkoutRepository }` y `{ provide: TICKER, useClass: IntervalTicker }`.

### 4.7 Presentation

| Componente | Tipo | Inputs | Outputs |
|---|---|---|---|
| `WorkoutPageComponent` | Container (`inject(WorkoutSessionStore)`, `providers: [WorkoutSessionStore]`) | — | — |
| `WorkoutTimerComponent` | Presentacional | `exerciseName`, `phase`, `remainingSeconds`, `completedRepetitions`, `totalRepetitions`, `canStart`, `canPause` | `start`, `pause`, `reset` |
| `ExerciseListComponent` | Presentacional | `items` | — |
| `ExerciseItemComponent` | Presentacional | `name`, `repetitions`, `status` | — |
| `WorkoutToastComponent` | Presentacional | `message: string \| null` | — |

- Todos son standalone, `ChangeDetectionStrategy.OnPush`, con `@if`/`@for (… ; track item.exercise.id)` y sin `CommonModule`.
- Los presentacionales **no inyectan nada**.
- `formatSeconds(n): string` (`mm:ss`) es una función pura.
- `workout.texts.ts` mapea `SessionEvent → mensaje`, `ExerciseStatus → etiqueta` y `Phase → etiqueta`.

### 4.8 Flujo de datos

```text
[click Iniciar] → WorkoutTimerComponent.start (output)
   → WorkoutPageComponent → store.start()
      → session.set(domain.start(session))     // status: running
      → stop = ticker.start(() => store.onTick(), 1000)

[cada 1 s] → store.onTick()
   → session.set(domain.tick(session))
   → si status ≠ running → stop()
   → computed() (exercises, currentExercise, canStart…) se recalculan
   → los componentes OnPush que leen esos signals se re-renderizan (zoneless)
```

---

## 5. Workstreams

Cada workstream es un commit (o varios) con Conventional Commits y deja build y tests en verde.

| WS | Entregable | Commit sugerido | Estado |
|---|---|---|---|
| WS0 | Base compilable: `index.html`, `zone.js` (temporal), `@types/jasmine`, `defaultConfiguration` de serve | `fix(build): …` | ✅ Hecho |
| WS1 | Esta spec | `docs(spec): add workout refactor specification` | ✅ Hecho |
| WS2 | `domain/` + tests | `feat(workout-domain): …` | ✅ Hecho |
| WS3 | `infrastructure/` (DTO, mapper, mock, ticker, providers) + tests | `feat(workout-infra): …` | ⬜ |
| WS4 | `application/` (use case, store, tokens, puerto Ticker) + tests | `feat(workout-app): …` | ⬜ |
| WS5 | `presentation/` + `app.config.ts` zoneless; quitar `zone.js` y el código legacy | `refactor(workout-ui): …` | ⬜ |
| WS6 | README (ejecución, arquitectura, evidencia) y actualización de §9 | `docs: …` | ⬜ |

---

## 6. Criterios de aceptación

### 6.1 Funcionales (del reto)

| ID | Criterio | Verificado por |
|---|---|---|
| CA-1 | Al cargar, todos los ejercicios están pendientes y la sesión no inicia sola. | `workout-session.spec`, `workout-session.store.spec` |
| CA-2 | Iniciar activa el primer ejercicio y su `repetition_time`. | `workout-session.spec` |
| CA-3 | Al llegar a cero se inicia descanso con `rest_time`. | `workout-session.spec` |
| CA-4 | Al terminar descanso se incrementa la repetición completada. | `workout-session.spec` |
| CA-5 | Al completar repeticiones, el ejercicio se completa y arranca el siguiente. | `workout-session.spec`, `exercise-status.spec` |
| CA-6 | Al completar el último ejercicio, el entrenamiento finaliza. | `workout-session.spec`, `workout-session.store.spec` (ticker parado) |
| CA-7 | Pausar conserva progreso. Reiniciar vuelve al estado inicial. | `workout-session.spec`, `workout-session.store.spec` |

### 6.2 Adicionales (de las decisiones y requisitos técnicos)

| ID | Criterio | Verificado por |
|---|---|---|
| CA-8 | En `finished`, Iniciar está deshabilitado y `tick`/`start` no cambian el estado (D3). | `workout-session.spec`, `workout-timer.component.spec` |
| CA-9 | `rest_time = 0` omite el descanso (D7). | `workout-session.spec` |
| CA-10 | Lista vacía: no se puede iniciar (D8). | `workout-session.spec`, `workout-session.store.spec` |
| CA-11 | DTO inválido → `InvalidExerciseError`; el store pasa a `loadState = error` sin romper (D9). | `exercise.mapper.spec`, `workout-session.store.spec` |
| CA-12 | El ticker se detiene al pausar, reiniciar, finalizar y destruir. | `workout-session.store.spec` |
| CA-13 | Reglas de capas: `domain` sin imports de `@angular`/`rxjs`; `presentation` sin imports de `infrastructure`; ningún `any`. | Comandos de §9.2 |
| CA-14 | Los presentacionales no inyectan dependencias y usan `OnPush`. | Revisión + specs de componente |
| CA-15 | Reloj en `mm:ss` (D10). | `format-seconds.spec` |
| CA-16 | `npm run build` y `npm test` en verde; app arrancada sin `zone.js`. | §9 |

---

## 7. Plan de tests

| Archivo | Escenarios |
|---|---|
| `domain/exercise.spec.ts` | Válido; reps 0; `repetitionTime` 0; `restTime` negativo; valores no enteros, `NaN` o `Infinity`; `id`/nombre vacío o en blanco. |
| `domain/workout.spec.ts` | Orden; lista vacía; no comparte el array de entrada; `id` duplicado → error. |
| `domain/workout-session.spec.ts` | CA-1…CA-10. Recorrido completo con 2 ejercicios (secuencia exacta de estados); `start` doble; `pause` en idle; `tick` en paused/idle/finished; `reset` en mitad de un descanso; misma referencia cuando no hay cambio; inmutabilidad (el estado anterior no muta). |
| `domain/exercise-status.spec.ts` | La tabla de §4.4 completa. |
| `infrastructure/exercise.mapper.spec.ts` | `snake_case` → `camelCase`; lista; DTO inválido → error. |
| `application/workout-session.store.spec.ts` | Con `FakeTicker` (dispara ticks a mano) y repositorio fake: carga ok / error / vacía; flujo completo; el ticker se para en pause, reset, finished y destroy; `canStart`/`canPause`. |
| `presentation/format-seconds.spec.ts` | 0 → `00:00`; 5 → `00:05`; 75 → `01:15`. |
| `presentation/.../exercise-item.component.spec.ts` | Etiqueta y clase CSS por estado (`setInput`). |
| `presentation/.../workout-timer.component.spec.ts` | Muestra `mm:ss` y la fase; Iniciar/Pausar según inputs; emite `start`/`pause`/`reset` al hacer clic. |
| `app.component.spec.ts` | Smoke test con `provideZonelessChangeDetection` y la infraestructura real. |

**Determinismo:** ningún test depende del reloj real. El dominio se prueba llamando a `tick()` y el store con `FakeTicker`.

---

## 8. Riesgos

| Riesgo | Mitigación |
|---|---|
| Pasar a zoneless y que una vista no se refresque | Todo el estado de UI se lee desde Signals; smoke test en navegador tras WS5. |
| Romper el comportamiento existente | La traza baseline (§1.3) se reproduce en el test de recorrido completo con los datos de Squats. |
| Deriva de `setInterval` en pestañas inactivas | Aceptado (fuera de alcance); el puerto `Ticker` permite sustituirlo por uno basado en timestamps. |

---

## 9. Evidencia de build y tests

### 9.1 Tras WS0 (base corregida)

```text
$ npm run build
Initial total | 143.45 kB | 44.07 kB (transfer)
Application bundle generation complete.

$ npm test
Chrome 157.0.0.0 (Windows 10): Executed 1 of 1 SUCCESS
TOTAL: 1 SUCCESS
```

Traza de ejecución en navegador: ver §1.3.

### 9.2 Tras WS2 (dominio)

```text
$ npm test
TOTAL: 50 SUCCESS        # 1 smoke + 49 de dominio

# Mutation check manual (se introduce un bug y se verifica que los tests lo detectan):
completedRepetitions <= repetitions   →  4 FAILED
ignorar restTime = 0                  →  1 FAILED

$ grep -rnE "from '@angular|from 'rxjs" src/app/features/workout/domain   → 0 resultados
$ grep -rnE ":\s*any\b|<any>|as any"   src/app/features/workout/domain   → 0 resultados
```

### 9.3 Tras WS5 (a completar en WS6)

```bash
npm run build
npm test
# CA-13: deben devolver 0 resultados
grep -rnE "from '@angular|from 'rxjs" src/app/features/workout/domain
grep -rn  "infrastructure" src/app/features/workout/presentation
grep -rnE ":\s*any\b|<any>|as any" src/app
```

_Pendiente._

---

## 10. Extensión: microfrontends y gestión de estado (diseño)

### 10.1 Shell / Remotes
- **Shell (host):** layout, navegación, autenticación, sesión de usuario, tema y carga de remotes por ruta.
- **Remote `workout`:** expone `WORKOUT_ROUTES`, con `WorkoutPageComponent` como entrada. Es dueño de su dominio, de su estado y de sus adaptadores. La arquitectura por capas de esta spec se mantiene **dentro** del remote.
- Otros remotes posibles: `history` (histórico de sesiones) y `plans` (planes de entrenamiento).

### 10.2 Federación
- **Native Federation** (`@angular-architects/native-federation`): el proyecto ya usa el builder esbuild (`@angular/build:application`), y Native Federation se apoya en estándares (ES modules + import maps). Module Federation obligaría a volver a webpack.
- La carga es perezosa por ruta: `loadRemoteModule('workout', './routes')`, con un manifest por entorno para desplegar cada remote de forma independiente.

### 10.3 Dependencias compartidas
- `@angular/*`, `rxjs` y `tslib` como `singleton: true, strictVersion: true`. Dos instancias de Angular rompen la DI y los Signals entre shell y remote.
- Una librería `@workout-coach/contracts` (solo tipos y eventos) versionada con semver. **No** se comparte el dominio de `workout`.

### 10.4 Estado local vs compartido
- **Local del remote** (Signals, como en esta spec): sesión, temporizador y lista de ejercicios. Nadie fuera del remote necesita el segundo a segundo.
- **Compartido** (mínimo y por contrato): usuario autenticado, tema y, como mucho, eventos de negocio (`workout.completed`) publicados mediante un bus tipado o `CustomEvent`s en `window`. Nunca un store global con acceso directo al estado de otro remote.

### 10.5 Cuándo usar NgRx / Redux
Signals con un store por feature es suficiente mientras el estado sea local y síncrono, como ahora. NgRx se justifica cuando aparece al menos una de estas situaciones:
- estado compartido entre varias features o remotes (por ejemplo, el progreso visible en el shell);
- efectos asíncronos encadenados (guardar el progreso, reintentos, sincronizar entre pestañas u offline);
- necesidad de trazabilidad o depuración temporal (Redux DevTools) o de un equipo grande con convenciones fuertes.

Cómo encajaría con esta spec:

| Pieza | Equivalente |
|---|---|
| Actions | `startWorkout`, `pauseWorkout`, `resetWorkout`, `tick`, `loadWorkout`, `loadWorkoutSuccess`, `loadWorkoutFailure` |
| Reducer | Reutiliza **directamente** `start`, `pause`, `reset` y `tick` del dominio (ya son `(estado) → estado`) |
| Effects | Carga desde `WorkoutRepository`; ticker (`interval` + `takeUntil` de pause/reset/finished); persistencia en `workout-completed` |
| Selectors | `exercises`, `currentExercise`, `canStart`… (los `computed()` actuales) |

Paso intermedio recomendado: `@ngrx/signals` (`signalStore` + `withMethods`), que mantiene la API de Signals y permite migrar el `WorkoutSessionStore` casi 1:1.

---

## 11. Glosario
- **Repetición completada:** repetición cuyo tiempo de ejercicio **y** su descanso han terminado (D1).
- **Sesión:** ejecución de un `Workout` desde `idle` hasta `finished`.

## 12. Historial de cambios

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 2026-11-06 | Versión inicial. |
| 1.1 | 2026-11-06 | WS2: se añade la invariante de `id` único en `createWorkout` (D9), `workout.spec.ts` al plan de tests y la evidencia del dominio (§9.2). |
