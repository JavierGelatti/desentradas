import { describe, expect, it } from "vitest";
import { cobroEnEfectivo, nuevoCredito } from "./factories.ts";

describe("Crédito", () => {
  it("nace pendiente de entrega, a nombre de alguien y por un cobro", () => {
    const cobro = cobroEnEfectivo();

    const credito = nuevoCredito({ acreedor: "beto", monto: 500, cobro });

    expect(credito.acreedor()).toBe("beto");
    expect(credito.monto()).toBe(500);
    expect(credito.cobro()).toBe(cobro);
    expect(credito.estado()).toBe("pendiente");
    expect(credito.estaPendiente()).toBe(true);
  });

  it("repartirlo lo deja repartido y ya no está pendiente", () => {
    const credito = nuevoCredito();

    credito.repartir();

    expect(credito.estado()).toBe("repartido");
    expect(credito.estaPendiente()).toBe(false);
  });

  it("aplicarlo lo deja aplicado y ya no está pendiente", () => {
    const credito = nuevoCredito();

    credito.aplicar();

    expect(credito.estado()).toBe("aplicado");
    expect(credito.estaPendiente()).toBe(false);
  });

  it("no se puede aplicar un crédito que no está pendiente", () => {
    const credito = nuevoCredito();
    credito.repartir();

    expect(() => {
      credito.aplicar();
    }).toThrow("El crédito ya no está pendiente");
  });

  it("no se puede repartir un crédito que no está pendiente", () => {
    const credito = nuevoCredito();
    credito.aplicar();

    expect(() => {
      credito.repartir();
    }).toThrow("El crédito ya no está pendiente");
  });

  it("dividirlo produce dos créditos pendientes por el mismo cobro que suman el original", () => {
    const cobro = cobroEnEfectivo();
    const credito = nuevoCredito({ acreedor: "beto", monto: 500, cobro });

    const [primero, segundo] = credito.dividir(400);

    expect(primero.acreedor()).toBe("beto");
    expect(primero.monto()).toBe(400);
    expect(segundo.monto()).toBe(100);
    expect(segundo.cobro()).toBe(cobro);
    expect(primero.estaPendiente()).toBe(true);
    expect(segundo.estaPendiente()).toBe(true);
  });

  it("sólo se puede dividir por un monto positivo y menor al del crédito", () => {
    const credito = nuevoCredito({ monto: 500 });

    expect(() => {
      credito.dividir(500);
    }).toThrow("El monto debe ser positivo y menor al del crédito");
    expect(() => {
      credito.dividir(0);
    }).toThrow("El monto debe ser positivo y menor al del crédito");
  });

  it("no se puede dividir un crédito que no está pendiente", () => {
    const credito = nuevoCredito();
    credito.repartir();

    expect(() => {
      credito.dividir(400);
    }).toThrow("El crédito ya no está pendiente");
  });
});
