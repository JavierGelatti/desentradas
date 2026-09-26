import type { Aplicacion } from "../app/Aplicacion.ts";
import type { Grupo } from "../models/Grupo.ts";
import type { Hijo } from "./dom.ts";

// Lo que cada pantalla necesita de la vista principal.
export interface Entorno {
  aplicacion(): Aplicacion;
  grupo(): Grupo;
  ahora(): Date;
  refrescar(): void;
  intentarYRefrescar(accion: () => void, errores: HTMLOutputElement): void;
  deshacer(): void;
  irAlHistorial(): void;
  mostrarDialogo(...contenido: Hijo[]): HTMLDialogElement;
}
