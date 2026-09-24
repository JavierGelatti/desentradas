import { describe, expect, it } from "vitest";
import { Cobro } from "../../src/models/Cobro.ts";
import { Credito } from "../../src/models/Credito.ts";
import { cobroEnEfectivo, dia, nuevoEvento } from "./factories.ts";

describe("Cobro", () => {
  it("un cobro en efectivo registra a quién se le cobró, cuánto, cuándo y por qué evento", () => {
    const evento = nuevoEvento({ numero: 2, asistentes: ["beto"] });

    const cobro = new Cobro("ana", 1000, dia(3), evento, "efectivo");

    expect(cobro.deudor()).toBe("ana");
    expect(cobro.monto()).toBe(1000);
    expect(cobro.fecha()).toEqual(dia(3));
    expect(cobro.eventoFaltado()).toBe(evento);
    expect(cobro.origen()).toBe("efectivo");
    expect(cobro.esEnEfectivo()).toBe(true);
  });

  it("un cobro por crédito conserva el crédito aplicado como origen", () => {
    const credito = new Credito("beto", 500, cobroEnEfectivo());
    const eventoQueDebeBeto = nuevoEvento({ numero: 2, asistentes: ["carla"] });

    const cobro = new Cobro("beto", 400, dia(3), eventoQueDebeBeto, credito);

    expect(cobro.deudor()).toBe("beto");
    expect(cobro.monto()).toBe(400);
    expect(cobro.origen()).toBe(credito);
    expect(cobro.esEnEfectivo()).toBe(false);
  });

  it("un crédito sólo se aplica a una deuda de su dueño", () => {
    const creditoDeBeto = new Credito("beto", 500, cobroEnEfectivo());

    expect(() => {
      new Cobro("carla", 400, dia(3), nuevoEvento(), creditoDeBeto);
    }).toThrow("Un crédito sólo se aplica a una deuda de su dueño");
  });

  it("el monto de un cobro debe ser positivo", () => {
    expect(() => {
      cobroEnEfectivo({ monto: 0 });
    }).toThrow("El monto del cobro debe ser positivo");
  });
});
