import type { Evento } from "../Evento.ts";
import type { Reglas } from "../Reglas.ts";
import { TransicionInvalida } from "./TransicionInvalida.ts";

export type NombreDeEstado = "participando" | "en deuda" | "libre de deuda" | "moroso" | "finalizado";

export type MotivoDeFinalizacion = "por faltas" | "por pago de morosidad";

// Un estado rechaza todo evento salvo los que redefine explícitamente.
export abstract class Estado {
  abstract nombre(): NombreDeEstado;

  voy(_evento: Evento, _reglas: Reglas): Estado {
    throw new TransicionInvalida("voy", this.nombre());
  }

  falto(_evento: Evento, _reglas: Reglas): Estado {
    throw new TransicionInvalida("falto", this.nombre());
  }

  pago(_fecha: Date, _reglas: Reglas): Estado {
    throw new TransicionInvalida("pago", this.nombre());
  }

  puedeAsistir(): boolean {
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

  motivoDeFinalizacion(): MotivoDeFinalizacion | undefined {
    return undefined;
  }
}
