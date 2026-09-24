import type { Evento } from "../Evento.ts";
import type { Reglas } from "../Reglas.ts";
import type { Deuda } from "../Deuda.ts";
import { Estado, type NombreDeEstado } from "./Estado.ts";
import { LibreDeDeuda } from "./LibreDeDeuda.ts";
import { Moroso } from "./Moroso.ts";

export class EnDeuda extends Estado {
  private _deuda: Deuda;

  constructor(deuda: Deuda) {
    super();
    this._deuda = deuda;
  }

  nombre(): NombreDeEstado {
    return "en deuda";
  }

  override falto(evento: Evento, _reglas: Reglas): Estado {
    this._deuda.entrarEnMora(evento.fecha());
    return new Moroso(this._deuda, this.faltas());
  }

  override pago(_fecha: Date, reglas: Reglas): Estado {
    return LibreDeDeuda.oFinalizadoPorFaltas(this.faltas(), reglas);
  }

  override faltas(): number {
    return 1;
  }

  override deudaAl(fecha: Date): number {
    return this._deuda.montoAl(fecha);
  }
}
