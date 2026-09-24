import { describe, expect, it } from "vitest";
import { Reglas } from "../../src/models/Reglas.ts";
import { SinInteres } from "../../src/models/PoliticaDeInteres.ts";

describe("Reglas", () => {
  it("la tolerancia de faltas debe ser al menos 1", () => {
    expect(() => {
      new Reglas(0, 1000, new SinInteres());
    }).toThrow("La tolerancia de faltas debe ser al menos 1");
  });

  it("conoce la tolerancia de faltas, el monto por falta y la política de interés", () => {
    const politica = new SinInteres();
    const reglas = new Reglas(2, 1000, politica);

    expect(reglas.toleranciaDeFaltas()).toBe(2);
    expect(reglas.montoPorFalta()).toBe(1000);
    expect(reglas.politicaDeInteres()).toBe(politica);
  });
});
