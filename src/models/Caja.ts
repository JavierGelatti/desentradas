import type { Cobro } from "./Cobro.ts";
import { Credito } from "./Credito.ts";
import type { Desempate } from "./Desempate.ts";
import type { Movimiento } from "./Movimiento.ts";
import { Reparto } from "./Reparto.ts";

export class Caja {
  private _desempate: Desempate;
  private _cobros: Cobro[];
  private _creditos: Credito[];
  private _repartos: Reparto[];

  constructor(desempate: Desempate) {
    this._desempate = desempate;
    this._cobros = [];
    this._creditos = [];
    this._repartos = [];
  }

  cobrar(cobro: Cobro): readonly Credito[] {
    const creditos = this._distribuirEnCreditos(cobro);
    this._cobros.push(cobro);
    this._creditos.push(...creditos);
    return creditos;
  }

  aplicar(credito: Credito, monto: number): Credito {
    if (!this._creditos.includes(credito)) throw new Error("El crédito no es de esta caja");
    if (monto > credito.monto()) throw new Error("El monto a aplicar no puede superar el del crédito");

    const aplicado = monto === credito.monto() ? credito : this._separarParteDe(credito, monto);
    aplicado.aplicar();
    return aplicado;
  }

  repartir(nombre: string, fecha: Date): Reparto {
    const creditos = this.creditosPendientesDe(nombre);
    if (creditos.length === 0) throw new Error(`${nombre} no tiene créditos pendientes`);

    creditos.forEach((credito) => credito.repartir());
    const reparto = new Reparto(fecha, nombre, creditos);
    this._repartos.push(reparto);
    return reparto;
  }

  cobros(): readonly Cobro[] {
    return this._cobros;
  }

  huboCobrosDespuesDe(fecha: Date): boolean {
    return this._cobros.some((cobro) => cobro.fecha() > fecha);
  }

  huboRepartosDespuesDe(fecha: Date): boolean {
    return this._repartos.some((reparto) => reparto.fecha() > fecha);
  }

  creditos(): readonly Credito[] {
    return this._creditos;
  }

  repartos(): readonly Reparto[] {
    return this._repartos;
  }

  // Un cobro hecho con un crédito no mueve plata: no entra ni sale de la caja.
  movimientos(): readonly Movimiento[] {
    const cobrosEnEfectivo = this._cobros.filter((cobro) => cobro.esEnEfectivo());
    return [...cobrosEnEfectivo, ...this._repartos].toSorted(
      (uno, otro) => uno.fecha().getTime() - otro.fecha().getTime(),
    );
  }

  creditosPendientesDe(nombre: string): readonly Credito[] {
    return this._creditosPendientes().filter((credito) => credito.acreedor() === nombre);
  }

  montoPendienteDe(nombre: string): number {
    return this._sumar(this.creditosPendientesDe(nombre));
  }

  totalPendiente(): number {
    return this._sumar(this._creditosPendientes());
  }

  nombresConCreditosPendientes(): string[] {
    return [...new Set(this._creditosPendientes().map((credito) => credito.acreedor()))];
  }

  private _distribuirEnCreditos(cobro: Cobro): Credito[] {
    const asistentes = this._desempate.ordenar([...cobro.eventoFaltado().asistentes()], cobro);
    const parte = Math.floor(cobro.monto() / asistentes.length);
    const sobrante = cobro.monto() % asistentes.length;
    return asistentes
      .map((nombre, posicion) => new Credito(nombre, parte + (posicion < sobrante ? 1 : 0), cobro))
      .filter((credito) => credito.monto() > 0);
  }

  private _separarParteDe(credito: Credito, monto: number): Credito {
    const partes = credito.dividir(monto);
    this._creditos.splice(this._creditos.indexOf(credito), 1, ...partes);
    return partes[0];
  }

  private _creditosPendientes(): Credito[] {
    return this._creditos.filter((credito) => credito.estaPendiente());
  }

  private _sumar(creditos: readonly Credito[]): number {
    return creditos.reduce((total, credito) => total + credito.monto(), 0);
  }
}
