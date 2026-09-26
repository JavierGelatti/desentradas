import { campoNumerico } from "./Campos.ts";
import { Dialogo } from "./Dialogo.ts";
import { numeroDe } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";

export class DialogoDeCobro extends Dialogo {
  constructor(entorno: Entorno, nombre: string, deuda: number, cobrar: (monto: number) => void) {
    super(entorno, `Cobrar a ${nombre}`, [campoNumerico("Monto", "monto", deuda, 1)], "Cobrar", (formulario) => {
      cobrar(numeroDe(formulario, "monto"));
    });
  }
}
