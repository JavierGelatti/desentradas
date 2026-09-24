import { describe, expect, it } from "vitest";
import { DesempateAlfabetico, DesempateAleatorioReproducible } from "../../src/models/Desempate.ts";
import { cobroEnEfectivo } from "./factories.ts";

const nombres = ["carla", "ana", "beto", "dario", "elena", "fabio"];

describe("DesempateAlfabetico", () => {
  it("ordena los nombres alfabéticamente", () => {
    const orden = new DesempateAlfabetico().ordenar(nombres, cobroEnEfectivo());

    expect(orden).toEqual(["ana", "beto", "carla", "dario", "elena", "fabio"]);
  });
});

describe("DesempateAleatorioReproducible", () => {
  const desempate = new DesempateAleatorioReproducible();

  it("produce una permutación de los nombres", () => {
    const orden = desempate.ordenar(nombres, cobroEnEfectivo());

    expect(orden).toHaveLength(nombres.length);
    expect([...orden].sort()).toEqual([...nombres].sort());
  });

  it("no altera la lista de nombres recibida", () => {
    const originales = [...nombres];

    desempate.ordenar(nombres, cobroEnEfectivo());

    expect(nombres).toEqual(originales);
  });

  it("da el mismo orden para dos cobros con los mismos datos", () => {
    const primero = desempate.ordenar(nombres, cobroEnEfectivo({ deudor: "ana", monto: 1000, numero: 3 }));
    const segundo = desempate.ordenar(nombres, cobroEnEfectivo({ deudor: "ana", monto: 1000, numero: 3 }));

    expect(segundo).toEqual(primero);
  });

  it("da distinto orden para cobros con distintos datos", () => {
    const porMil = desempate.ordenar(nombres, cobroEnEfectivo({ monto: 1000 }));
    const porQuinientos = desempate.ordenar(nombres, cobroEnEfectivo({ monto: 500 }));
    const otroDia = desempate.ordenar(nombres, cobroEnEfectivo({ numero: 4 }));
    const otroDeudor = desempate.ordenar(nombres, cobroEnEfectivo({ deudor: "beto" }));

    expect(porQuinientos).not.toEqual(porMil);
    expect(otroDia).not.toEqual(porMil);
    expect(otroDeudor).not.toEqual(porMil);
  });
});
