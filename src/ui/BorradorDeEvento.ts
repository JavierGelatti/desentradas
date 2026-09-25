import type { Almacenamiento } from "../app/Almacenamiento.ts";
import { fecha as leerFecha, objeto, textos } from "../app/json/Campos.ts";

// El evento que se está armando: su fecha y quiénes ya están marcados como asistentes.
// Se guarda después de cada cambio para sobrevivir a una recarga.
export class BorradorDeEvento {
  private _almacenamiento: Almacenamiento;
  private _fecha: Date | undefined;
  private _asistentes: Set<string>;

  constructor(almacenamiento: Almacenamiento) {
    this._almacenamiento = almacenamiento;
    this._fecha = undefined;
    this._asistentes = new Set();
    this._cargar();
  }

  existe(): boolean {
    return this._fecha !== undefined;
  }

  fecha(): Date {
    this._asertarQueExiste();

    return this._fecha!;
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
    this._asertarQueExiste();

    this._fecha = fecha;
    this._guardar();
  }

  marcar(nombre: string): void {
    this._asertarQueExiste();

    this._asistentes.add(nombre);
    this._guardar();
  }

  desmarcar(nombre: string): void {
    this._asertarQueExiste();

    this._asistentes.delete(nombre);
    this._guardar();
  }

  descartar(): void {
    this._fecha = undefined;
    this._asistentes = new Set();
    this._almacenamiento.borrar();
  }

  private _asertarQueExiste(): void {
    if (!this.existe()) throw new Error("No hay un borrador de evento");
  }

  private _guardar(): void {
    this._almacenamiento.guardar(JSON.stringify({ fecha: this._fecha!.toISOString(), asistentes: this.asistentes() }));
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
