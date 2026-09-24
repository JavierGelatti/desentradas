import { Evento } from "../../src/models/Evento.ts";
import { Reglas } from "../../src/models/Reglas.ts";
import { type PoliticaDeInteres, SinInteres } from "../../src/models/PoliticaDeInteres.ts";

export const dia = (numero: number) => new Date(`2026-09-${String(numero).padStart(2, "0")}T19:00:00`);

export const nuevoEvento = ({
  numero = 1,
  asistentes = ["otra persona"],
}: { numero?: number; asistentes?: string[] } = {}) => new Evento(dia(numero), asistentes);

export const reglas = ({
  toleranciaDeFaltas = 2,
  montoPorFalta = 1000,
  politicaDeInteres = new SinInteres(),
}: { toleranciaDeFaltas?: number; montoPorFalta?: number; politicaDeInteres?: PoliticaDeInteres } = {}) =>
  new Reglas(toleranciaDeFaltas, montoPorFalta, politicaDeInteres);
