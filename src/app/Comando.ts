import type { Aplicacion } from "./Aplicacion.ts";
import type { Desempate } from "../models/Desempate.ts";
import type { Grupo } from "../models/Grupo.ts";
import type { ComandoJson } from "./json/ComandoJson.ts";

export type Asistencia = { presentes: readonly string[]; ausentes: readonly string[] };

// Un registro de la bitácora. El grupo no existe hasta que el primero lo crea.
export interface Comando {
  ejecutar(grupo: Grupo | undefined, desempate: Desempate): Grupo;
  alDeshacerse(aplicacion: Aplicacion): void;
  fecha(): Date;
  describir(): string;
  asistencia(): Asistencia | undefined;
  aJson(): ComandoJson;
}
