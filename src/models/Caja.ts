import type { Cobro } from "./Cobro.ts";
import { Credito } from "./Credito.ts";
import type { Desempate } from "./Desempate.ts";
import type { Movimiento } from "./Movimiento.ts";
import { Reparto } from "./Reparto.ts";

export class Caja {
  private _desempate: Desempate;
  private _cobros: Cobro[];
  private _creditosPendientes: Credito[];
  private _repartos: Reparto[];

  constructor(desempate: Desempate) {
    this._desempate = desempate;
    this._cobros = [];
    this._creditosPendientes = [];
    this._repartos = [];
  }

  cobrar(cobro: Cobro): readonly Credito[] {
    const origen = cobro.origen();
    if (origen !== "efectivo") this._consumir(origen, cobro.monto());

    const creditos = this._distribuirEnCreditos(cobro);
    this._cobros.push(cobro);
    this._creditosPendientes.push(...creditos);
    return creditos;
  }

  repartir(nombre: string, fecha: Date): Reparto {
    const creditos = this.creditosPendientesDe(nombre);
    if (creditos.length === 0) throw new Error(`${nombre} no tiene créditos pendientes`);

    this._creditosPendientes = this._creditosPendientes.filter((credito) => credito.acreedor() !== nombre);
    const reparto = new Reparto(fecha, nombre, creditos);
    this._repartos.push(reparto);
    return reparto;
  }

  cobros(): readonly Cobro[] {
    return this._cobros;
  }

  repartos(): readonly Reparto[] {
    return this._repartos;
  }

  movimientos(): readonly Movimiento[] {
    const cobrosEnEfectivo = this._cobros.filter((cobro) => cobro.esEnEfectivo());
    return [...cobrosEnEfectivo, ...this._repartos].sort((uno, otro) => uno.fecha().getTime() - otro.fecha().getTime());
  }

  movimientoPosteriorA(fecha: Date): Movimiento | undefined {
    return this.movimientos().findLast((movimiento) => movimiento.fecha() > fecha);
  }

  creditosPendientesDe(nombre: string): readonly Credito[] {
    return this._creditosPendientes.filter((credito) => credito.acreedor() === nombre);
  }

  montoPendienteDe(nombre: string): number {
    return Credito.montoTotalDe(this.creditosPendientesDe(nombre));
  }

  totalPendiente(): number {
    return Credito.montoTotalDe(this._creditosPendientes);
  }

  nombresConCreditosPendientes(): string[] {
    return [...new Set(this._creditosPendientes.map((credito) => credito.acreedor()))];
  }

  private _distribuirEnCreditos(cobro: Cobro): Credito[] {
    const asistentes = this._desempate.ordenar(cobro.encuentroFaltado().asistentes(), cobro);
    const parte = Math.floor(cobro.monto() / asistentes.length);
    const sobrante = cobro.monto() % asistentes.length;
    return asistentes
      .map((nombre, posicion) => new Credito(nombre, parte + (posicion < sobrante ? 1 : 0)))
      .filter((credito) => credito.monto() > 0);
  }

  private _consumir(credito: Credito, monto: number): void {
    const posicion = this._creditosPendientes.indexOf(credito);
    if (posicion === -1) throw new Error("El crédito no está pendiente en esta caja");

    const resto = credito.monto() - monto;
    const restoPendiente = resto > 0 ? [new Credito(credito.acreedor(), resto)] : [];
    this._creditosPendientes.splice(posicion, 1, ...restoPendiente);
  }
}
