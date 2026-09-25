import type { Aplicacion } from "../app/Aplicacion.ts";
import type { Grupo } from "../models/Grupo.ts";

// Lo que cada pantalla necesita de la vista principal.
export interface Entorno {
  aplicacion(): Aplicacion;
  grupo(): Grupo;
  ahora(): Date;
  refrescar(): void;
  deshacer(): void;
}
