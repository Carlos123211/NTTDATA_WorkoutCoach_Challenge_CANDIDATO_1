/** Contrato externo. Conserva snake_case; solo se usa dentro de infrastructure. */
export interface ExerciseDto {
  readonly id: string;
  readonly exercise_name: string;
  readonly repetitions_number: number;
  readonly repetition_time: number;
  readonly rest_time: number;
}
