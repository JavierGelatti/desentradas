import type { Deuda } from "../Deuda.ts";
import type { Reglas } from "../Reglas.ts";
import { ConDeuda } from "./ConDeuda.ts";
import type { Estado, NombreDeEstado } from "./Estado.ts";
import { Finalizado } from "./Finalizado.ts";

export class Moroso extends ConDeuda {
  private _devengaInteresDesde: Date;

  constructor(deuda: Deuda, devengaInteresDesde: Date, reglas: Reglas) {
    super(deuda, reglas);
    this._devengaInteresDesde = devengaInteresDesde;
  }

  nombre(): NombreDeEstado {
    return "moroso";
  }

  override soloLeFaltaPagarParaReingresar(): boolean {
    return true;
  }

  override deudaAl(fecha: Date): number {
    return this._deuda.montoConInteres(this._devengaInteresDesde, fecha);
  }

  protected _pagar(fecha: Date, monto: number): void {
    this._deuda.pagarConInteres(this._devengaInteresDesde, fecha, monto);
    this._devengaInteresDesde = fecha;
  }

  protected _estadoAlSaldar(): Estado {
    return new Finalizado();
  }
}
