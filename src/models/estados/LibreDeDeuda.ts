import type { Evento } from "../Evento.ts";
import type { Reglas } from "../Reglas.ts";
import { Estado, type NombreDeEstado } from "./Estado.ts";
import { Finalizado } from "./Finalizado.ts";
import { Participando } from "./Participando.ts";

export class LibreDeDeuda extends Estado {
  private _faltas: number;

  static oFinalizadoPorFaltas(faltas: number, reglas: Reglas): Estado {
    if (reglas.superaLaTolerancia(faltas)) return new Finalizado("por faltas");
    return new LibreDeDeuda(faltas);
  }

  private constructor(faltas: number) {
    super();
    this._faltas = faltas;
  }

  nombre(): NombreDeEstado {
    return "libre de deuda";
  }

  override voy(_evento: Evento, _reglas: Reglas): Estado {
    return new Participando();
  }

  override falto(_evento: Evento, reglas: Reglas): Estado {
    return LibreDeDeuda.oFinalizadoPorFaltas(this._faltas + 1, reglas);
  }

  override puedeAsistir(): boolean {
    return true;
  }

  override faltas(): number {
    return this._faltas;
  }
}
