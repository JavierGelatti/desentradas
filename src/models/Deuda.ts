import type { Encuentro } from "./Encuentro.ts";
import type { PoliticaDeInteres } from "./PoliticaDeInteres.ts";

export class Deuda {
  private _monto: number;
  private _encuentroFaltado: Encuentro;
  private _politicaDeInteres: PoliticaDeInteres;

  constructor(monto: number, encuentroFaltado: Encuentro, politicaDeInteres: PoliticaDeInteres) {
    this._monto = monto;
    this._encuentroFaltado = encuentroFaltado;
    this._politicaDeInteres = politicaDeInteres;
  }

  monto(): number {
    return this._monto;
  }

  encuentroFaltado(): Encuentro {
    return this._encuentroFaltado;
  }

  estaSaldada(): boolean {
    return this._monto === 0;
  }

  montoConInteres(desde: Date, hasta: Date): number {
    if (hasta < desde) return this._monto;

    return this._politicaDeInteres.montoConInteres(this._monto, desde, hasta);
  }

  pagar(fecha: Date, monto: number): void {
    this._pagarSobre(this._monto, fecha, monto);
  }

  pagarConInteres(desde: Date, fecha: Date, monto: number): void {
    this._pagarSobre(this.montoConInteres(desde, fecha), fecha, monto);
  }

  private _pagarSobre(montoALaFecha: number, fecha: Date, monto: number): void {
    if (monto <= 0) throw new Error("El monto del pago debe ser positivo");
    this._asertarQueNoEsAnteriorAlEncuentroFaltado(fecha);
    if (monto > montoALaFecha) throw new Error("El pago no puede superar la deuda");

    this._monto = montoALaFecha - monto;
  }

  private _asertarQueNoEsAnteriorAlEncuentroFaltado(fecha: Date): void {
    if (fecha < this._encuentroFaltado.fecha()) throw new Error("El cobro no puede ser anterior al encuentro faltado");
  }
}
