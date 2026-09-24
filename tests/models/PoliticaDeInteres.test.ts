import { describe, expect, it } from "vitest";
import { InteresFijoPorDia, InteresMensual, SinInteres } from "../../src/models/PoliticaDeInteres.ts";
import { dia } from "./factories.ts";

describe("SinInteres", () => {
  it("el monto no cambia con el paso del tiempo", () => {
    const politica = new SinInteres();

    expect(politica.montoConInteres(1000, dia(1), dia(30))).toBe(1000);
  });
});

describe("InteresFijoPorDia", () => {
  it("suma un monto fijo por cada día completo transcurrido", () => {
    const politica = new InteresFijoPorDia(10);

    expect(politica.montoConInteres(1000, dia(1), dia(1))).toBe(1000);
    expect(politica.montoConInteres(1000, dia(1), dia(4))).toBe(1030);
  });

  it("un día incompleto no suma interés", () => {
    const politica = new InteresFijoPorDia(10);
    const casiDosDias = new Date(dia(3).getTime() - 1);

    expect(politica.montoConInteres(1000, dia(1), casiDosDias)).toBe(1010);
  });
});

describe("InteresMensual", () => {
  it("aplica un porcentaje mensual simple, prorrateado por día completo sobre una base de 30 días", () => {
    const politica = new InteresMensual(30);

    expect(politica.montoConInteres(1000, dia(1), dia(1))).toBe(1000);
    expect(politica.montoConInteres(1000, dia(1), dia(4))).toBe(1030);
    expect(politica.montoConInteres(1000, dia(1), new Date("2026-10-01T19:00:00"))).toBe(1300);
  });

  it("un día incompleto no suma interés", () => {
    const politica = new InteresMensual(30);
    const casiDosDias = new Date(dia(3).getTime() - 1);

    expect(politica.montoConInteres(1000, dia(1), casiDosDias)).toBe(1010);
  });

  it("el resultado se redondea a pesos enteros", () => {
    const politica = new InteresMensual(10);

    expect(politica.montoConInteres(1000, dia(1), dia(2))).toBe(1003);
    expect(politica.montoConInteres(1000, dia(1), dia(3))).toBe(1007);
  });
});
