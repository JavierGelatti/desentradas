import type { ComandoJson } from "../json/ComandoJson.ts";
import { Evento } from "../../models/Evento.ts";
import type { Grupo } from "../../models/Grupo.ts";
import { fecha, type Objeto, textos } from "../json/Campos.ts";
import { ComandoSobreElGrupo } from "./ComandoSobreElGrupo.ts";

export class CerrarEvento extends ComandoSobreElGrupo {
  private _fecha: Date;
  private _asistentes: readonly string[];

  static desdeJson(campos: Objeto): CerrarEvento {
    return new CerrarEvento(fecha(campos, "fecha"), textos(campos, "asistentes"));
  }

  constructor(fecha: Date, asistentes: Iterable<string>) {
    super();
    this._fecha = fecha;
    this._asistentes = [...asistentes];
  }

  protected ejecutarEn(grupo: Grupo): void {
    grupo.registrarEvento(new Evento(this._fecha, this._asistentes));
  }

  fecha(): Date {
    return this._fecha;
  }

  asistentes(): readonly string[] {
    return this._asistentes;
  }

  aJson(): ComandoJson {
    return { tipo: "cerrar evento", fecha: this._fecha.toISOString(), asistentes: this._asistentes };
  }
}
