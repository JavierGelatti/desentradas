import type { Evento } from "../Evento.ts";
import type { Reglas } from "../Reglas.ts";
import { Estado, type NombreDeEstado } from "./Estado.ts";
import { EnDeuda } from "./EnDeuda.ts";

export class Participando extends Estado {
  nombre(): NombreDeEstado {
    return "participando";
  }

  override voy(): Estado {
    return this;
  }

  override falto(evento: Evento, reglas: Reglas): Estado {
    return new EnDeuda(reglas.deudaPorFaltarA(evento));
  }

  override puedeAsistir(): boolean {
    return true;
  }

  override estaAlDia(): boolean {
    return true;
  }
}
