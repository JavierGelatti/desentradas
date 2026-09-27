import type { Encuentro } from "../Encuentro.ts";
import type { Reglas } from "../Reglas.ts";
import type { Accion } from "../Transicion.ts";
import { TransicionInvalida } from "./TransicionInvalida.ts";

export type NombreDeEstado = "participando" | "en deuda" | "libre de deuda" | "moroso" | "finalizado";

const acciones: readonly Accion[] = ["voy", "falto", "pago", "reingresar"];

export abstract class Estado {
  abstract nombre(): NombreDeEstado;

  accionesPosibles(): readonly Accion[] {
    return acciones.filter((accion) => this._redefine(accion));
  }

  puede(accion: Accion): boolean {
    return this.accionesPosibles().includes(accion);
  }

  voy(): Estado {
    throw new TransicionInvalida("voy", this.nombre());
  }

  falto(_encuentro: Encuentro, _reglas: Reglas): Estado {
    throw new TransicionInvalida("falto", this.nombre());
  }

  pago(_fecha: Date, _monto: number): Estado {
    throw new TransicionInvalida("pago", this.nombre());
  }

  encuentroAdeudado(): Encuentro {
    throw new TransicionInvalida("pago", this.nombre());
  }

  reingresar(): Estado {
    throw new TransicionInvalida("reingresar", this.nombre());
  }

  puedeAsistir(): boolean {
    return false;
  }

  esPosibleAsistente(): boolean {
    return this.puedeAsistir() || this.soloLeFaltaPagarParaAsistir();
  }

  soloLeFaltaPagarParaAsistir(): boolean {
    return false;
  }

  estaAlDia(): boolean {
    return false;
  }

  estaActivo(): boolean {
    return true;
  }

  faltas(): number {
    return 0;
  }

  deudaAl(_fecha: Date): number {
    return 0;
  }

  private _redefine(accion: Accion): boolean {
    return this[accion] !== Estado.prototype[accion];
  }
}
