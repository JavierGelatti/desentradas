export interface PoliticaDeInteres {
  montoConInteres(monto: number, desde: Date, hasta: Date): number;
  describir(formatearMonto: (monto: number) => string): string;
}

const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;
const DIAS_POR_MES = 30;

const diasCompletosEntre = (desde: Date, hasta: Date): number =>
  Math.floor((hasta.getTime() - desde.getTime()) / MILISEGUNDOS_POR_DIA);

export class SinInteres implements PoliticaDeInteres {
  montoConInteres(monto: number, _desde: Date, _hasta: Date): number {
    return monto;
  }

  describir(_formatearMonto: (monto: number) => string): string {
    return "sin interés";
  }
}

export class InteresFijoPorDia implements PoliticaDeInteres {
  private _montoPorDia: number;

  constructor(montoPorDia: number) {
    if (montoPorDia <= 0) throw new Error("El monto por día debe ser positivo");

    this._montoPorDia = montoPorDia;
  }

  montoPorDia(): number {
    return this._montoPorDia;
  }

  montoConInteres(monto: number, desde: Date, hasta: Date): number {
    return Math.round(monto + diasCompletosEntre(desde, hasta) * this._montoPorDia);
  }

  describir(formatearMonto: (monto: number) => string): string {
    return `${formatearMonto(this._montoPorDia)} por día de mora`;
  }
}

export class InteresMensual implements PoliticaDeInteres {
  private _porcentaje: number;

  constructor(porcentaje: number) {
    if (porcentaje <= 0) throw new Error("El porcentaje mensual debe ser positivo");

    this._porcentaje = porcentaje;
  }

  porcentaje(): number {
    return this._porcentaje;
  }

  montoConInteres(monto: number, desde: Date, hasta: Date): number {
    const interes = (monto * (this._porcentaje / 100) * diasCompletosEntre(desde, hasta)) / DIAS_POR_MES;
    return Math.round(monto + interes);
  }

  describir(_formatearMonto: (monto: number) => string): string {
    return `${this._porcentaje} % por mes de mora`;
  }
}
