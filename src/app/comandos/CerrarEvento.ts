import type { Aplicacion } from "../Aplicacion.ts";
import type { Asistencia } from "../Comando.ts";
import type { ComandoJson } from "../json/ComandoJson.ts";
import { Evento } from "../../models/Evento.ts";
import type { Grupo } from "../../models/Grupo.ts";
import { fecha, type Objeto, textos } from "../json/Campos.ts";
import { ComandoSobreElGrupo } from "./ComandoSobreElGrupo.ts";

export class CerrarEvento extends ComandoSobreElGrupo {
  private _fecha: Date;
  private _asistentes: readonly string[];
  private _ausentes: readonly string[];

  static desdeJson(campos: Objeto): CerrarEvento {
    return new CerrarEvento(fecha(campos, "fecha"), textos(campos, "asistentes"), textos(campos, "ausentes"));
  }

  constructor(fecha: Date, asistentes: Iterable<string>, ausentes: Iterable<string>) {
    super();
    this._fecha = fecha;
    this._asistentes = [...asistentes];
    this._ausentes = [...ausentes];
  }

  protected ejecutarEn(grupo: Grupo): void {
    grupo.cerrarEvento(new Evento(this._fecha, this._asistentes));
  }

  fecha(): Date {
    return this._fecha;
  }

  ausentes(): readonly string[] {
    return this._ausentes;
  }

  alDeshacerse(aplicacion: Aplicacion): void {
    aplicacion.restaurarPlanillaDeAsistencia(this._asistentes);
  }

  describir(): string {
    const presentes = this._asistentes.length;
    return `${presentes}/${presentes + this._ausentes.length} presentes`;
  }

  asistencia(): Asistencia {
    return { presentes: this._asistentes, ausentes: this._ausentes };
  }

  aJson(): ComandoJson {
    return {
      tipo: "cerrar evento",
      fecha: this._fecha.toISOString(),
      asistentes: this._asistentes,
      ausentes: this._ausentes,
    };
  }
}
