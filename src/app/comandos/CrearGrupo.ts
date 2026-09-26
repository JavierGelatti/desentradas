import type { Aplicacion } from "../Aplicacion.ts";
import type { Asistencia, Comando } from "../Comando.ts";
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

  alDeshacerse(aplicacion: Aplicacion): void {
    aplicacion.recordarCreacionDeshecha(this);
    aplicacion.descartarPlanillaDeAsistencia();
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
    return `Se creó el grupo "${this._nombreDelGrupo}"`;
  }

  asistencia(): Asistencia | undefined {
    return undefined;
  }

  aJson(): ComandoJson {
    return { tipo: "crear grupo", nombreDelGrupo: this._nombreDelGrupo, reglas: reglasAJson(this._reglas) };
  }
}
