import type { Participante } from "../models/Participante.ts";

export const porNombre = (uno: Participante, otro: Participante): number => uno.nombre().localeCompare(otro.nombre());
