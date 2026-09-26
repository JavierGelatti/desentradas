import type { Encuentro } from "./Encuentro.ts";
import type { PoliticaDeInteres } from "./PoliticaDeInteres.ts";

export class Deuda {
  private _monto: number;
  private _encuentroFaltado: Encuentro;
  private _politicaDeInteres: PoliticaDeInteres;
  private _enMoraDesde: Date | undefined;
  private _ultimoPago: Date | undefined;

  constructor(monto: number, encuentroFaltado: Encuentro, politicaDeInteres: PoliticaDeInteres) {
    this._monto = monto;
    this._encuentroFaltado = encuentroFaltado;
    this._politicaDeInteres = politicaDeInteres;
    this._enMoraDesde = undefined;
    this._ultimoPago = undefined;
  }

  monto(): number {
    return this._monto;
  }

  encuentroFaltado(): Encuentro {
    return this._encuentroFaltado;
  }

  estaEnMora(): boolean {
    return this._enMoraDesde !== undefined;
  }

  estaSaldada(): boolean {
    return this._monto === 0;
  }

  entrarEnMora(fecha: Date): void {
    if (this.estaEnMora()) throw new Error("La deuda ya está en mora");

    this._enMoraDesde = fecha;
  }

  montoAl(fecha: Date): number {
    if (this.estaSaldada() || this._enMoraDesde === undefined || fecha < this._enMoraDesde) return this._monto;

    return this._politicaDeInteres.montoConInteres(this._monto, this._enMoraDesde, fecha);
  }

  // El interés devengado se capitaliza y, en mora, vuelve a correr desde el pago.
  pagar(fecha: Date, monto: number): void {
    if (monto <= 0) throw new Error("El monto del pago debe ser positivo");
    this._asertarQueNoEsAnteriorAlEncuentroFaltado(fecha);
    this._asertarQueNoEsAnteriorAlUltimoPago(fecha);
    const montoALaFecha = this.montoAl(fecha);
    if (monto > montoALaFecha) throw new Error("El pago no puede superar la deuda");

    this._monto = montoALaFecha - monto;
    if (this.estaEnMora()) this._enMoraDesde = fecha;
    this._ultimoPago = fecha;
  }

  private _asertarQueNoEsAnteriorAlEncuentroFaltado(fecha: Date): void {
    if (fecha < this._encuentroFaltado.fecha()) throw new Error("El cobro no puede ser anterior al encuentro faltado");
  }

  private _asertarQueNoEsAnteriorAlUltimoPago(fecha: Date): void {
    if (this._ultimoPago !== undefined && fecha < this._ultimoPago) {
      throw new Error("El pago no puede ser anterior al último pago");
    }
  }
}
