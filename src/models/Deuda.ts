import type { Evento } from "./Evento.ts";
import type { PoliticaDeInteres } from "./PoliticaDeInteres.ts";
import type { Reglas } from "./Reglas.ts";

export class Deuda {
  private _monto: number;
  private _eventoFaltado: Evento;
  private _politicaDeInteres: PoliticaDeInteres;
  private _enMoraDesde: Date | undefined;

  static porFaltarA(evento: Evento, reglas: Reglas): Deuda {
    return new Deuda(reglas.montoPorFalta(), evento, reglas.politicaDeInteres());
  }

  private constructor(monto: number, eventoFaltado: Evento, politicaDeInteres: PoliticaDeInteres) {
    this._monto = monto;
    this._eventoFaltado = eventoFaltado;
    this._politicaDeInteres = politicaDeInteres;
    this._enMoraDesde = undefined;
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

  entrarEnMora(fecha: Date): void {
    if (this.estaEnMora()) throw new Error("La deuda ya está en mora");

    this._enMoraDesde = fecha;
  }

  montoAl(fecha: Date): number {
    if (this._enMoraDesde === undefined) return this._monto;

    return this._politicaDeInteres.montoConInteres(this._monto, this._enMoraDesde, fecha);
  }
}
