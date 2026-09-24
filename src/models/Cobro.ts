import type { Credito } from "./Credito.ts";
import type { Evento } from "./Evento.ts";

// Un cobro es en efectivo o proviene de aplicar un crédito del propio deudor.
export type OrigenDeCobro = "efectivo" | Credito;

export class Cobro {
  private _deudor: string;
  private _monto: number;
  private _fecha: Date;
  private _eventoFaltado: Evento;
  private _origen: OrigenDeCobro;

  constructor(deudor: string, monto: number, fecha: Date, eventoFaltado: Evento, origen: OrigenDeCobro) {
    if (monto <= 0) throw new Error("El monto del cobro debe ser positivo");
    if (origen !== "efectivo" && origen.nombre() !== deudor) {
      throw new Error("Un crédito sólo se aplica a una deuda de su dueño");
    }

    this._deudor = deudor;
    this._monto = monto;
    this._fecha = fecha;
    this._eventoFaltado = eventoFaltado;
    this._origen = origen;
  }

  deudor(): string {
    return this._deudor;
  }

  monto(): number {
    return this._monto;
  }

  fecha(): Date {
    return this._fecha;
  }

  eventoFaltado(): Evento {
    return this._eventoFaltado;
  }

  origen(): OrigenDeCobro {
    return this._origen;
  }

  esEnEfectivo(): boolean {
    return this._origen === "efectivo";
  }
}
