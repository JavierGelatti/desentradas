import type { Reglas } from "../Reglas.ts";
import { Estado, type NombreDeEstado } from "./Estado.ts";
import { Finalizado } from "./Finalizado.ts";
import { Participando } from "./Participando.ts";

export class LibreDeDeuda extends Estado {
  private _faltas: number;
  private _reglas: Reglas;

  constructor(faltas: number, reglas: Reglas) {
    super();
    this._faltas = faltas;
    this._reglas = reglas;
  }

  nombre(): NombreDeEstado {
    return "libre de deuda";
  }

  override voy(reglas: Reglas): Estado {
    return new Participando(reglas);
  }

  override falto(): Estado {
    const faltas = this._faltas + 1;
    if (this._reglas.superaLaTolerancia(faltas)) return new Finalizado();

    return new LibreDeDeuda(faltas, this._reglas);
  }

  override reglas(): Reglas {
    return this._reglas;
  }

  override puedeAsistir(): boolean {
    return true;
  }

  override faltas(): number {
    return this._faltas;
  }
}
