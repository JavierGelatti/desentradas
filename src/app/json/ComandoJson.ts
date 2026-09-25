import type { Comando } from "../Comando.ts";
import { CrearGrupo } from "../comandos/CrearGrupo.ts";
import { Ingresar } from "../comandos/Ingresar.ts";
import { Reingresar } from "../comandos/Reingresar.ts";
import { CerrarEvento } from "../comandos/CerrarEvento.ts";
import { Cobrar } from "../comandos/Cobrar.ts";
import { Repartir } from "../comandos/Repartir.ts";
import { CambiarReglas } from "../comandos/CambiarReglas.ts";
import { formatoInvalido, objeto, texto } from "./Campos.ts";
import type { ReglasJson } from "./ReglasJson.ts";

export type ComandoJson =
  | { tipo: "crear grupo"; nombreDelGrupo: string; reglas: ReglasJson }
  | { tipo: "ingresar"; nombre: string; fecha: string }
  | { tipo: "reingresar"; nombre: string; fecha: string }
  | { tipo: "cerrar evento"; fecha: string; asistentes: readonly string[] }
  | { tipo: "cobrar"; nombre: string; monto: number; fecha: string }
  | { tipo: "repartir"; nombre: string; fecha: string }
  | { tipo: "cambiar reglas"; reglas: ReglasJson };

export const comandoDesdeJson = (json: unknown): Comando => {
  const campos = objeto(json, "El comando");
  const tipo = texto(campos, "tipo");
  switch (tipo) {
    case "crear grupo":
      return CrearGrupo.desdeJson(campos);
    case "ingresar":
      return Ingresar.desdeJson(campos);
    case "reingresar":
      return Reingresar.desdeJson(campos);
    case "cerrar evento":
      return CerrarEvento.desdeJson(campos);
    case "cobrar":
      return Cobrar.desdeJson(campos);
    case "repartir":
      return Repartir.desdeJson(campos);
    case "cambiar reglas":
      return CambiarReglas.desdeJson(campos);
    default:
      throw formatoInvalido(`comando desconocido "${tipo}"`);
  }
};
