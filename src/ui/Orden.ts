import type { Participante } from "../models/Participante.ts";

export const alfabetico = (uno: string, otro: string): number => uno.localeCompare(otro);

export const porNombre = (uno: Participante, otro: Participante): number => alfabetico(uno.nombre(), otro.nombre());
