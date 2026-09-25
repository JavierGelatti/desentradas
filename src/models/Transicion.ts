import type { NombreDeEstado } from "./estados/Estado.ts";

export type Accion = "voy" | "falto" | "pago" | "reingresar";

export type Disparador = "ingreso" | Accion;

export class Transicion {
  private _fecha: Date;
  private _disparador: Disparador;
  private _desde: NombreDeEstado | undefined;
  private _hacia: NombreDeEstado;

  static ingreso(fecha: Date, hacia: NombreDeEstado): Transicion {
    return new Transicion(fecha, "ingreso", undefined, hacia);
  }

  constructor(fecha: Date, disparador: Disparador, desde: NombreDeEstado | undefined, hacia: NombreDeEstado) {
    this._fecha = fecha;
    this._disparador = disparador;
    this._desde = desde;
    this._hacia = hacia;
  }

  fecha(): Date {
    return this._fecha;
  }

  disparador(): Disparador {
    return this._disparador;
  }

  desde(): NombreDeEstado | undefined {
    return this._desde;
  }

  hacia(): NombreDeEstado {
    return this._hacia;
  }

  iniciaParticipacion(): boolean {
    return this._disparador === "ingreso" || this._disparador === "reingresar";
  }

  describir(): string {
    if (this._desde === undefined) return `${this._disparador} -> ${this._hacia}`;
    return `${this._disparador}: ${this._desde} -> ${this._hacia}`;
  }
}
