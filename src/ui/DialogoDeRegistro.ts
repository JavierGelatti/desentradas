import { campoDeTexto } from "./Campos.ts";
import { Dialogo } from "./Dialogo.ts";
import { valorDe } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";

// Registro de alguien por su nombre; quien lo abre dice qué significa registrarlo (participante nuevo o asistente).
export class DialogoDeRegistro extends Dialogo {
  constructor(entorno: Entorno, titulo: string, registrar: (nombre: string) => void) {
    super(entorno, titulo, [campoDeTexto("Nombre", "nombre")], "Registrar", (formulario) => {
      registrar(valorDe(formulario, "nombre"));
    });
  }
}
