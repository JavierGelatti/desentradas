import { describe, expect, it } from "vitest";
import {
  politicaDeInteresAJson,
  politicaDeInteresDesdeJson,
  reglasAJson,
  reglasDesdeJson,
} from "../../src/app/json/ReglasJson.ts";
import { InteresFijoPorDia, InteresMensual, SinInteres } from "../../src/models/PoliticaDeInteres.ts";
import { dia, reglas } from "../models/factories.ts";

describe("Reglas en JSON", () => {
  it("las reglas se convierten a JSON con la fecha en formato ISO y vuelven iguales", () => {
    const originales = reglas({ rigeDesde: dia(1), toleranciaDeFaltas: 2, montoPorFalta: 1000 });

    const json = reglasAJson(originales);
    const leidas = reglasDesdeJson(json);

    expect(json).toEqual({
      rigeDesde: dia(1).toISOString(),
      toleranciaDeFaltas: 2,
      montoPorFalta: 1000,
      politicaDeInteres: { tipo: "sin interés" },
    });
    expect(leidas.rigeDesde()).toEqual(dia(1));
    expect(leidas.toleranciaDeFaltas()).toBe(2);
    expect(leidas.montoPorFalta()).toBe(1000);
    expect(leidas.politicaDeInteres()).toBeInstanceOf(SinInteres);
  });

  it("no se pueden leer reglas con una fecha que no está en formato ISO", () => {
    expect(() => {
      reglasDesdeJson({ ...reglasAJson(reglas()), rigeDesde: "ayer" });
    }).toThrow('Formato inválido: "rigeDesde" debe ser una fecha en formato ISO');
  });
});

describe("Políticas de interés en JSON", () => {
  it("el interés fijo por día se convierte a JSON con su monto por día y vuelve igual", () => {
    const json = politicaDeInteresAJson(new InteresFijoPorDia(10));
    const leida = politicaDeInteresDesdeJson(json);

    expect(json).toEqual({ tipo: "fijo por día", montoPorDia: 10 });
    expect(leida).toBeInstanceOf(InteresFijoPorDia);
    expect((leida as InteresFijoPorDia).montoPorDia()).toBe(10);
  });

  it("el interés mensual se convierte a JSON con su porcentaje y vuelve igual", () => {
    const json = politicaDeInteresAJson(new InteresMensual(30));
    const leida = politicaDeInteresDesdeJson(json);

    expect(json).toEqual({ tipo: "mensual", porcentaje: 30 });
    expect(leida).toBeInstanceOf(InteresMensual);
    expect((leida as InteresMensual).porcentaje()).toBe(30);
  });

  it("no se puede leer una política de interés de tipo desconocido", () => {
    expect(() => {
      politicaDeInteresDesdeJson({ tipo: "compuesto" });
    }).toThrow('Formato inválido: política de interés desconocida "compuesto"');
  });
});
