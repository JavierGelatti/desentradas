import type { Aplicacion } from "../Aplicacion.ts";
import type { Asistencia } from "../Comando.ts";
import type { ComandoJson } from "../json/ComandoJson.ts";
import { Evento } from "../../models/Evento.ts";
import type { Grupo } from "../../models/Grupo.ts";
import { fecha, type Objeto, textos, textosOpcionales } from "../json/Campos.ts";
import { ComandoSobreElGrupo } from "./ComandoSobreElGrupo.ts";

export class CerrarEvento extends ComandoSobreElGrupo {
  private _fecha: Date;
  private _asistentes: readonly string[];
  private _ausentes: readonly string[] | undefined;

  static desdeJson(campos: Objeto): CerrarEvento {
    return new CerrarEvento(fecha(campos, "fecha"), textos(campos, "asistentes"), textosOpcionales(campos, "ausentes"));
  }

  constructor(fecha: Date, asistentes: Iterable<string>, ausentes: Iterable<string> | undefined) {
    super();
    this._fecha = fecha;
    this._asistentes = [...asistentes];
    this._ausentes = ausentes === undefined ? undefined : [...ausentes];
  }

  protected ejecutarEn(grupo: Grupo): void {
    grupo.cerrarEvento(new Evento(this._fecha, this._asistentes));
  }

  fecha(): Date {
    return this._fecha;
  }

  ausentes(): readonly string[] | undefined {
    return this._ausentes;
  }

  alDeshacerse(aplicacion: Aplicacion): void {
    aplicacion.planillaDeAsistencia().restaurar(this._fecha, this._asistentes);
  }

  describir(): string {
    const presentes = this._asistentes.length;
    if (this._ausentes === undefined) return presentes === 1 ? "1 presente" : `${presentes} presentes`;

    return `${presentes}/${presentes + this._ausentes.length} presentes`;
  }

  // Un cierre guardado antes de recordar a los ausentes no los conoce.
  asistencia(): Asistencia {
    return { presentes: this._asistentes, ausentes: this._ausentes ?? [] };
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
