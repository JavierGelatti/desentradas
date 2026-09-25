import { Deuda } from "./Deuda.ts";
import type { Evento } from "./Evento.ts";
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
    if (montoPorFalta <= 0) throw new Error("El monto por falta debe ser positivo");

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

  superaLaTolerancia(faltas: number): boolean {
    return faltas > this._toleranciaDeFaltas;
  }

  deudaPorFaltarA(evento: Evento): Deuda {
    return new Deuda(this._montoPorFalta, evento, this._politicaDeInteres);
  }
}
