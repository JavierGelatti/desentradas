import {
  InteresFijoPorDia,
  InteresMensual,
  type PoliticaDeInteres,
  SinInteres,
} from "../../models/PoliticaDeInteres.ts";
import { Reglas } from "../../models/Reglas.ts";
import { fecha, numero, type Objeto, objeto, segunTipo } from "./Campos.ts";

export type PoliticaDeInteresJson =
  { tipo: "sin interés" } | { tipo: "fijo por día"; montoPorDia: number } | { tipo: "mensual"; porcentaje: number };

export type ReglasJson = {
  rigeDesde: string;
  toleranciaDeFaltas: number;
  montoPorFalta: number;
  politicaDeInteres: PoliticaDeInteresJson;
};

export const reglasAJson = (reglas: Reglas): ReglasJson => ({
  rigeDesde: reglas.rigeDesde().toISOString(),
  toleranciaDeFaltas: reglas.toleranciaDeFaltas(),
  montoPorFalta: reglas.montoPorFalta(),
  politicaDeInteres: politicaDeInteresAJson(reglas.politicaDeInteres()),
});

export const reglasDesdeJson = (json: unknown): Reglas => {
  const campos = objeto(json, "Las reglas");
  return new Reglas(
    fecha(campos, "rigeDesde"),
    numero(campos, "toleranciaDeFaltas"),
    numero(campos, "montoPorFalta"),
    politicaDeInteresDesdeJson(campos["politicaDeInteres"]),
  );
};

export const politicaDeInteresAJson = (politica: PoliticaDeInteres): PoliticaDeInteresJson => {
  if (politica instanceof InteresFijoPorDia) return { tipo: "fijo por día", montoPorDia: politica.montoPorDia() };
  if (politica instanceof InteresMensual) return { tipo: "mensual", porcentaje: politica.porcentaje() };
  if (politica instanceof SinInteres) return { tipo: "sin interés" };

  throw new Error("Política de interés desconocida");
};

const lectoresDePoliticas: Record<PoliticaDeInteresJson["tipo"], (campos: Objeto) => PoliticaDeInteres> = {
  "sin interés": () => new SinInteres(),
  "fijo por día": (campos) => new InteresFijoPorDia(numero(campos, "montoPorDia")),
  mensual: (campos) => new InteresMensual(numero(campos, "porcentaje")),
};

export const politicaDeInteresDesdeJson = (json: unknown): PoliticaDeInteres =>
  segunTipo(objeto(json, "La política de interés"), lectoresDePoliticas, "política de interés desconocida");
