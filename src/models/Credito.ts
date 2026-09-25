import type { Cobro } from "./Cobro.ts";

export type EstadoDeCredito = "pendiente" | "aplicado" | "repartido";

export class Credito {
  private _acreedor: string;
  private _monto: number;
  private _cobro: Cobro;
  private _estado: EstadoDeCredito;

  constructor(acreedor: string, monto: number, cobro: Cobro) {
    this._acreedor = acreedor;
    this._monto = monto;
    this._cobro = cobro;
    this._estado = "pendiente";
  }

  acreedor(): string {
    return this._acreedor;
  }

  monto(): number {
    return this._monto;
  }

  cobro(): Cobro {
    return this._cobro;
  }

  estado(): EstadoDeCredito {
    return this._estado;
  }

  estaPendiente(): boolean {
    return this._estado === "pendiente";
  }

  aplicar(): void {
    this._asertarQueEstaPendiente();

    this._estado = "aplicado";
  }

  repartir(): void {
    this._asertarQueEstaPendiente();

    this._estado = "repartido";
  }

  dividir(monto: number): [Credito, Credito] {
    if (monto <= 0 || monto >= this._monto) throw new Error("El monto debe ser positivo y menor al del crédito");

    return [
      new Credito(this._acreedor, monto, this._cobro),
      new Credito(this._acreedor, this._monto - monto, this._cobro),
    ];
  }

  private _asertarQueEstaPendiente(): void {
    if (!this.estaPendiente()) throw new Error("El crédito ya no está pendiente");
  }
}
