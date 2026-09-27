import type { Encuentro } from "../Encuentro.ts";
import type { Reglas } from "../Reglas.ts";
import { ConDeuda } from "./ConDeuda.ts";
import type { Estado, NombreDeEstado } from "./Estado.ts";
import { LibreDeDeuda } from "./LibreDeDeuda.ts";
import { Moroso } from "./Moroso.ts";

export class EnDeuda extends ConDeuda {
  nombre(): NombreDeEstado {
    return "en deuda";
  }

  override falto(encuentro: Encuentro, _reglas: Reglas): Estado {
    return new Moroso(this._deuda, encuentro.fecha());
  }

  override soloLeFaltaPagarParaAsistir(): boolean {
    return true;
  }

  override deudaAl(_fecha: Date): number {
    return this._deuda.monto();
  }

  protected _pagar(fecha: Date, monto: number): void {
    this._deuda.pagar(fecha, monto);
  }

  protected _estadoAlSaldar(): Estado {
    return new LibreDeDeuda(this.faltas());
  }
}
