import type { Credito } from "./Credito.ts";

export class Reparto {
  private _fecha: Date;
  private _acreedor: string;
  private _creditos: readonly Credito[];

  constructor(fecha: Date, acreedor: string, creditos: readonly Credito[]) {
    this._fecha = fecha;
    this._acreedor = acreedor;
    this._creditos = creditos;
  }

  fecha(): Date {
    return this._fecha;
  }

  acreedor(): string {
    return this._acreedor;
  }

  creditos(): readonly Credito[] {
    return this._creditos;
  }

  monto(): number {
    return this._creditos.reduce((total, credito) => total + credito.monto(), 0);
  }
}
