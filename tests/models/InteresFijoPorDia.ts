import type { PoliticaDeInteres } from "../../src/models/PoliticaDeInteres.ts";

const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

export class InteresFijoPorDia implements PoliticaDeInteres {
  private _montoPorDia: number;

  constructor(montoPorDia: number) {
    this._montoPorDia = montoPorDia;
  }

  montoConInteres(monto: number, desde: Date, hasta: Date): number {
    const dias = Math.floor((hasta.getTime() - desde.getTime()) / MILISEGUNDOS_POR_DIA);
    return monto + dias * this._montoPorDia;
  }
}
