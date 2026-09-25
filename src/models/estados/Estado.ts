import type { Cobro, OrigenDeCobro } from "../Cobro.ts";
import type { Evento } from "../Evento.ts";
import type { Reglas } from "../Reglas.ts";
import type { Accion } from "../Transicion.ts";
import { TransicionInvalida } from "./TransicionInvalida.ts";

export type NombreDeEstado = "participando" | "en deuda" | "libre de deuda" | "moroso" | "finalizado";

export type MotivoDeFinalizacion = "por faltas" | "por pago de morosidad";

const acciones: readonly Accion[] = ["voy", "falto", "pago", "reingresar"];

export abstract class Estado {
  abstract nombre(): NombreDeEstado;

  accionesPosibles(): readonly Accion[] {
    return acciones.filter((accion) => this._redefine(accion));
  }

  puede(accion: Accion): boolean {
    return this.accionesPosibles().includes(accion);
  }

  voy(_evento: Evento, _reglas: Reglas): Estado {
    throw new TransicionInvalida("voy", this.nombre());
  }

  falto(_evento: Evento, _reglas: Reglas): Estado {
    throw new TransicionInvalida("falto", this.nombre());
  }

  pago(_fecha: Date, _monto: number, _reglas: Reglas): Estado {
    throw new TransicionInvalida("pago", this.nombre());
  }

  cobroA(_deudor: string, _monto: number, _fecha: Date, _origen: OrigenDeCobro): Cobro {
    throw new TransicionInvalida("pago", this.nombre());
  }

  reingresar(): Estado {
    throw new TransicionInvalida("reingresar", this.nombre());
  }

  puedeAsistir(): boolean {
    return false;
  }

  // Puede asistir ahora, o podría después de pagar: es a quien se espera en el próximo evento.
  esPosibleAsistente(): boolean {
    return this.puedeAsistir();
  }

  necesitaPagarParaAsistir(): boolean {
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

  eventoAdeudado(): Evento | undefined {
    return undefined;
  }

  motivoDeFinalizacion(): MotivoDeFinalizacion | undefined {
    return undefined;
  }

  private _redefine(accion: Accion): boolean {
    return this[accion] !== Estado.prototype[accion];
  }
}
