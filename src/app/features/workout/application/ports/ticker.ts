/** Detiene el ticker. Debe ser idempotente. */
export type StopTicker = () => void;

/**
 * Puerto de reloj. Sin estado: cada `start` devuelve su propia función de parada,
 * por lo que una única instancia puede servir a varios consumidores.
 */
export interface Ticker {
  start(onTick: () => void, intervalMs: number): StopTicker;
}
