import type { PoliticaDeInteres } from "./PoliticaDeInteres.ts";

export class Reglas {
  private _rigeDesde: Date;
  private _toleranciaDeFaltas: number;
  private _montoPorFalta: number;
  private _politicaDeInteres: PoliticaDeInteres;

  constructor(
    rigeDesde: Date,
    toleranciaDeFaltas: number,
    montoPorFalta: number,
    politicaDeInteres: PoliticaDeInteres,
  ) {
    if (toleranciaDeFaltas < 1) throw new Error("La tolerancia de faltas debe ser al menos 1");

    this._rigeDesde = rigeDesde;
    this._toleranciaDeFaltas = toleranciaDeFaltas;
    this._montoPorFalta = montoPorFalta;
    this._politicaDeInteres = politicaDeInteres;
  }

  rigeDesde(): Date {
    return this._rigeDesde;
  }

  toleranciaDeFaltas(): number {
    return this._toleranciaDeFaltas;
  }

  montoPorFalta(): number {
    return this._montoPorFalta;
  }

  politicaDeInteres(): PoliticaDeInteres {
    return this._politicaDeInteres;
  }
}
