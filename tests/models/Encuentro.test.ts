import { describe, expect, it } from "vitest";
import { Encuentro } from "../../src/models/Encuentro.ts";
import { dia } from "./factories.ts";

describe("Encuentro", () => {
  it("no puede haber un encuentro sin asistentes", () => {
    expect(() => {
      new Encuentro(dia(1), [], ["ana"]);
    }).toThrow("Un encuentro debe tener al menos un asistente");
  });

  it("nadie puede figurar a la vez como asistente y como ausente", () => {
    expect(() => {
      new Encuentro(dia(1), ["ana", "beto"], ["beto"]);
    }).toThrow("beto no puede figurar a la vez como asistente y como ausente");
  });

  it("registra cuándo ocurrió, quiénes asistieron y quiénes faltaron", () => {
    const encuentro = new Encuentro(dia(1), ["ana", "beto"], ["carla"]);

    expect(encuentro.fecha()).toEqual(dia(1));
    expect(encuentro.asistio("ana")).toBe(true);
    expect(encuentro.asistio("carla")).toBe(false);
    expect([...encuentro.asistentes()]).toEqual(["ana", "beto"]);
    expect([...encuentro.ausentes()]).toEqual(["carla"]);
  });
});
