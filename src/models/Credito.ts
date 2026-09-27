export class Credito {
  private _acreedor: string;
  private _monto: number;

  static montoTotalDe(creditos: readonly Credito[]): number {
    return creditos.reduce((total, credito) => total + credito.monto(), 0);
  }

  constructor(acreedor: string, monto: number) {
    this._acreedor = acreedor;
    this._monto = monto;
  }

  acreedor(): string {
    return this._acreedor;
  }

  monto(): number {
    return this._monto;
  }
}
