export interface PoliticaDeInteres {
  montoConInteres(monto: number, desde: Date, hasta: Date): number;
}

export class SinInteres implements PoliticaDeInteres {
  montoConInteres(monto: number, _desde: Date, _hasta: Date): number {
    return monto;
  }
}
