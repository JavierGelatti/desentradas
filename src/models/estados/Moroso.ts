import type { Evento } from "../Evento.ts";
import type { Reglas } from "../Reglas.ts";
import { ConDeuda } from "./ConDeuda.ts";
import type { Estado, NombreDeEstado } from "./Estado.ts";
import { Finalizado } from "./Finalizado.ts";

export class Moroso extends ConDeuda {
  nombre(): NombreDeEstado {
    return "moroso";
  }

  override falto(_evento: Evento, _reglas: Reglas): Estado {
    return this;
  }

  protected _estadoAlSaldar(): Estado {
    return new Finalizado("por pago de morosidad");
  }
}
