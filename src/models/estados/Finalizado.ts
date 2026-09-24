import { Estado, type MotivoDeFinalizacion, type NombreDeEstado } from "./Estado.ts";

export class Finalizado extends Estado {
  private _motivo: MotivoDeFinalizacion;

  constructor(motivo: MotivoDeFinalizacion) {
    super();
    this._motivo = motivo;
  }

  nombre(): NombreDeEstado {
    return "finalizado";
  }

  override estaActivo(): boolean {
    return false;
  }

  override motivoDeFinalizacion(): MotivoDeFinalizacion {
    return this._motivo;
  }
}
