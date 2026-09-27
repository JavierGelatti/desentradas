import { Estado, type NombreDeEstado } from "./Estado.ts";
import { Participando } from "./Participando.ts";

export class Finalizado extends Estado {
  nombre(): NombreDeEstado {
    return "finalizado";
  }

  override reingresar(): Estado {
    return new Participando();
  }

  override estaActivo(): boolean {
    return false;
  }
}
