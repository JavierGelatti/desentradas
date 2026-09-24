import type { Cobro } from "./Cobro.ts";

export type EstadoDeCredito = "cobrado" | "aplicado" | "repartido";

export class Credito {
  private _nombre: string;
  private _monto: number;
  private _cobro: Cobro;
  private _estado: EstadoDeCredito;

  constructor(nombre: string, monto: number, cobro: Cobro) {
    this._nombre = nombre;
    this._monto = monto;
    this._cobro = cobro;
    this._estado = "cobrado";
  }

  nombre(): string {
    return this._nombre;
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
    return this._estado === "cobrado";
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

    return [new Credito(this._nombre, monto, this._cobro), new Credito(this._nombre, this._monto - monto, this._cobro)];
  }

  private _asertarQueEstaPendiente(): void {
    if (!this.estaPendiente()) throw new Error("El crédito ya no está pendiente");
  }
}
