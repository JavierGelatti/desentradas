import type { Deuda } from "../Deuda.ts";
import type { Evento } from "../Evento.ts";
import { Estado } from "./Estado.ts";

export abstract class ConDeuda extends Estado {
  protected _deuda: Deuda;

  constructor(deuda: Deuda) {
    super();
    this._deuda = deuda;
  }

  override pago(fecha: Date, monto: number): Estado {
    this._deuda.pagar(fecha, monto);
    if (!this._deuda.estaSaldada()) return this;

    return this._estadoAlSaldar();
  }

  override eventoAdeudado(): Evento {
    return this._deuda.eventoFaltado();
  }

  override faltas(): number {
    return 1;
  }

  override deudaAl(fecha: Date): number {
    return this._deuda.montoAl(fecha);
  }

  protected abstract _estadoAlSaldar(): Estado;
}
