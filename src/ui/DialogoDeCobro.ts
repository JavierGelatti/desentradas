import { campoNumerico } from "./Campos.ts";
import { Dialogo } from "./Dialogo.ts";
import { numeroDe } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";

// Cobro a una persona: sólo pide el monto, que arranca en toda su deuda.
// Quien lo abre dice cómo y cuándo se cobra, porque en la puerta del encuentro el cobro además habilita a asistir.
export class DialogoDeCobro extends Dialogo {
  constructor(entorno: Entorno, nombre: string, deuda: number, cobrar: (monto: number) => void) {
    super(entorno, `Cobrar a ${nombre}`, [campoNumerico("Monto", "monto", deuda, 1)], "Cobrar", (formulario) => {
      cobrar(numeroDe(formulario, "monto"));
    });
  }
}
