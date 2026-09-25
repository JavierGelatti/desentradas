import type { Comando } from "../Comando.ts";
import type { ComandoJson } from "../json/ComandoJson.ts";
import type { Desempate } from "../../models/Desempate.ts";
import { Grupo } from "../../models/Grupo.ts";
import type { Reglas } from "../../models/Reglas.ts";
import { type Objeto, texto } from "../json/Campos.ts";
import { reglasAJson, reglasDesdeJson } from "../json/ReglasJson.ts";

export class CrearGrupo implements Comando {
  private _nombreDelGrupo: string;
  private _reglas: Reglas;

  static desdeJson(campos: Objeto): CrearGrupo {
    return new CrearGrupo(texto(campos, "nombreDelGrupo"), reglasDesdeJson(campos["reglas"]));
  }

  constructor(nombreDelGrupo: string, reglas: Reglas) {
    this._nombreDelGrupo = nombreDelGrupo;
    this._reglas = reglas;
  }

  ejecutar(grupo: Grupo | undefined, desempate: Desempate): Grupo {
    if (grupo !== undefined) throw new Error("El grupo ya fue creado");

    return new Grupo(this._nombreDelGrupo, this._reglas, desempate);
  }

  nombreDelGrupo(): string {
    return this._nombreDelGrupo;
  }

  reglas(): Reglas {
    return this._reglas;
  }

  fecha(): Date {
    return this._reglas.rigeDesde();
  }

  describir(): string {
    return `Creación del grupo "${this._nombreDelGrupo}"`;
  }

  aJson(): ComandoJson {
    return { tipo: "crear grupo", nombreDelGrupo: this._nombreDelGrupo, reglas: reglasAJson(this._reglas) };
  }
}
