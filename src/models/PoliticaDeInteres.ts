export interface PoliticaDeInteres {
  montoConInteres(monto: number, desde: Date, hasta: Date): number;
}

const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

const diasCompletosEntre = (desde: Date, hasta: Date): number =>
  Math.floor((hasta.getTime() - desde.getTime()) / MILISEGUNDOS_POR_DIA);

export class SinInteres implements PoliticaDeInteres {
  montoConInteres(monto: number, _desde: Date, _hasta: Date): number {
    return monto;
  }
}

export class InteresFijoPorDia implements PoliticaDeInteres {
  private _montoPorDia: number;

  constructor(montoPorDia: number) {
    this._montoPorDia = montoPorDia;
  }

  montoConInteres(monto: number, desde: Date, hasta: Date): number {
    return monto + diasCompletosEntre(desde, hasta) * this._montoPorDia;
  }
}

// Interés simple: un porcentaje mensual prorrateado por día sobre una base de 30 días.
export class InteresMensual implements PoliticaDeInteres {
  private _porcentaje: number;

  constructor(porcentaje: number) {
    this._porcentaje = porcentaje;
  }

  montoConInteres(monto: number, desde: Date, hasta: Date): number {
    const interes = (monto * (this._porcentaje / 100) * diasCompletosEntre(desde, hasta)) / 30;
    return Math.round(monto + interes);
  }
}
