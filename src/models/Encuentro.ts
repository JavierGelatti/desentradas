export class Encuentro {
  private _fecha: Date;
  private _asistentes: Set<string>;

  constructor(fecha: Date, asistentes: Iterable<string>) {
    const nombres = new Set(asistentes);
    if (nombres.size === 0) throw new Error("Un encuentro debe tener al menos un asistente");

    this._fecha = fecha;
    this._asistentes = nombres;
  }

  fecha(): Date {
    return this._fecha;
  }

  asistentes(): ReadonlySet<string> {
    return this._asistentes;
  }

  asistio(nombre: string): boolean {
    return this._asistentes.has(nombre);
  }
}
