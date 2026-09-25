import { describe, expect, it } from "vitest";
import { Credito } from "../../src/models/Credito.ts";
import { cobroEnEfectivo } from "./factories.ts";

describe("Crédito", () => {
  it("nace cobrado, pendiente de entrega, a nombre de alguien y por un cobro", () => {
    const cobro = cobroEnEfectivo();

    const credito = new Credito("beto", 500, cobro);

    expect(credito.nombre()).toBe("beto");
    expect(credito.monto()).toBe(500);
    expect(credito.cobro()).toBe(cobro);
    expect(credito.estado()).toBe("cobrado");
    expect(credito.estaPendiente()).toBe(true);
  });

  it("repartirlo lo deja repartido y ya no está pendiente", () => {
    const credito = new Credito("beto", 500, cobroEnEfectivo());

    credito.repartir();

    expect(credito.estado()).toBe("repartido");
    expect(credito.estaPendiente()).toBe(false);
  });

  it("aplicarlo lo deja aplicado y ya no está pendiente", () => {
    const credito = new Credito("beto", 500, cobroEnEfectivo());

    credito.aplicar();

    expect(credito.estado()).toBe("aplicado");
    expect(credito.estaPendiente()).toBe(false);
  });

  it("no se puede repartir ni aplicar un crédito que no está pendiente", () => {
    const credito = new Credito("beto", 500, cobroEnEfectivo());
    credito.repartir();

    expect(() => {
      credito.aplicar();
    }).toThrow("El crédito ya no está pendiente");
    expect(() => {
      credito.repartir();
    }).toThrow("El crédito ya no está pendiente");
  });

  it("dividirlo produce dos créditos pendientes por el mismo cobro que suman el original", () => {
    const cobro = cobroEnEfectivo();
    const credito = new Credito("beto", 500, cobro);

    const [primero, segundo] = credito.dividir(400);

    expect(primero.nombre()).toBe("beto");
    expect(primero.monto()).toBe(400);
    expect(segundo.monto()).toBe(100);
    expect(segundo.cobro()).toBe(cobro);
    expect(primero.estaPendiente()).toBe(true);
    expect(segundo.estaPendiente()).toBe(true);
  });

  it("sólo se puede dividir por un monto positivo y menor al del crédito", () => {
    const credito = new Credito("beto", 500, cobroEnEfectivo());

    expect(() => {
      credito.dividir(500);
    }).toThrow("El monto debe ser positivo y menor al del crédito");
    expect(() => {
      credito.dividir(0);
    }).toThrow("El monto debe ser positivo y menor al del crédito");
  });
});
