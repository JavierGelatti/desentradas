import type { Encuentro } from "../Encuentro.ts";
import type { Reglas } from "../Reglas.ts";
import { Estado, type NombreDeEstado } from "./Estado.ts";
import { Finalizado } from "./Finalizado.ts";
import { Participando } from "./Participando.ts";

export class LibreDeDeuda extends Estado {
  private _faltas: number;

  constructor(faltas: number) {
    super();
    this._faltas = faltas;
  }

  nombre(): NombreDeEstado {
    return "libre de deuda";
  }

  override voy(): Estado {
    return new Participando();
  }

  override falto(_encuentro: Encuentro, reglas: Reglas): Estado {
    const faltas = this._faltas + 1;
    if (reglas.superaLaTolerancia(faltas)) return new Finalizado();

    return new LibreDeDeuda(faltas);
  }

  override puedeAsistir(): boolean {
    return true;
  }

  override faltas(): number {
    return this._faltas;
  }
}
