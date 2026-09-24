import type { Evento } from "./Evento.ts";
import type { PoliticaDeInteres } from "./PoliticaDeInteres.ts";
import type { Reglas } from "./Reglas.ts";

export class Deuda {
  private _monto: number;
  private _eventoFaltado: Evento;
  private _politicaDeInteres: PoliticaDeInteres;
  private _enMoraDesde: Date | undefined;
  private _ultimoPago: Date | undefined;

  static porFaltarA(evento: Evento, reglas: Reglas): Deuda {
    return new Deuda(reglas.montoPorFalta(), evento, reglas.politicaDeInteres());
  }

  private constructor(monto: number, eventoFaltado: Evento, politicaDeInteres: PoliticaDeInteres) {
    this._monto = monto;
    this._eventoFaltado = eventoFaltado;
    this._politicaDeInteres = politicaDeInteres;
    this._enMoraDesde = undefined;
    this._ultimoPago = undefined;
  }

  monto(): number {
    return this._monto;
  }

  eventoFaltado(): Evento {
    return this._eventoFaltado;
  }

  estaEnMora(): boolean {
    return this._enMoraDesde !== undefined;
  }

  saldada(): boolean {
    return this._monto === 0;
  }

  entrarEnMora(fecha: Date): void {
    if (this.estaEnMora()) throw new Error("La deuda ya está en mora");

    this._enMoraDesde = fecha;
  }

  montoAl(fecha: Date): number {
    if (this.saldada() || this._enMoraDesde === undefined) return this._monto;

    return this._politicaDeInteres.montoConInteres(this._monto, this._enMoraDesde, fecha);
  }

  // El pago se descuenta del valor de la deuda a esa fecha; el resto pasa a ser la nueva base,
  // y si está en mora el interés vuelve a correr desde el pago.
  pagar(fecha: Date, monto: number): void {
    if (monto <= 0) throw new Error("El monto del pago debe ser positivo");
    if (this._ultimoPago !== undefined && fecha < this._ultimoPago) {
      throw new Error("El pago no puede ser anterior al último pago");
    }
    if (monto > this.montoAl(fecha)) throw new Error("El pago no puede superar la deuda");

    this._monto = this.montoAl(fecha) - monto;
    if (this.estaEnMora()) this._enMoraDesde = fecha;
    this._ultimoPago = fecha;
  }
}
