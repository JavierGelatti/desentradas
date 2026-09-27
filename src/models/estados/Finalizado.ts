import type { Reglas } from "../Reglas.ts";
import { Estado, type NombreDeEstado } from "./Estado.ts";
import { Participando } from "./Participando.ts";

export class Finalizado extends Estado {
  nombre(): NombreDeEstado {
    return "finalizado";
  }

  override reingresar(reglas: Reglas): Estado {
    return new Participando(reglas);
  }

  override estaActivo(): boolean {
    return false;
  }
}
