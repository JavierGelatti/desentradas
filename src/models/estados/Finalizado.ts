import { Estado, type MotivoDeFinalizacion, type NombreDeEstado } from "./Estado.ts";
import { Participando } from "./Participando.ts";

export class Finalizado extends Estado {
  private _motivo: MotivoDeFinalizacion;

  constructor(motivo: MotivoDeFinalizacion) {
    super();
    this._motivo = motivo;
  }

  nombre(): NombreDeEstado {
    return "finalizado";
  }

  override reingresar(): Estado {
    return new Participando();
  }

  override estaActivo(): boolean {
    return false;
  }

  override motivoDeFinalizacion(): MotivoDeFinalizacion {
    return this._motivo;
  }
}
