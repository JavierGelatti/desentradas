import type { Aplicacion } from "../app/Aplicacion.ts";
import type { Grupo } from "../models/Grupo.ts";
import type { BorradorDeEvento } from "./BorradorDeEvento.ts";

// Lo que cada pantalla necesita de la vista principal.
export interface Entorno {
  aplicacion(): Aplicacion;
  grupo(): Grupo;
  borrador(): BorradorDeEvento;
  ahora(): Date;
  refrescar(): void;
  deshacer(): void;
}
