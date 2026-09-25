import { Cobro, type OrigenDeCobro } from "../Cobro.ts";
import type { Evento } from "../Evento.ts";
import type { Reglas } from "../Reglas.ts";
import type { Deuda } from "../Deuda.ts";
import { Estado } from "./Estado.ts";

export abstract class ConDeuda extends Estado {
  protected _deuda: Deuda;

  constructor(deuda: Deuda) {
    super();
    this._deuda = deuda;
  }

  override pago(fecha: Date, monto: number, reglas: Reglas): Estado {
    this._deuda.pagar(fecha, monto);
    if (!this._deuda.estaSaldada()) return this;

    return this._estadoAlSaldar(reglas);
  }

  override cobroA(deudor: string, monto: number, fecha: Date, origen: OrigenDeCobro): Cobro {
    return new Cobro(deudor, monto, fecha, this._deuda.eventoFaltado(), origen);
  }

  override faltas(): number {
    return 1;
  }

  override deudaAl(fecha: Date): number {
    return this._deuda.montoAl(fecha);
  }

  override eventoAdeudado(): Evento {
    return this._deuda.eventoFaltado();
  }

  protected abstract _estadoAlSaldar(reglas: Reglas): Estado;
}
