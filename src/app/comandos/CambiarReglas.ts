import type { ComandoJson } from "../json/ComandoJson.ts";
import type { Grupo } from "../../models/Grupo.ts";
import type { Reglas } from "../../models/Reglas.ts";
import type { Objeto } from "../json/Campos.ts";
import { reglasAJson, reglasDesdeJson } from "../json/ReglasJson.ts";
import { ComandoSobreElGrupo } from "./ComandoSobreElGrupo.ts";

export class CambiarReglas extends ComandoSobreElGrupo {
  private _reglas: Reglas;

  static desdeJson(campos: Objeto): CambiarReglas {
    return new CambiarReglas(reglasDesdeJson(campos["reglas"]));
  }

  constructor(reglas: Reglas) {
    super();
    this._reglas = reglas;
  }

  protected ejecutarEn(grupo: Grupo): void {
    grupo.cambiarReglas(this._reglas);
  }

  fecha(): Date {
    return this._reglas.rigeDesde();
  }

  describir(): string {
    return "Cambio de reglas";
  }

  aJson(): ComandoJson {
    return { tipo: "cambiar reglas", reglas: reglasAJson(this._reglas) };
  }
}
