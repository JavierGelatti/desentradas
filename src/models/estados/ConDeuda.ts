import type { Deuda } from "../Deuda.ts";
import type { Encuentro } from "../Encuentro.ts";
import type { Reglas } from "../Reglas.ts";
import { Estado } from "./Estado.ts";

export abstract class ConDeuda extends Estado {
  protected _deuda: Deuda;
  protected _reglas: Reglas;

  constructor(deuda: Deuda, reglas: Reglas) {
    super();
    this._deuda = deuda;
    this._reglas = reglas;
  }

  override reglas(): Reglas {
    return this._reglas;
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
