import type { Credito } from "./Credito.ts";
import type { Encuentro } from "./Encuentro.ts";
import type { Movimiento, TipoDeMovimiento } from "./Movimiento.ts";

export type OrigenDeCobro = "efectivo" | Credito;

export class Cobro implements Movimiento {
  private _deudor: string;
  private _monto: number;
  private _fecha: Date;
  private _encuentroFaltado: Encuentro;
  private _origen: OrigenDeCobro;

  constructor(deudor: string, monto: number, fecha: Date, encuentroFaltado: Encuentro, origen: OrigenDeCobro) {
    if (monto <= 0) throw new Error("El monto del cobro debe ser positivo");
    if (origen !== "efectivo" && origen.acreedor() !== deudor) {
      throw new Error("Un crédito sólo se aplica a una deuda de su dueño");
    }
    if (origen !== "efectivo" && monto > origen.monto()) {
      throw new Error("Un cobro no puede tomar más de lo que tiene su crédito");
    }

    this._deudor = deudor;
    this._monto = monto;
    this._fecha = fecha;
    this._encuentroFaltado = encuentroFaltado;
    this._origen = origen;
  }

  deudor(): string {
    return this._deudor;
  }

  monto(): number {
    return this._monto;
  }

  tipo(): TipoDeMovimiento {
    return "cobro";
  }

  persona(): string {
    return this.deudor();
  }

  fecha(): Date {
    return this._fecha;
  }

  encuentroFaltado(): Encuentro {
    return this._encuentroFaltado;
  }

  origen(): OrigenDeCobro {
    return this._origen;
  }

  esEnEfectivo(): boolean {
    return this._origen === "efectivo";
  }
}
