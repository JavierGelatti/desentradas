import type { Reglas } from "../Reglas.ts";
import { ConReglas } from "./ConReglas.ts";
import type { Estado, NombreDeEstado } from "./Estado.ts";
import { Finalizado } from "./Finalizado.ts";
import { Participando } from "./Participando.ts";

export class LibreDeDeuda extends ConReglas {
  private _faltas: number;

  constructor(faltas: number, reglas: Reglas) {
    super(reglas);
    this._faltas = faltas;
  }

  nombre(): NombreDeEstado {
    return "libre de deuda";
  }

  override voy(reglas: Reglas): Estado {
    return new Participando(reglas);
  }

  override falto(): Estado {
    const faltas = this._faltas + 1;
    if (this.reglas().superaLaTolerancia(faltas)) return new Finalizado();

    return new LibreDeDeuda(faltas, this.reglas());
  }

  override puedeAsistir(): boolean {
    return true;
  }

  override faltas(): number {
    return this._faltas;
  }
}
