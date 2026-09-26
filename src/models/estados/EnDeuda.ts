import type { Encuentro } from "../Encuentro.ts";
import type { Reglas } from "../Reglas.ts";
import { ConDeuda } from "./ConDeuda.ts";
import type { Estado, NombreDeEstado } from "./Estado.ts";
import { LibreDeDeuda } from "./LibreDeDeuda.ts";
import { Moroso } from "./Moroso.ts";

export class EnDeuda extends ConDeuda {
  nombre(): NombreDeEstado {
    return "en deuda";
  }

  override falto(encuentro: Encuentro, _reglas: Reglas): Estado {
    this._deuda.entrarEnMora(encuentro.fecha());
    return new Moroso(this._deuda);
  }

  override soloLeFaltaPagarParaAsistir(): boolean {
    return true;
  }

  protected _estadoAlSaldar(): Estado {
    return new LibreDeDeuda(this.faltas());
  }
}
