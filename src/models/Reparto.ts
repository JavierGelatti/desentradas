import type { Credito } from "./Credito.ts";

export class Reparto {
  private _fecha: Date;
  private _nombre: string;
  private _creditos: readonly Credito[];

  constructor(fecha: Date, nombre: string, creditos: readonly Credito[]) {
    this._fecha = fecha;
    this._nombre = nombre;
    this._creditos = creditos;
  }

  fecha(): Date {
    return this._fecha;
  }

  nombre(): string {
    return this._nombre;
  }

  creditos(): readonly Credito[] {
    return this._creditos;
  }

  monto(): number {
    return this._creditos.reduce((total, credito) => total + credito.monto(), 0);
  }
}
