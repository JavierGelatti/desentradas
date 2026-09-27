import type { Deuda } from "../Deuda.ts";
import type { Encuentro } from "../Encuentro.ts";
import type { Reglas } from "../Reglas.ts";
import { ConReglas } from "./ConReglas.ts";
import type { Estado } from "./Estado.ts";

export abstract class ConDeuda extends ConReglas {
  protected _deuda: Deuda;

  constructor(deuda: Deuda, reglas: Reglas) {
    super(reglas);
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
