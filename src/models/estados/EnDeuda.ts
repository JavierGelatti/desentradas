import type { Evento } from "../Evento.ts";
import type { Reglas } from "../Reglas.ts";
import { ConDeuda } from "./ConDeuda.ts";
import type { Estado, NombreDeEstado } from "./Estado.ts";
import { LibreDeDeuda } from "./LibreDeDeuda.ts";
import { Moroso } from "./Moroso.ts";

export class EnDeuda extends ConDeuda {
  nombre(): NombreDeEstado {
    return "en deuda";
  }

  override falto(evento: Evento, _reglas: Reglas): Estado {
    this._deuda.entrarEnMora(evento.fecha());
    return new Moroso(this._deuda);
  }

  override podriaAsistir(): boolean {
    return true;
  }

  protected _estadoAlSaldar(reglas: Reglas): Estado {
    return LibreDeDeuda.oFinalizadoPorFaltas(this.faltas(), reglas);
  }
}
