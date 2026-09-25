import type { Almacenamiento } from "./Almacenamiento.ts";
import { fecha as leerFecha, objeto, textos } from "./json/Campos.ts";

// El evento que se está armando: su fecha y quiénes ya están marcados como asistentes.
// Mientras no empezó, la fecha es la de ahora. Se guarda después de cada cambio para sobrevivir a una recarga.
export class BorradorDeEvento {
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

  marcar(nombre: string): void {
    this._empezarSiHaceFalta();
    this._asistentes.add(nombre);
    this._guardar();
  }

  desmarcar(nombre: string): void {
    this._empezarSiHaceFalta();
    this._asistentes.delete(nombre);
    this._guardar();
  }

  descartar(): void {
    this._fecha = undefined;
    this._asistentes = new Set();
    this._almacenamiento.borrar();
  }

  // El primer cambio empieza el borrador con la fecha que venía mostrando.
  private _empezarSiHaceFalta(): void {
    if (!this.existe()) this._fecha = this._ahora();
  }

  private _guardar(): void {
    this._almacenamiento.guardar(JSON.stringify({ fecha: this.fecha().toISOString(), asistentes: this.asistentes() }));
  }

  // Un borrador guardado que no se puede leer se ignora: no vale la pena avisar por algo que se rehace en minutos.
  private _cargar(): void {
    const texto = this._almacenamiento.leer();
    if (texto === undefined) return;

    try {
      const campos = objeto(JSON.parse(texto), "El borrador");
      this._fecha = leerFecha(campos, "fecha");
      this._asistentes = new Set(textos(campos, "asistentes"));
    } catch {
      this._almacenamiento.borrar();
    }
  }
}
