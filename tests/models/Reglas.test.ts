import { describe, expect, it } from "vitest";
import { Reglas } from "../../src/models/Reglas.ts";
import { InteresFijoPorDia, SinInteres } from "../../src/models/PoliticaDeInteres.ts";
import { dia, nuevoEvento, reglas } from "./factories.ts";

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

  it("se supera la tolerancia con más faltas que las toleradas", () => {
    const lasReglas = reglas({ toleranciaDeFaltas: 2 });

    expect(lasReglas.superaLaTolerancia(2)).toBe(false);
    expect(lasReglas.superaLaTolerancia(3)).toBe(true);
  });

  it("la deuda por faltar a un evento es por el monto por falta", () => {
    const lasReglas = reglas({ montoPorFalta: 1000 });
    const evento = nuevoEvento();

    const deuda = lasReglas.deudaPorFaltarA(evento);

    expect(deuda.monto()).toBe(1000);
    expect(deuda.eventoFaltado()).toBe(evento);
    expect(deuda.estaEnMora()).toBe(false);
  });

  it("la deuda por faltar a un evento acumula interés en mora según la política de interés", () => {
    const lasReglas = reglas({ politicaDeInteres: new InteresFijoPorDia(10) });
    const deuda = lasReglas.deudaPorFaltarA(nuevoEvento());

    deuda.entrarEnMora(dia(8));

    expect(deuda.montoAl(dia(11))).toBe(1030);
  });
});
