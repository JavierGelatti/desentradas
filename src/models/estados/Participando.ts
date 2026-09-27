import type { Encuentro } from "../Encuentro.ts";
import type { Reglas } from "../Reglas.ts";
import { Estado, type NombreDeEstado } from "./Estado.ts";
import { EnDeuda } from "./EnDeuda.ts";

export class Participando extends Estado {
  private _reglas: Reglas;

  constructor(reglas: Reglas) {
    super();
    this._reglas = reglas;
  }

  nombre(): NombreDeEstado {
    return "participando";
  }

  override voy(reglas: Reglas): Estado {
    return new Participando(reglas);
  }

  override falto(encuentro: Encuentro): Estado {
    return new EnDeuda(this._reglas.deudaPorFaltarA(encuentro), this._reglas);
  }

  override reglas(): Reglas {
    return this._reglas;
  }

  override puedeAsistir(): boolean {
    return true;
  }

  override estaAlDia(): boolean {
    return true;
  }
}
