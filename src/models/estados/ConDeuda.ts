import type { Deuda } from "../Deuda.ts";
import type { Encuentro } from "../Encuentro.ts";
import { Estado } from "./Estado.ts";

export abstract class ConDeuda extends Estado {
  protected _deuda: Deuda;

  constructor(deuda: Deuda) {
    super();
    this._deuda = deuda;
  }

  override pago(fecha: Date, monto: number): Estado {
    this._pagar(fecha, monto);
    if (!this._deuda.estaSaldada()) return this;

    return this._estadoAlSaldar();
  }

  override encuentroAdeudado(): Encuentro {
    return this._deuda.encuentroFaltado();
  }

  override faltas(): number {
    return 1;
  }

  protected abstract _pagar(fecha: Date, monto: number): void;

  protected abstract _estadoAlSaldar(): Estado;
}
