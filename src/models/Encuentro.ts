export class Encuentro {
  private _fecha: Date;
  private _asistentes: Set<string>;
  private _ausentes: Set<string>;

  constructor(fecha: Date, asistentes: Iterable<string>, ausentes: Iterable<string>) {
    const presentes = new Set(asistentes);
    const faltantes = new Set(ausentes);
    if (presentes.size === 0) throw new Error("Un encuentro debe tener al menos un asistente");
    const repetido = [...faltantes].find((nombre) => presentes.has(nombre));
    if (repetido !== undefined) throw new Error(`${repetido} no puede figurar a la vez como asistente y como ausente`);

    this._fecha = fecha;
    this._asistentes = presentes;
    this._ausentes = faltantes;
  }

  fecha(): Date {
    return this._fecha;
  }

  asistentes(): ReadonlySet<string> {
    return this._asistentes;
  }

  ausentes(): ReadonlySet<string> {
    return this._ausentes;
  }

  asistio(nombre: string): boolean {
    return this._asistentes.has(nombre);
  }
}
