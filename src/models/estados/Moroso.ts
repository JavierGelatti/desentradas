import type { Evento } from "../Evento.ts";
import type { Reglas } from "../Reglas.ts";
import type { Deuda } from "../Deuda.ts";
import { Estado, type NombreDeEstado } from "./Estado.ts";
import { Finalizado } from "./Finalizado.ts";

export class Moroso extends Estado {
  private _deuda: Deuda;
  private _faltas: number;

  constructor(deudaEnMora: Deuda, faltas: number) {
    super();
    this._deuda = deudaEnMora;
    this._faltas = faltas;
  }

  nombre(): NombreDeEstado {
    return "moroso";
  }

  override falto(_evento: Evento, _reglas: Reglas): Estado {
    return this;
  }

  override pago(fecha: Date, monto: number, _reglas: Reglas): Estado {
    this._deuda.pagar(fecha, monto);
    if (!this._deuda.saldada()) return this;

    return new Finalizado("por pago de morosidad");
  }

  override faltas(): number {
    return this._faltas;
  }

  override deudaAl(fecha: Date): number {
    return this._deuda.montoAl(fecha);
  }

  override eventoAdeudado(): Evento {
    return this._deuda.eventoFaltado();
  }
}
