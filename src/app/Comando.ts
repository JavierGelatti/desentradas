import type { Desempate } from "../models/Desempate.ts";
import type { Grupo } from "../models/Grupo.ts";
import type { ComandoJson } from "./json/ComandoJson.ts";

// Un registro de la bitácora: sabe ejecutarse sobre el grupo actual (que no existe hasta crearlo),
// convertirse a JSON para volver a ejecutarse más adelante, y describirse para el historial.
export interface Comando {
  ejecutar(grupo: Grupo | undefined, desempate: Desempate): Grupo;
  fecha(): Date;
  describir(): string;
  aJson(): ComandoJson;
}
