import { describe, expect, it } from "vitest";
import { nuevoCredito } from "./factories.ts";

describe("Crédito", () => {
  it("es un monto a nombre de alguien", () => {
    const credito = nuevoCredito({ acreedor: "beto", monto: 500 });

    expect(credito.acreedor()).toBe("beto");
    expect(credito.monto()).toBe(500);
  });
});
