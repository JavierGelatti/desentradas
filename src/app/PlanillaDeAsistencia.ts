import type { Almacenamiento } from "./Almacenamiento.ts";
import { objeto, textos } from "./json/Campos.ts";

export class PlanillaDeAsistencia {
  private _almacenamiento: Almacenamiento;
  private _asistentes: Set<string>;

  static guardadaEn(almacenamiento: Almacenamiento): PlanillaDeAsistencia | undefined {
    const texto = almacenamiento.leer();
    if (texto === undefined) return undefined;

    try {
      const campos = objeto(JSON.parse(texto), "La planilla de asistencia");
      return new PlanillaDeAsistencia(almacenamiento, textos(campos, "asistentes"));
    } catch {
      almacenamiento.borrar();
      return undefined;
    }
  }

  static nueva(almacenamiento: Almacenamiento, asistentes: Iterable<string>): PlanillaDeAsistencia {
    const planilla = new PlanillaDeAsistencia(almacenamiento, asistentes);
    planilla._guardar();
    return planilla;
  }

  private constructor(almacenamiento: Almacenamiento, asistentes: Iterable<string>) {
    this._almacenamiento = almacenamiento;
    this._asistentes = new Set(asistentes);
  }

  asistentes(): readonly string[] {
    return [...this._asistentes];
  }

  asiste(nombre: string): boolean {
    return this._asistentes.has(nombre);
  }

  marcarComoPresente(nombre: string): void {
    this._asistentes.add(nombre);
    this._guardar();
  }

  desmarcarComoPresente(nombre: string): void {
    this._asistentes.delete(nombre);
    this._guardar();
  }

  conservarSoloA(criterio: (nombre: string) => boolean): void {
    this._asistentes = new Set(this.asistentes().filter(criterio));
    this._guardar();
  }

  descartar(): void {
    this._almacenamiento.borrar();
  }

  private _guardar(): void {
    this._almacenamiento.guardar(JSON.stringify({ asistentes: this.asistentes() }));
  }
}
