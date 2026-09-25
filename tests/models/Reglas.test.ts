import { describe, expect, it } from "vitest";
import { Reglas } from "../../src/models/Reglas.ts";
import { SinInteres } from "../../src/models/PoliticaDeInteres.ts";
import { dia } from "./factories.ts";

describe("Reglas", () => {
  it("la tolerancia de faltas debe ser al menos 1", () => {
    expect(() => {
      new Reglas(dia(1), 0, 1000, new SinInteres());
    }).toThrow("La tolerancia de faltas debe ser al menos 1");
  });

  it("el monto por falta debe ser positivo", () => {
    expect(() => {
      new Reglas(dia(1), 2, 0, new SinInteres());
    }).toThrow("El monto por falta debe ser positivo");
  });

  it("conocen desde cuándo rigen, la tolerancia de faltas, el monto por falta y la política de interés", () => {
    const politica = new SinInteres();
    const reglas = new Reglas(dia(1), 2, 1000, politica);

    expect(reglas.rigeDesde()).toEqual(dia(1));
    expect(reglas.toleranciaDeFaltas()).toBe(2);
    expect(reglas.montoPorFalta()).toBe(1000);
    expect(reglas.politicaDeInteres()).toBe(politica);
  });
});
