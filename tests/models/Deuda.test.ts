import { describe, expect, it } from "vitest";
import { Deuda } from "../../src/models/Deuda.ts";
import { dia, nuevoEvento, reglas } from "./factories.ts";
import { InteresFijoPorDia } from "../../src/models/PoliticaDeInteres.ts";

const montoPorFalta = 1000;
const interesDiario = 10;

const reglasConInteresDiario = (montoPorDia: number) =>
  reglas({ montoPorFalta, politicaDeInteres: new InteresFijoPorDia(montoPorDia) });
const lasReglas = reglasConInteresDiario(interesDiario);

describe("Deuda", () => {
  it("se origina por faltar a un evento, por el monto por falta de las reglas", () => {
    const evento = nuevoEvento();
    const deuda = Deuda.porFaltarA(evento, lasReglas);

    expect(deuda.monto()).toBe(montoPorFalta);
    expect(deuda.eventoFaltado()).toBe(evento);
    expect(deuda.estaEnMora()).toBe(false);
  });

  it("mientras no está en mora, vale el monto original en cualquier fecha", () => {
    const deuda = Deuda.porFaltarA(nuevoEvento(), lasReglas);

    expect(deuda.montoAl(dia(20))).toBe(montoPorFalta);
  });

  it("en mora, acumula interés desde la fecha en que entró en mora", () => {
    const deuda = Deuda.porFaltarA(nuevoEvento(), lasReglas);

    deuda.entrarEnMora(dia(8));

    expect(deuda.estaEnMora()).toBe(true);
    expect(deuda.montoAl(dia(8))).toBe(montoPorFalta);
    expect(deuda.montoAl(dia(11))).toBe(montoPorFalta + 3 * interesDiario);
  });

  it("no puede entrar en mora dos veces", () => {
    const deuda = Deuda.porFaltarA(nuevoEvento(), lasReglas);
    deuda.entrarEnMora(dia(8));

    expect(() => deuda.entrarEnMora(dia(9))).toThrow("La deuda ya está en mora");
    expect(deuda.montoAl(dia(11))).toBe(montoPorFalta + 3 * interesDiario);
  });
});
