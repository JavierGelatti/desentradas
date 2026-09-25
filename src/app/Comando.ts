import type { Desempate } from "../models/Desempate.ts";
import type { Grupo } from "../models/Grupo.ts";
import type { ComandoJson } from "./json/ComandoJson.ts";

// Un registro de la bitácora: sabe ejecutarse sobre el grupo actual (que no existe hasta crearlo)
// y convertirse a JSON para volver a ejecutarse más adelante.
export interface Comando {
  ejecutar(grupo: Grupo | undefined, desempate: Desempate): Grupo;
  aJson(): ComandoJson;
}
