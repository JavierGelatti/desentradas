import {
  InteresFijoPorDia,
  InteresMensual,
  type PoliticaDeInteres,
  SinInteres,
} from "../../models/PoliticaDeInteres.ts";
import { Reglas } from "../../models/Reglas.ts";
import { fecha, formatoInvalido, numero, objeto, texto } from "./Campos.ts";

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

export const politicaDeInteresDesdeJson = (json: unknown): PoliticaDeInteres => {
  const campos = objeto(json, "La política de interés");
  const tipo = texto(campos, "tipo");
  switch (tipo) {
    case "sin interés":
      return new SinInteres();
    case "fijo por día":
      return new InteresFijoPorDia(numero(campos, "montoPorDia"));
    case "mensual":
      return new InteresMensual(numero(campos, "porcentaje"));
    default:
      throw formatoInvalido(`política de interés desconocida "${tipo}"`);
  }
};
