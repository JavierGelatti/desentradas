import type { Almacenamiento } from "./Almacenamiento.ts";
import { objeto, textos } from "./json/Campos.ts";

export class PlanillaDeAsistencia {
  private _almacenamiento: Almacenamiento;
  private _empezada: boolean;
  private _asistentes: Set<string>;

  constructor(almacenamiento: Almacenamiento) {
    this._almacenamiento = almacenamiento;
    this._empezada = false;
    this._asistentes = new Set();
    this._cargar();
  }

  existe(): boolean {
    return this._empezada;
  }

  asistentes(): readonly string[] {
    return [...this._asistentes];
  }

  asiste(nombre: string): boolean {
    return this._asistentes.has(nombre);
  }

  empezar(): void {
    if (this.existe()) throw new Error("Ya hay una planilla de asistencia empezada");

    this.restaurar([]);
  }

  restaurar(asistentes: Iterable<string>): void {
    this._empezada = true;
    this._asistentes = new Set(asistentes);
    this._guardar();
  }

  marcarComoPresente(nombre: string): void {
    this._asertarQueEstaEmpezada();

    this._asistentes.add(nombre);
    this._guardar();
  }

  desmarcarComoPresente(nombre: string): void {
    this._asertarQueEstaEmpezada();

    this._asistentes.delete(nombre);
    this._guardar();
  }

  descartar(): void {
    this._empezada = false;
    this._asistentes = new Set();
    this._almacenamiento.borrar();
  }

  private _asertarQueEstaEmpezada(): void {
    if (!this.existe()) throw new Error("No hay una planilla de asistencia empezada");
  }

  private _guardar(): void {
    this._almacenamiento.guardar(JSON.stringify({ asistentes: this.asistentes() }));
  }

  // Una planilla guardada por una versión anterior también tiene su fecha, que ya no se usa.
  private _cargar(): void {
    const texto = this._almacenamiento.leer();
    if (texto === undefined) return;

    try {
      const campos = objeto(JSON.parse(texto), "La planilla de asistencia");
      this._asistentes = new Set(textos(campos, "asistentes"));
      this._empezada = true;
    } catch {
      this._almacenamiento.borrar();
    }
  }
}
