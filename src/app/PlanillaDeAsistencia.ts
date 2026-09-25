import type { Almacenamiento } from "./Almacenamiento.ts";
import { fecha as leerFecha, objeto, textos } from "./json/Campos.ts";

export class PlanillaDeAsistencia {
  private _almacenamiento: Almacenamiento;
  private _ahora: () => Date;
  private _fecha: Date | undefined;
  private _asistentes: Set<string>;

  constructor(almacenamiento: Almacenamiento, ahora: () => Date) {
    this._almacenamiento = almacenamiento;
    this._ahora = ahora;
    this._fecha = undefined;
    this._asistentes = new Set();
    this._cargar();
  }

  existe(): boolean {
    return this._fecha !== undefined;
  }

  fecha(): Date {
    return this._fecha ?? this._ahora();
  }

  asistentes(): readonly string[] {
    return [...this._asistentes];
  }

  asiste(nombre: string): boolean {
    return this._asistentes.has(nombre);
  }

  restaurar(fecha: Date, asistentes: Iterable<string>): void {
    this._fecha = fecha;
    this._asistentes = new Set(asistentes);
    this._guardar();
  }

  cambiarFecha(fecha: Date): void {
    this._fecha = fecha;
    this._guardar();
  }

  marcarComoPresente(nombre: string): void {
    this._empezarSiHaceFalta();
    this._asistentes.add(nombre);
    this._guardar();
  }

  desmarcarComoPresente(nombre: string): void {
    this._empezarSiHaceFalta();
    this._asistentes.delete(nombre);
    this._guardar();
  }

  descartar(): void {
    this._fecha = undefined;
    this._asistentes = new Set();
    this._almacenamiento.borrar();
  }

  private _empezarSiHaceFalta(): void {
    if (!this.existe()) this._fecha = this._ahora();
  }

  private _guardar(): void {
    this._almacenamiento.guardar(JSON.stringify({ fecha: this.fecha().toISOString(), asistentes: this.asistentes() }));
  }

  private _cargar(): void {
    const texto = this._almacenamiento.leer();
    if (texto === undefined) return;

    try {
      const campos = objeto(JSON.parse(texto), "La planilla de asistencia");
      this._fecha = leerFecha(campos, "fecha");
      this._asistentes = new Set(textos(campos, "asistentes"));
    } catch {
      this._almacenamiento.borrar();
    }
  }
}
