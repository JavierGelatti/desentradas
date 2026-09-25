import { describe, expect, it } from "vitest";
import { InteresFijoPorDia, InteresMensual, SinInteres } from "../../src/models/PoliticaDeInteres.ts";
import { dia } from "./factories.ts";

const conPesos = (monto: number) => `$${monto}`;

describe("SinInteres", () => {
  it("el monto no cambia con el paso del tiempo", () => {
    const politica = new SinInteres();

    expect(politica.montoConInteres(1000, dia(1), dia(30))).toBe(1000);
  });

  it("se describe como sin interés", () => {
    const politica = new SinInteres();

    expect(politica.describir(conPesos)).toBe("sin interés");
  });
});

describe("InteresFijoPorDia", () => {
  it("el monto por día debe ser positivo", () => {
    expect(() => {
      new InteresFijoPorDia(0);
    }).toThrow("El monto por día debe ser positivo");
    expect(() => {
      new InteresFijoPorDia(-10);
    }).toThrow("El monto por día debe ser positivo");
  });

  it("conoce su monto por día", () => {
    const politica = new InteresFijoPorDia(10);

    expect(politica.montoPorDia()).toBe(10);
  });

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

  it("el resultado se redondea a pesos enteros", () => {
    const politica = new InteresFijoPorDia(0.5);

    expect(politica.montoConInteres(1000, dia(1), dia(4))).toBe(1002);
  });

  it("se describe por su monto por día de mora", () => {
    const politica = new InteresFijoPorDia(10);

    expect(politica.describir(conPesos)).toBe("$10 por día de mora");
  });
});

describe("InteresMensual", () => {
  it("el porcentaje mensual debe ser positivo", () => {
    expect(() => {
      new InteresMensual(0);
    }).toThrow("El porcentaje mensual debe ser positivo");
    expect(() => {
      new InteresMensual(-30);
    }).toThrow("El porcentaje mensual debe ser positivo");
  });

  it("conoce su porcentaje", () => {
    const politica = new InteresMensual(30);

    expect(politica.porcentaje()).toBe(30);
  });

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

  it("se describe por su porcentaje por mes de mora", () => {
    const politica = new InteresMensual(30);

    expect(politica.describir(conPesos)).toBe("30 % por mes de mora");
  });
});
