import { Cobro } from "../../src/models/Cobro.ts";
import { DesempateAlfabetico } from "../../src/models/Desempate.ts";
import { Evento } from "../../src/models/Evento.ts";
import { Grupo } from "../../src/models/Grupo.ts";
import { Reglas } from "../../src/models/Reglas.ts";
import { type PoliticaDeInteres, SinInteres } from "../../src/models/PoliticaDeInteres.ts";

export const dia = (numero: number) => new Date(`2026-09-${String(numero).padStart(2, "0")}T19:00:00`);

export const nuevoEvento = ({
  numero = 1,
  asistentes = ["otra persona"],
}: { numero?: number; asistentes?: string[] } = {}) => new Evento(dia(numero), asistentes);

export const reglas = ({
  rigeDesde = dia(1),
  toleranciaDeFaltas = 2,
  montoPorFalta = 1000,
  politicaDeInteres = new SinInteres(),
}: {
  rigeDesde?: Date;
  toleranciaDeFaltas?: number;
  montoPorFalta?: number;
  politicaDeInteres?: PoliticaDeInteres;
} = {}) => new Reglas(rigeDesde, toleranciaDeFaltas, montoPorFalta, politicaDeInteres);

export const desempate = new DesempateAlfabetico();

export const nuevoGrupo = (reglasIniciales = reglas()) => new Grupo(reglasIniciales, desempate);

export const cobroEnEfectivo = ({
  deudor = "ana",
  monto = 1000,
  numero = 3,
  asistentes = ["beto", "carla"],
  evento = nuevoEvento({ numero: 2, asistentes }),
}: { deudor?: string; monto?: number; numero?: number; asistentes?: string[]; evento?: Evento } = {}) =>
  new Cobro(deudor, monto, dia(numero), evento, "efectivo");
