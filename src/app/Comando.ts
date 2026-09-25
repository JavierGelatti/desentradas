import type { Aplicacion } from "./Aplicacion.ts";
import type { Desempate } from "../models/Desempate.ts";
import type { Grupo } from "../models/Grupo.ts";
import type { ComandoJson } from "./json/ComandoJson.ts";

export type Asistencia = { presentes: readonly string[]; ausentes: readonly string[] };

// Un registro de la bitácora: sabe ejecutarse sobre el grupo actual (que no existe hasta crearlo),
// convertirse a JSON para volver a ejecutarse más adelante, describirse para el historial
// y devolverle a la aplicación lo que haga falta para retomarlo cuando se deshace.
export interface Comando {
  ejecutar(grupo: Grupo | undefined, desempate: Desempate): Grupo;
  alDeshacerse(aplicacion: Aplicacion): void;
  fecha(): Date;
  describir(): string;
  asistencia(): Asistencia | undefined;
  aJson(): ComandoJson;
}
