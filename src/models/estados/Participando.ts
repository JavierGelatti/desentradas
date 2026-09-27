import type { Encuentro } from "../Encuentro.ts";
import type { Reglas } from "../Reglas.ts";
import { ConReglas } from "./ConReglas.ts";
import type { Estado, NombreDeEstado } from "./Estado.ts";
import { EnDeuda } from "./EnDeuda.ts";

export class Participando extends ConReglas {
  nombre(): NombreDeEstado {
    return "participando";
  }

  override voy(reglas: Reglas): Estado {
    return new Participando(reglas);
  }

  override falto(encuentro: Encuentro): Estado {
    return new EnDeuda(this.reglas().deudaPorFaltarA(encuentro), this.reglas());
  }

  override puedeAsistir(): boolean {
    return true;
  }

  override estaAlDia(): boolean {
    return true;
  }
}
